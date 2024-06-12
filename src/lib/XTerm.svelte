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

	export const term = new Terminal();
	term.loadAddon(new WebLinksAddon());
	term.loadAddon(fitAddon);

	let termElement: HTMLDivElement;

	onMount(() => {
		term.open(termElement);
		fitAddon.fit();
	});

	onDestroy(() => {
		term.dispose();
	});

	let className: string;
	export { className as class };

	$: {
		className;
		fitAddon.fit();
	}
</script>

<div class={className} {...$$restProps} bind:this={termElement}></div>
