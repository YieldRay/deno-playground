/**
 * This script should run in a virtual environment,
 * as it execute by: deno run `-A`
 */

import { encodeBase64 } from 'jsr:@std/encoding/base64';
import ServeRouter from 'https://esm.sh/serve-router@1';

const TIMEOUT = 10 * 1000;

const app = ServeRouter();

app.all('/', () => new Response(`Usage:\n\nPOST /event-stream\ncode`));

app.all('/event-stream', async (req) => {
	const code =
		req.method === 'GET' ? new URL(req.url).searchParams.get('code') || '' : await req.text();

	let child: Deno.ChildProcess;
	const body = new ReadableStream({
		async start(controller) {
			try {
				const filepath = await Deno.makeTempFile({ prefix: 'temp_run' });
				await Deno.writeTextFile(filepath, code);
				console.log({ date: new Date(), filepath, content: code });

				const cmd = new Deno.Command(Deno.execPath(), {
					args: ['run', '-Ar', filepath],
					stdin: 'null',
					stdout: 'piped',
					stderr: 'piped',
					clearEnv: true,
					cwd: await Deno.makeTempDir(),
					signal: AbortSignal.timeout(TIMEOUT)
				});

				child = cmd.spawn();
				// pipe both stdout stderr
				await Promise.all<void>([
					(async () => {
						for await (const chunk of child.stdout) {
							controller.enqueue(
								new TextEncoder().encode(`event: stdout\ndata: ${encodeBase64(chunk)}\n\n`)
							);
						}
					})(),
					(async () => {
						for await (const chunk of child.stderr) {
							controller.enqueue(
								new TextEncoder().encode(`event: stderr\ndata: ${encodeBase64(chunk)}\n\n`)
							);
						}
					})()
				]);

				console.log({
					date: new Date(),
					filepath,
					pid: child.pid,
					code: (await child.status).code
				});
			} finally {
				controller.close();
			}
		},
		cancel() {
			child?.kill();
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

Deno.serve(app.fetch);