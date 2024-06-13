<script lang="ts">
	import Playground from '$lib/Playground.svelte';
	import { runEval, createRunEventStream } from '$lib/runner';
	//TODO: WIP, should use a real server
	const initCode = `console.log(Deno.version)`;
</script>

<Playground
	title="Deno Playground"
	{initCode}
	run={createRunEventStream('http://localhost:8000/event-stream')}
>
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
