<script lang="ts">
	import Playground, { type Events } from '$lib/Playground.svelte';
	import mitt from 'mitt';

	const initCode = `console.log('Deno.version')`;

	const run = async (code: string) => {
		const emitter = mitt<Events>();

		requestAnimationFrame(() => {
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
	};
</script>

<Playground title="Deno Playground" {initCode} {run} />
