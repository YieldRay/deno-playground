<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { modeCurrent } from '@skeletonlabs/skeleton';
	import * as monaco from 'monaco-editor';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
	import init, { format } from '@wasm-fmt/web_fmt/vite';

	/**
	 * https://microsoft.github.io/monaco-editor/typedoc/index.html
	 */
	let editorElement: HTMLDivElement;
	let editor: monaco.editor.IStandaloneCodeEditor;
	let model: monaco.editor.ITextModel;

	export let language = 'javascript';
	/** init code, no bind! */
	export let value = '';
	export const getValue = () => model.getValue();
	export const setValue = (v: string) => model.setValue(v);
	export const trigger: typeof editor.trigger = (...args) => editor.trigger(...args);

	function loadCode(code: string, language: string) {
		model = monaco.editor.createModel(code, language);
		editor.setModel(model);
	}

	onMount(async () => {
		self.MonacoEnvironment = {
			getWorker: function (_: any, label: string) {
				if (label === 'typescript' || label === 'javascript') {
					return new tsWorker();
				}
				return new editorWorker();
			}
		};

		monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
		monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: true,
			noSyntaxValidation: true // This line disables errors in jsx tags like <div>, etc.
		});

		await init();
		for (const [name, filename] of Object.entries({
			typescript: 'nain.ts',
			json: 'filename.json',
			javascript: 'index.js'
		}))
			monaco.languages.registerDocumentFormattingEditProvider(name, {
				provideDocumentFormattingEdits(model, options) {
					const formatted = format(model.getValue(), filename);
					return [
						{
							range: model.getFullModelRange(),
							text: formatted
						}
					];
				}
			});

		// https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md
		editor = monaco.editor.create(editorElement, {
			automaticLayout: true,
			fixedOverflowWidgets: true,
			theme: $modeCurrent ? 'vs' : 'vs-dark'
		});

		queueMicrotask(async () => {
			try {
				const libSource = await (await fetch('lib.deno.d.ts')).text();
				const libUri = 'ts:denoland/deno/releases/download/v1.44.1/lib.deno.d.ts';
				monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
				monaco.editor.createModel(libSource, 'typescript', monaco.Uri.parse(libUri));
			} catch (e) {
				console.error(e);
			}
		});

		loadCode(value, language);
	});

	$: {
		modeCurrent.subscribe((isLight) => {
			monaco.editor.setTheme(isLight ? 'vs' : 'vs-dark');
		});
	}

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();
	});
</script>

<div {...$$restProps} bind:this={editorElement} />
