/**
 * This script should run in a virtual (sandbox) environment,
 * as it runs untrusted code and execute with any of:
 *
 * bun run main.ts
 * deno run -a bun.ts
 * npm i -g tsx && tsx main.ts
 *
 * Note that this script is written in node.js
 * So both node/bun/deno are supported
 */

import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import child_process from 'node:child_process';
import { Buffer } from 'node:buffer';

const encodeBase64 = (u8a: ArrayBuffer) => Buffer.from(u8a).toString('base64');

const PORT = Number(process.env['PORT']) || 8000;
const TIMEOUT = 20 * 1000;

const server = http.createServer(async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
	res.setHeader('Cache-Control', 'no-store');
	res.setHeader('Access-Control-Allow-Methods', '*');
	res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');

	// TODO: only POST is supported for now, should support query string
	const send = (event: string, data: string) =>
		res.write(new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`));

	const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'bun_playground_'));

	// set config
	await fs.writeFile(
		// https://bun.sh/docs/runtime/bunfig
		path.join(cwd, 'bunfig.toml'),
		'[install.cache]\r\n' +
			Object.entries({
				dir: path.join(os.tmpdir(), '/.bun/install/cache'),
				disable: false,
				disableManifest: false
			})
				.map(([k, v]) => `${k} = ${typeof v === 'string' ? JSON.stringify(v) : v}`)
				.join('\r\n'),
		'utf-8'
	);

	const filepath = path.join(cwd, 'index.tsx');

	// save req body to file
	const fileStream = createWriteStream(filepath);

	req.pipe(fileStream);

	try {
		await new Promise((resolve, reject) => {
			fileStream.on('finish', resolve);
			fileStream.on('error', reject);
		});
	} catch (e) {
		send('exit', 'Server Error');
		res.end();
		console.error(e);
	}

	// https://bun.sh/docs/cli/run#run-a-file
	// https://nodejs.org/docs/latest/api/cli.html#options
	const child = child_process.spawn('bun', ['--trace-exit', 'run', filepath], {
		cwd,
		timeout: TIMEOUT,
		stdio: ['ignore', 'pipe', 'pipe'],
		env: {
			// https://bun.sh/docs/runtime/env#configuring-bun
			// https://nodejs.org/docs/latest/api/cli.html#environment-variables_1
			NODE_TLS_REJECT_UNAUTHORIZED: '0',
			BUN_CONFIG_VERBOSE_FETCH: 'curl',
			BUN_RUNTIME_TRANSPILER_CACHE_PATH: '0',
			FORCE_COLOR: '1',
			DO_NOT_TRACK: '1'
		},
		killSignal: 'SIGKILL'
	});
	send('ready', filepath);

	// pipe both stdout stderr
	child.stdout!.on('data', (chunk) => send('stdout', encodeBase64(chunk)));
	child.stderr!.on('data', (chunk) => send('stderr', encodeBase64(chunk)));

	child.on('exit', () => {
		const code = child.exitCode!;
		send('exit', `Exit status: ${code}`);
		res.end();

		console.log({
			date: new Date(),
			cwd,
			pid: child.pid,
			code
		});
	});

	child.on('error', (e) => {
		child.kill('SIGKILL');
		send('exit', 'Interrupted');
		res.end();
		console.error(e);
	});
});

server.listen(PORT).on('listening', () => console.log(`http://localhost:${PORT}`));
