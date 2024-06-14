<script lang="ts">
	import Playground from '$lib/components/Playground.svelte';
	import { createRunEventStream } from '$lib/runner';
	const initCode = `console.log(Deno.version)`;

	const defaultServerUrl =
		location.origin.endsWith('.488848.xyz') || location.origin.endsWith('.deta.app')
			? '/api/event-stream'
			: 'https://deno.488848.xyz/api/event-stream';

	import { getToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();
	let inputText = localStorage.getItem('serverUrl') || '';
	let serverUrl = localStorage.getItem('serverUrl') || '';
	$: localStorage.setItem('serverUrl', serverUrl);

	const set = () => {
		if (!inputText) {
			toastStore.trigger({
				message: `Server has been reset to default!`,
				timeout: 2000
			});
			serverUrl = defaultServerUrl;
			return;
		}

		try {
			const url = new URL(inputText, location.origin).href;
			serverUrl = url;
			toastStore.trigger({
				message: `Server has been set to ${url}`,
				timeout: 2000
			});
		} catch (e) {
			serverUrl = defaultServerUrl;
			toastStore.trigger({
				message: String(e),
				timeout: 2000
			});
		}
	};
</script>

<svelte:head>
	<title>Deno Playground</title>
</svelte:head>

<Playground
	title="Deno Playground"
	{initCode}
	run={createRunEventStream(serverUrl || defaultServerUrl)}
>
	<aside class="min-h-[95vh] p-4 flex flex-col justify-between">
		<div>
			<h1 class="p-8 text-3xl text-center">Deno Playground</h1>

			<nav class="list-nav">
				<ul class="select-none">
					{#each Object.entries( { 'Deno Manual': 'https://docs.deno.com/runtime/manual', 'Deno by Example': 'https://docs.deno.com/examples', 'Another Playground': 'https://www.mycompiler.io/new/deno' } ) as [name, href], index (href)}
						<li>
							<a {href} target="_blank" on:dragstart={(e) => e.preventDefault()}>{name}</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>

		<div class="mt-4 card p-4">
			<label class="label">
				<span>Custom Runner Server API</span>
				<small>(leave blank to set default)</small>
				<div class="flex gap-2">
					<input
						bind:value={inputText}
						class="input variant-form-material"
						type="text"
						placeholder="http://localhost:8000/event-stream"
						on:keydown={(e) => {
							if (e.key === 'Enter') set();
						}}
					/>
					<button type="button" class="btn variant-filled btn-sm rounded" on:click={set}>Set</button
					>
				</div>
			</label>
		</div>
	</aside>
</Playground>
