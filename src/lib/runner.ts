import { type Events } from '$lib/components/Playground.svelte';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import mitt from 'mitt';

/**
 * for debug
 */
export function runEval(code: string) {
	const emitter = mitt<Events>();
	emitter.emit('ready');

	setTimeout(() => {
		try {
			new Function('console', code)({
				...console,
				log: (...args: any[]) => {
					emitter.emit('stdout', String(args) + '\r\n');
				},
				error: (...args: any[]) => {
					emitter.emit('stderr', String(args) + '\r\n');
				},
				clear: () => {
					emitter.emit('stdout', '\x1b[2J\x1b[H');
					emitter.emit('stderr', '\x1b[2J\x1b[H');
				}
			});
		} catch (e) {
			emitter.emit('stderr', String(e));
		} finally {
			emitter.emit('exit', 'end');
		}
	});

	return emitter;
}

export function createRunEventStream(url: string) {
	return (code: string) => {
		const emitter = mitt<Events>();

		fetchEventSource(url, {
			method: 'POST',
			body: code,
			onmessage({ event, data }) {
				if (event === 'stdout' || event === 'stderr') {
					const buf = decodeBase64(data);
					console.log({ event, buf, text: new TextDecoder().decode(buf) });
					emitter.emit(event, buf);
				} else {
					console.log({ event, text: data });
					emitter.emit(event as any, data);
				}
			},
			onerror(e) {
				emitter.emit('exit', 'Network Error');
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
