/**
 * This script should run in a virtual (sandbox) environment,
 * as it runs untrusted code and execute with: deno run -A main.ts
 */

import { encodeBase64 } from 'jsr:@std/encoding/base64';
import ServeRouter from 'https://esm.sh/serve-router@1.1.0';

const PORT = Number(Deno.env.get('PORT')) || 8000;
const TIMEOUT = 10 * 1000;

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
	const body = new ReadableStream({
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
				const filepath = await Deno.makeTempFile({ prefix: 'deno_playground_' });
				await Deno.writeTextFile(filepath, code);
				console.log({ date: new Date(), filepath, content: code });

				const cmd = new Deno.Command(Deno.execPath(), {
					args: [
						'run',
						'-A',
						'-r',
						'--no-prompt',
						'--lock-write',
						'--unstable-bare-node-builtins',
						'--unstable-byonm',
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
					stdin: 'null',
					stdout: 'piped',
					stderr: 'piped',
					// clearEnv: true,
					cwd: await Deno.makeTempDir(),
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
					filepath,
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
