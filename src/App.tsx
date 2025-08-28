import { useState, useRef } from "react";
import { ChevronDown, ChevronUp, Play, Pen, Maximize2, Minimize2 } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useLocalStorage } from "react-use";
import type { Terminal } from "@xterm/xterm";
import { toast } from "sonner";
import { createRunEventStream } from "./lib/api";
import { useEncodedState } from "./lib/use-encoded-state";
import MonacoEditor from "./components/editor";
import Hotkeys from "./components/Hotkeys";
import { XTerm } from "./components/XTerm";
import { ThemeToggler } from "./components/theme-toggler";
import { PromptDialog } from "./components/PromptDialog";

const INIT_CODE = `console.log(process.version)`;

export default function App() {
  const instance = useRef<Terminal>(null);

  const [remoteURL, setRemoteURL] = useLocalStorage("createRunEventStreamURL", "/api/run");
  const runEventStream = createRunEventStream(remoteURL!);

  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [value, setValue] = useEncodedState(INIT_CODE);
  const [isRunning, setIsRunning] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const outputPanelRef = useRef<ImperativePanelHandle>(null);

  const DEFAULT_SIZE = 20;
  const MIN_SIZE = 3;

  const toggleCollapse = () => {
    const panel = outputPanelRef.current;
    if (!panel) return;

    if (isOutputCollapsed) {
      panel.resize(DEFAULT_SIZE);
      setIsOutputCollapsed(false);
    } else {
      panel.resize(MIN_SIZE);
      setIsOutputCollapsed(true);
    }
  };

  const toggleFullscreen = () => {
    const panel = outputPanelRef.current;
    if (!panel) return;

    if (isFullscreen) {
      panel.resize(DEFAULT_SIZE);
      setIsFullscreen(false);
    } else {
      panel.resize(100);
      setIsFullscreen(true);
    }
  };

  const run = async () => {
    if (isRunning) return;
    const term = instance.current;
    if (!term) return;

    setIsRunning(true);
    term.clear();

    const emitter = runEventStream(value);

    emitter.on("ready", () => term.clear());
    emitter.on("stdout", (data) => term.write(data));
    emitter.on("stderr", (data) => term.write(data));
    emitter.on("exit", (code) => {
      setIsRunning(false);
      term.write("\r\n");
      if (code === "0") {
        term.write(`\x1b[32m[Exit] ${code}\x1b[0m\r\n`);
      } else {
        term.write(`\x1b[31m[Exit] ${code}\x1b[0m\r\n`);
      }
    });
  };

  return (
    <ResizablePanelGroup direction="vertical" className="h-full">
      <ResizablePanel>
        <MonacoEditor value={value} onChange={setValue} />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        ref={outputPanelRef}
        defaultSize={DEFAULT_SIZE}
        minSize={MIN_SIZE}
        onResize={(size) => {
          setIsOutputCollapsed(size <= MIN_SIZE);
          setIsFullscreen(size === 100);
        }}
      >
        <div className="h-full grid grid-rows-[auto_1fr]">
          <header className="px-1 flex items-center justify-between mb-1">
            <span className="underline">Console</span>
            <div className="flex gap-4">
              <Hotkeys keys="$mod+Enter" fn={run} disabled={isRunning}>
                <Play size={16} />
              </Hotkeys>

              <Hotkeys keys="$mod+U" fn={() => setIsPromptDialogOpen(true)}>
                <Pen size={16} />
              </Hotkeys>

              <Hotkeys keys="$mod+0" fn={toggleFullscreen}>
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Hotkeys>

              <ThemeToggler />

              <Hotkeys keys="$mod+\" fn={toggleCollapse}>
                {isOutputCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Hotkeys>
            </div>
          </header>

          <XTerm ref={instance} className="scrollbar overflow-auto flex-1 mx-1 whitespace-pre-wrap break-all" />
        </div>
      </ResizablePanel>

      <PromptDialog
        open={isPromptDialogOpen}
        onOpenChange={setIsPromptDialogOpen}
        title="Set Remote URL"
        description="Please enter the new remote URL"
        defaultValue={remoteURL || ""}
        placeholder="Enter URL..."
        onConfirm={(newURL) => {
          if (newURL.trim()) {
            setRemoteURL(newURL.trim());
            toast.success("URL updated successfully");
          } else {
            toast.info("No changes made");
          }
          setIsPromptDialogOpen(false);
        }}
        onCancel={() => {
          toast.info("No changes made");
          setIsPromptDialogOpen(false);
        }}
      />
    </ResizablePanelGroup>
  );
}
