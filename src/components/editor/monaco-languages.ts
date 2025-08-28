import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
// import "monaco-editor/esm/vs/language/json/monaco.contribution";

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

// Configure TypeScript compiler options, disable DOM library
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ES2020,
  allowNonTsExtensions: true,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  module: monaco.languages.typescript.ModuleKind.CommonJS,
  noEmit: true,
  esModuleInterop: true,
  jsx: monaco.languages.typescript.JsxEmit.React,
  reactNamespace: "React",
  allowJs: true,
  typeRoots: ["node_modules/@types"],
  // Explicitly specify only Node.js types, exclude DOM types
  lib: [], // Don't include any default libraries
  types: ["node"], // Only include Node.js types
});

// Configure TypeScript diagnostic options, enable semantic validation for proper Node.js types usage
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false, // Enable semantic validation to check Node.js API usage
  noSyntaxValidation: false, // Enable syntax validation
  noSuggestionDiagnostics: false,
  diagnosticCodesToIgnore: [
    1375, // 'await' expressions are only allowed at the top level of a file when that file is a module
    2304, // Cannot find name (for DOM globals like 'window', 'document' etc.)
    2339, // Property does not exist on type (for DOM properties)
    2552, // Cannot find name 'console' (if console is not available in pure Node.js context)
  ],
});

const eager = false;

if (eager) {
  const allDts = import.meta.glob("../../../node_modules/@types/node/**/*.d.ts", {
    eager: true,
    query: "?raw",
    import: "default",
  }) as Record<string, string>;

  const libs = Object.entries(allDts).map(([path, content]) => ({
    content,
    filePath: path.replace("../../../node_modules/", "file:///node_modules/"),
  }));

  monaco.languages.typescript.typescriptDefaults.setExtraLibs(libs);
} else {
  const allDts = import.meta.glob("../../../node_modules/@types/node/**/*.d.ts", {
    eager: false,
    query: "?raw",
    import: "default",
  }) as Record<string, () => Promise<string>>;

  Promise.all(
    Object.entries(allDts).map(async ([path, loader]) => ({
      content: await loader(),
      filePath: path.replace("../../../node_modules/", "file:///node_modules/"),
    }))
  ).then((libs) => {
    monaco.languages.typescript.typescriptDefaults.setExtraLibs(libs);
  });
}
