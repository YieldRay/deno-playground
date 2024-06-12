<script lang="ts">
	import Playground from '$lib/Playground.svelte';
	import { runEval, createRunEventStream } from '$lib/runner';
	//TODO: WIP, should use a real server
	const initCode = `console.log('Deno.version')`;
</script>

<Playground
	title="Deno Playground"
	{initCode}
	run={createRunEventStream('http://localhost:8000/event-stream')}
/>
