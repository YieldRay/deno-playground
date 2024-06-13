<script lang="ts">
	import Playground from '$lib/components/Playground.svelte';
	import { createRunEventStream } from '$lib/runner';
	const initCode = `console.log(Deno.version)`;

	const run = createRunEventStream(
		location.origin.endsWith('.488848.xyz') || location.origin.endsWith('.deta.app')
			? '/api/event-stream'
			: 'https://deno.488848.xyz/api/event-stream'
	);
</script>

<Playground title="Deno Playground" {initCode} {run}>
	<aside class="p-4">
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
	</aside>
</Playground>
