<script lang="ts" context="module">
	export { type Terminal } from '@xterm/xterm';
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import '@xterm/xterm/css/xterm.css';
	import { Terminal } from '@xterm/xterm';
	//@ts-ignore
	import { WebLinksAddon } from '@xterm/addon-web-links';
	import { FitAddon } from '@xterm/addon-fit';
	const fitAddon = new FitAddon();

	export const term = new Terminal({
		disableStdin: true,
		fontFamily: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
		convertEol: true // this is necessary for windows
	});
	term.loadAddon(new WebLinksAddon());
	term.loadAddon(fitAddon);

	let termElement: HTMLDivElement;
	const ro = new ResizeObserver((entries) => {
		for (let entry of entries) {
			const { width, height } = entry.contentRect;
			term.resize(Math.ceil(width / 8.5), Math.ceil(height / 18.4 - 1));
			console.log({ cols: term.cols, rows: term.rows });
		}
	});

	onMount(() => {
		term.open(termElement);
		ro.observe(termElement);
		fitAddon.fit();
	});

	onDestroy(() => {
		term.dispose();
		ro.disconnect();
	});

	let className: string = '';
	export { className as class };

	$: {
		className;
		fitAddon.fit();
	}
</script>

<div class={className} {...$$restProps} bind:this={termElement}></div>
