import { type Events } from '$lib/Playground.svelte';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import mitt from 'mitt';

/**
 * for debug
 */
export async function runEval(code: string) {
	const emitter = mitt<Events>();

	setTimeout(() => {
		try {
			new Function('console', code)({
				...console,
				log: (...args: any[]) => {
					emitter.emit('stdout', String(args));
				},
				error: (...args: any[]) => {
					emitter.emit('stderr', String(args));
				},
				clear: () => {
					emitter.emit('stdout', '\x1b[2J\x1b[H');
					emitter.emit('stderr', '\x1b[2J\x1b[H');
				}
			});
		} catch (e) {
			emitter.emit('stderr', String(e));
		}
	});

	return emitter;
}

export function createRunEventStream(url: string) {
	return async (code: string) => {
		const emitter = mitt<Events>();

		fetchEventSource(url, {
			method: 'POST',
			body: code,
			onmessage({ event, data }) {
				const buf = decodeBase64(data);
				console.log({ event, buf, text: new TextDecoder().decode(buf) });
				emitter.emit(event as 'stdout' | 'stderr', buf);
			},
			onerror(e) {
				emitter.emit('stderr', String(e));
				throw e;
			}
		});

		return emitter;
	};
}

export function decodeBase64(str: string): Uint8Array {
	const binary = atob(str);
	const bytes = new Uint8Array(new ArrayBuffer(binary.length));
	const half = binary.length / 2;
	for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
		bytes[i] = binary.charCodeAt(i);
		bytes[j] = binary.charCodeAt(j);
	}
	return bytes;
}
