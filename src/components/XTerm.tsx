import "@xterm/xterm/css/xterm.css";
import { clsx } from "clsx";
import { forwardRef, useEffect, useRef, useImperativeHandle } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useIsDark } from "@/components/theme-provider";

export const XTerm = forwardRef<Terminal, React.HTMLAttributes<HTMLDivElement>>(function (
  { className, ...props },
  ref
) {
  const divRef = useRef<HTMLDivElement>(null);
  const instance = useRef<Terminal>(null);
  const isDark = useIsDark();

  useEffect(() => {
    if (!divRef.current) return;
    const fitAddon = new FitAddon();

    const ro = new ResizeObserver(() => {
      const term = instance.current;
      if (!term) return;
      fitAddon.fit();
      // term.resize(Math.ceil(width / 8.5), Math.ceil(height / 14.5));
    });
    ro.observe(divRef.current);

    const term = new Terminal({
      disableStdin: true,
      convertEol: true,
      fontFamily: `ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace`,
    });
    term.loadAddon(fitAddon);
    instance.current = term;
    term.open(divRef.current);

    return () => {
      term.dispose();
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const term = instance.current;
    if (!term) return;
    term.options.theme = isDark
      ? {
          background: "#000",
          foreground: "#ddd",
          cursor: "#eee",
        }
      : {
          background: "#fff",
          foreground: "#333",
          cursor: "#444",
        };
  }, [isDark]);

  useImperativeHandle(
    ref,
    () => {
      return new Proxy({} as unknown as Terminal, {
        get(_, prop) {
          const term = instance.current!;
          return Reflect.get(term, prop);
        },
      });
    },
    [instance]
  );

  return <div ref={divRef} {...props} className={clsx("w-full h-full", className)} />;
});
