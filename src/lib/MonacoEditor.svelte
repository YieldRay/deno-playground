<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { modeCurrent } from '@skeletonlabs/skeleton';
	import * as monaco from 'monaco-editor';
	import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
	import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
	import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
	import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
	import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
	import init, { format } from '@wasm-fmt/web_fmt/vite';

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
				if (label === 'json') {
					return new jsonWorker();
				}
				if (label === 'css' || label === 'scss' || label === 'less') {
					return new cssWorker();
				}
				if (label === 'html' || label === 'handlebars' || label === 'razor') {
					return new htmlWorker();
				}
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
			theme: $modeCurrent ? 'vs' : 'vs-dark'
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
