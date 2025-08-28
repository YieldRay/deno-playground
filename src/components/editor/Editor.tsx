import { useRef, useEffect, type FC } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { useIsDark } from "@/components/theme-provider";

import "./monaco-features";
import "./monaco-languages";
import "./monaco-workers";

interface Props {
  value?: string;
  onChange?: (value: string) => void;
}

export const Editor: FC<Props> = ({ value = "", onChange }) => {
  const monacoEl = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const isDark = useIsDark();

  useEffect(() => {
    if (!monacoEl.current) return;

    // A model represents a file that has been opened.
    const model = monaco.editor.createModel(
      value,
      "typescript",
      // Each model is identified by a URI.
      monaco.Uri.parse("file:///tmp/main.ts")
    );

    // An editor is a user facing view of the model.
    const editor = monaco.editor.create(monacoEl.current!, {
      model,
      automaticLayout: true,
      autoDetectHighContrast: true,
      minimap: { enabled: false },
      theme: isDark ? "vs-dark" : "vs",
    });

    const changeHandler = () => {
      const currentValue = editor.getValue();
      onChange?.(currentValue);
    };

    editor.onDidChangeModelContent(changeHandler);
    editorRef.current = editor;

    return () => {
      model.dispose();
      editor.dispose();
    };
    // value is init value, so value+onChange is NOT in the dependency array
  }, [isDark]);

  // Separate effect to handle value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== value) {
      editorRef.current.setValue(value);
    }
  }, [value]);

  return <div style={{ width: "100%", height: "100%" }} ref={monacoEl} />;
};

Editor.displayName = "Editor";
