/**
 * This script should run in a virtual (sandbox) environment,
 * as it runs untrusted code and execute with: 
 * 
 * deno run -A deno.ts
 */

import { encodeBase64 } from 'jsr:@std/encoding/base64';
import ServeRouter from 'https://esm.sh/serve-router@1.1.0';

const PORT = Number(Deno.env.get('PORT')) || 8000;
const TIMEOUT = 10 * 1000;
const HOME =
	Deno.env.get('XDG_CONFIG_HOME') ||
	(Deno.build.os === 'windows' ? Deno.env.get('USERPROFILE') : Deno.env.get('HOME'))!;
const DENO_DIR = Deno.env.get('DENO_DIR') || `${HOME}/.cache/deno-playground`;

const app = ServeRouter();
app.all(
	'/',
	() =>
		new Response(`Usage:

POST /event-stream
{code}

GET /event-stream?code={code}
`)
);

app.all('/event-stream', async (req) => {
	const code =
		req.method === 'GET' ? new URL(req.url).searchParams.get('code') || '' : await req.text();

	let child: Deno.ChildProcess;
	const body = new ReadableStream<Uint8Array>({
		async start(controller) {
			/** https://developer.mozilla.org/docs/Web/API/Server-sent_events */
			const send = (event: string, data: string) =>
				controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${data}\n\n`));

			// [events]
			// ready : string
			// stdout: base64
			// stderr: base64
			// exit  : string

			try {
				const cwd = await Deno.makeTempDir({ prefix: 'deno_playground_' });
				const filepath = `${cwd}/index.tsx`;
				await Deno.writeTextFile(filepath, code);
				console.log({ date: new Date(), cwd, content: code });

				const cmd = new Deno.Command(Deno.execPath(), {
					args: [
						'run',
						'-A',
						'-r',
						'--no-prompt',
						'--lock-write',
						/** https://docs.deno.com/runtime/manual/tools/unstable_flags */
						'--unstable-bare-node-builtins',
						// '--unstable-byonm',
						// '--unstable-sloppy-imports',
						'--unstable-unsafe-proto',
						'--unstable-webgpu',
						'--unstable-broadcast-channel',
						'--unstable-worker-options',
						'--unstable-cron',
						'--unstable-kv',
						'--unstable-ffi',
						'--unstable-fs',
						'--unstable-net',
						filepath
					],
					/** https://docs.deno.com/runtime/manual/getting_started/setup_your_environment#environment-variables */
					env: { DENO_DIR },
					stdin: 'null',
					stdout: 'piped',
					stderr: 'piped',
					clearEnv: Deno.build.os === 'windows' ? false : true,
					cwd,
					signal: AbortSignal.timeout(TIMEOUT)
				});

				child = cmd.spawn();
				send('ready', filepath);

				// pipe both stdout stderr
				await Promise.all<void>([
					(async () => {
						for await (const chunk of child.stdout) send('stdout', encodeBase64(chunk));
					})(),
					(async () => {
						for await (const chunk of child.stderr) send('stderr', encodeBase64(chunk));
					})()
				]);

				const status = await child.status;
				send(
					'exit',
					status.success
						? `Normal program termination. Exit status: ${status.code}`
						: `Exit status: ${status.code}`
				);

				console.log({
					date: new Date(),
					cwd,
					pid: child.pid,
					code: status.code
				});
			} catch (e) {
				console.error(e);
				send('exit', 'Interrupted');
			} finally {
				controller.close();
			}
		},
		cancel() {
			// force the process to kill
			child?.kill('SIGKILL');
		}
	});

	return new Response(body, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-store',
			'Access-Control-Allow-Origin': req.headers.has('origin') ? req.headers.get('origin')! : '*',
			'Access-Control-Allow-Methods': '*'
		}
	});
});

Deno.serve({
	handler: app.fetch,
	port: PORT
});
