<script lang="ts" context="module">
	export type Events = {
		stdout: string | Uint8Array;
		stderr: string | Uint8Array;
		ready: void;
		exit: string;
	};
</script>

<script lang="ts">
	import { atou, utoa } from '$lib/share';
	import { copy } from '$lib/copy';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import MonacoEditor from '$lib/components/MonacoEditor.svelte';
	let me: { getValue: () => string; setValue: (v: string) => void; trigger: Function };
	import XTerm, { type Terminal } from '$lib/components/XTerm.svelte';
	import ArrowButton from '$lib/components/ArrowButton.svelte';
	import PanelButton from '$lib/components/PanelButton.svelte';
	let xterm: Terminal;

	export let title: string;
	export let initCode: string = '';

	let showTerm = true;
	let topBottom = true;

	import { getModalStore } from '@skeletonlabs/skeleton';
	const modalStore = getModalStore();

	import { Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	const drawerStore = getDrawerStore();

	import { getToastStore } from '@skeletonlabs/skeleton';
	const toastStore = getToastStore();

	const clear = () => {
		modalStore.trigger({
			type: 'confirm',
			title: 'Please Confirm',
			body: 'Are you sure you wish to clear?',
			response: (yes) => {
				if (yes) {
					me.setValue('');
					xterm.write('\x1b[2J\x1b[H');
					toastStore.trigger({
						message: 'Cleared!',
						timeout: 1000
					});
				}
			}
		});
	};

	const fmt = () => {
		me.trigger('editor', 'editor.action.formatDocument');
		toastStore.trigger({
			message: 'Formatted!',
			timeout: 1000
		});
	};
	const share = () => {
		const encoded = utoa(me.getValue());
		location.hash = encoded;
		copy(location.href);

		toastStore.trigger({
			message: 'Share link copyed!',
			timeout: 2000
		});
	};

	import { type Emitter } from 'mitt';
	import { onDestroy, onMount } from 'svelte';
	let statusText = '0 Errors';

	export let run: (code: string) => Emitter<Events>;

	let lastEmitter: Emitter<Events> | undefined = undefined;

	let triggerRun = async () => {
		statusText = 'Preparing...';

		if (lastEmitter) {
			(lastEmitter as Emitter<any>).off('*');
		}

		const spinner = ['|', '/', '-', '\\'];
		let i = 0;
		const timeout = setInterval(() => {
			xterm.write('\r' + spinner[i]);
			i = (i + 1) % spinner.length;
		}, 100);

		const clear = () => {
			xterm.clear();
			xterm.write('\x1b[2J\x1b[H');
		};
		clear();

		const emitter = run(me.getValue());

		emitter.on('exit', (s) => {
			statusText = s;
			(emitter as Emitter<any>).off('*');
		});
		emitter.on('ready', () => {
			clearInterval(timeout);
			clear();
			statusText = 'Running...';
			emitter.on('stdout', (s) => xterm.write(s));
			emitter.on('stderr', (s) => xterm.write(s));
		});

		lastEmitter = emitter;
	};

	const keydown = (event: KeyboardEvent) => {
		if (event.ctrlKey && event.altKey && event.key === 'n') {
			triggerRun();
		}
		if (event.ctrlKey && event.key === '\\') {
			topBottom = !topBottom;
		}
	};

	onMount(() => {
		document.addEventListener('keydown', keydown);
		const encoded = location.hash.slice(1);
		if (encoded) {
			try {
				const decoded = atou(encoded);
				initCode = decoded;
			} catch (e) {
				console.error(e);
			}
		}
	});
	onDestroy(() => {
		document.removeEventListener('keydown', keydown);
	});
</script>

<div class="h-[100vh] flex flex-col">
	<header class="h-[3rem] p-2 flex gap-4 justify-between items-center">
		<div class="flex items-center gap-2">
			<button
				class="p-2"
				on:click={() =>
					drawerStore.open({
						width: 'w-[280px] md:w-[480px]',
						padding: 'p-4',
						rounded: 'rounded-xl'
					})}
			>
				<svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z"
						fill="currentColor"
						fill-rule="evenodd"
						clip-rule="evenodd"
					></path></svg
				>
			</button>
			<h1>{title}</h1>
		</div>

		<div class="btn-group h-8 flex-shrink overflow-x-auto" style="scrollbar-width: thin;">
			<button on:click={triggerRun}
				><svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					><path d="M6 11L6 4L10.5 7.5L6 11Z" fill="currentColor"></path></svg
				>&nbsp;&nbsp;Run</button
			>
			<button on:click={clear}
				><svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="M8.36052 0.72921C8.55578 0.533948 8.87236 0.533948 9.06763 0.72921L14.2708 5.93235C14.466 6.12761 14.466 6.4442 14.2708 6.63946L8.95513 11.9551L7.3466 13.5636C6.76081 14.1494 5.81106 14.1494 5.22528 13.5636L1.43635 9.7747C0.850563 9.18891 0.850563 8.23917 1.43635 7.65338L3.04488 6.04485L8.36052 0.72921ZM8.71407 1.78987L4.10554 6.3984L8.60157 10.8944L13.2101 6.28591L8.71407 1.78987ZM7.89447 11.6015L3.39843 7.10551L2.14346 8.36049C1.94819 8.55575 1.94819 8.87233 2.14346 9.06759L5.93238 12.8565C6.12765 13.0518 6.44423 13.0518 6.63949 12.8565L7.89447 11.6015Z"
						fill="currentColor"
						fill-rule="evenodd"
						clip-rule="evenodd"
					></path></svg
				>&nbsp;&nbsp;Clear</button
			>
			<button on:click={fmt}
				><svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="M13.9 0.499976C13.9 0.279062 13.7209 0.0999756 13.5 0.0999756C13.2791 0.0999756 13.1 0.279062 13.1 0.499976V1.09998H12.5C12.2791 1.09998 12.1 1.27906 12.1 1.49998C12.1 1.72089 12.2791 1.89998 12.5 1.89998H13.1V2.49998C13.1 2.72089 13.2791 2.89998 13.5 2.89998C13.7209 2.89998 13.9 2.72089 13.9 2.49998V1.89998H14.5C14.7209 1.89998 14.9 1.72089 14.9 1.49998C14.9 1.27906 14.7209 1.09998 14.5 1.09998H13.9V0.499976ZM11.8536 3.14642C12.0488 3.34168 12.0488 3.65826 11.8536 3.85353L10.8536 4.85353C10.6583 5.04879 10.3417 5.04879 10.1465 4.85353C9.9512 4.65827 9.9512 4.34169 10.1465 4.14642L11.1464 3.14643C11.3417 2.95116 11.6583 2.95116 11.8536 3.14642ZM9.85357 5.14642C10.0488 5.34168 10.0488 5.65827 9.85357 5.85353L2.85355 12.8535C2.65829 13.0488 2.34171 13.0488 2.14645 12.8535C1.95118 12.6583 1.95118 12.3417 2.14645 12.1464L9.14646 5.14642C9.34172 4.95116 9.65831 4.95116 9.85357 5.14642ZM13.5 5.09998C13.7209 5.09998 13.9 5.27906 13.9 5.49998V6.09998H14.5C14.7209 6.09998 14.9 6.27906 14.9 6.49998C14.9 6.72089 14.7209 6.89998 14.5 6.89998H13.9V7.49998C13.9 7.72089 13.7209 7.89998 13.5 7.89998C13.2791 7.89998 13.1 7.72089 13.1 7.49998V6.89998H12.5C12.2791 6.89998 12.1 6.72089 12.1 6.49998C12.1 6.27906 12.2791 6.09998 12.5 6.09998H13.1V5.49998C13.1 5.27906 13.2791 5.09998 13.5 5.09998ZM8.90002 0.499976C8.90002 0.279062 8.72093 0.0999756 8.50002 0.0999756C8.2791 0.0999756 8.10002 0.279062 8.10002 0.499976V1.09998H7.50002C7.2791 1.09998 7.10002 1.27906 7.10002 1.49998C7.10002 1.72089 7.2791 1.89998 7.50002 1.89998H8.10002V2.49998C8.10002 2.72089 8.2791 2.89998 8.50002 2.89998C8.72093 2.89998 8.90002 2.72089 8.90002 2.49998V1.89998H9.50002C9.72093 1.89998 9.90002 1.72089 9.90002 1.49998C9.90002 1.27906 9.72093 1.09998 9.50002 1.09998H8.90002V0.499976Z"
						fill="currentColor"
						fill-rule="evenodd"
						clip-rule="evenodd"
					></path></svg
				>&nbsp;&nbsp;Format</button
			>
			<button on:click={share}>
				<svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="M5 7.50003C5 8.32845 4.32843 9.00003 3.5 9.00003C2.67157 9.00003 2 8.32845 2 7.50003C2 6.6716 2.67157 6.00003 3.5 6.00003C4.32843 6.00003 5 6.6716 5 7.50003ZM5.71313 8.66388C5.29445 9.45838 4.46048 10 3.5 10C2.11929 10 1 8.88074 1 7.50003C1 6.11931 2.11929 5.00003 3.5 5.00003C4.46048 5.00003 5.29445 5.54167 5.71313 6.33616L9.10424 4.21671C9.03643 3.98968 9 3.74911 9 3.50003C9 2.11932 10.1193 1.00003 11.5 1.00003C12.8807 1.00003 14 2.11932 14 3.50003C14 4.88074 12.8807 6.00003 11.5 6.00003C10.6915 6.00003 9.97264 5.61624 9.51566 5.0209L5.9853 7.22738C5.99502 7.31692 6 7.40789 6 7.50003C6 7.59216 5.99502 7.68312 5.9853 7.77267L9.51567 9.97915C9.97265 9.38382 10.6915 9.00003 11.5 9.00003C12.8807 9.00003 14 10.1193 14 11.5C14 12.8807 12.8807 14 11.5 14C10.1193 14 9 12.8807 9 11.5C9 11.2509 9.03643 11.0104 9.10425 10.7833L5.71313 8.66388ZM11.5 5.00003C12.3284 5.00003 13 4.32846 13 3.50003C13 2.6716 12.3284 2.00003 11.5 2.00003C10.6716 2.00003 10 2.6716 10 3.50003C10 4.32846 10.6716 5.00003 11.5 5.00003ZM13 11.5C13 12.3285 12.3284 13 11.5 13C10.6716 13 10 12.3285 10 11.5C10 10.6716 10.6716 10 11.5 10C12.3284 10 13 10.6716 13 11.5Z"
						fill="currentColor"
						fill-rule="evenodd"
						clip-rule="evenodd"
					></path></svg
				>&nbsp;&nbsp;Share
			</button>
		</div>

		<LightSwitch class="flex-shrink-0" />
	</header>

	<div class={`h-[calc(100vh-3rem)] flex ${topBottom ? 'flex-col' : 'flex-row'}`}>
		<MonacoEditor
			class={topBottom
				? showTerm
					? 'h-[calc(100vh-3rem-20rem)]'
					: 'h-[calc(100vh-3rem-1.5rem)]'
				: 'h-[calc(100vh-3rem)] w-[calc(100vw-max(25vw,16rem))]'}
			value={initCode}
			bind:this={me}
		/>

		<div
			style:height={topBottom ? (showTerm ? '20rem' : '1.5rem') : ''}
			style:width={topBottom ? '100%' : 'max(25vw,16rem)'}
			class="overflow-hidden flex flex-col"
		>
			<header class="h-[1.5rem] flex justify-between p-1">
				<span class="text-xs">OUTPUT</span>

				<aside class="flex gap-2 items-center">
					<PanelButton bind:active={topBottom} />
					{#if topBottom}
						<ArrowButton bind:active={showTerm} />
					{/if}
				</aside>
			</header>

			<XTerm class="h-[17.25rem] flex-1 bg-black" bind:term={xterm} />
			<footer
				class="h-[1.25rem] text-xs bg-[#007fd4] text-white px-2 flex items-center justify-between gap-2 select-none"
			>
				<div class="text-ellipsis">
					{statusText}
				</div>
				<div>
					<a href="https://github.com/yieldray/deno-playground" target="_blank">
						<svg
							width="15"
							height="15"
							viewBox="0 0 15 15"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							><path
								d="M7.49933 0.25C3.49635 0.25 0.25 3.49593 0.25 7.50024C0.25 10.703 2.32715 13.4206 5.2081 14.3797C5.57084 14.446 5.70302 14.2222 5.70302 14.0299C5.70302 13.8576 5.69679 13.4019 5.69323 12.797C3.67661 13.235 3.25112 11.825 3.25112 11.825C2.92132 10.9874 2.44599 10.7644 2.44599 10.7644C1.78773 10.3149 2.49584 10.3238 2.49584 10.3238C3.22353 10.375 3.60629 11.0711 3.60629 11.0711C4.25298 12.1788 5.30335 11.8588 5.71638 11.6732C5.78225 11.205 5.96962 10.8854 6.17658 10.7043C4.56675 10.5209 2.87415 9.89918 2.87415 7.12104C2.87415 6.32925 3.15677 5.68257 3.62053 5.17563C3.54576 4.99226 3.29697 4.25521 3.69174 3.25691C3.69174 3.25691 4.30015 3.06196 5.68522 3.99973C6.26337 3.83906 6.8838 3.75895 7.50022 3.75583C8.1162 3.75895 8.73619 3.83906 9.31523 3.99973C10.6994 3.06196 11.3069 3.25691 11.3069 3.25691C11.7026 4.25521 11.4538 4.99226 11.3795 5.17563C11.8441 5.68257 12.1245 6.32925 12.1245 7.12104C12.1245 9.9063 10.4292 10.5192 8.81452 10.6985C9.07444 10.9224 9.30633 11.3648 9.30633 12.0413C9.30633 13.0102 9.29742 13.7922 9.29742 14.0299C9.29742 14.2239 9.42828 14.4496 9.79591 14.3788C12.6746 13.4179 14.75 10.7025 14.75 7.50024C14.75 3.49593 11.5036 0.25 7.49933 0.25Z"
								fill="currentColor"
								fill-rule="evenodd"
								clip-rule="evenodd"
							></path></svg
						>
					</a>
				</div>
			</footer>
		</div>
	</div>
</div>
<Drawer>
	<slot></slot>
</Drawer>
