import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

import "monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution";
import "monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution";
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
// import "monaco-editor/esm/vs/language/json/monaco.contribution";

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

// 配置 TypeScript 编译器选项，禁用 DOM 库
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
  // 明确指定只包含 Node.js 类型，排除 DOM 类型
  lib: [], // 不包含任何默认库
  types: ["node"], // 只包含 Node.js 类型
});

// 配置 TypeScript 诊断选项，启用语义验证以便正确使用 Node.js 类型
monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false, // 启用语义验证以检查 Node.js API 使用
  noSyntaxValidation: false, // 启用语法验证
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
