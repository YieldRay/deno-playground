import { tinykeys, type KeyBindingMap } from "tinykeys";
import { clsx } from "clsx";
import { useCallback, useEffect } from "react";

export const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

// eslint-disable-next-line react-refresh/only-export-components
export function useKeyboardShortcuts(kbm: KeyBindingMap) {
  useEffect(() => {
    const unsubscribe = tinykeys(window, kbm);
    return () => {
      unsubscribe();
    };
  }, [kbm]);
}

export default function Shortcut({
  children,
  keys,
  fn,
  disabled,
}: React.PropsWithChildren<{
  keys: string;
  fn: VoidFunction;
  disabled?: boolean;
}>) {
  const cb = useCallback(() => {
    if (disabled) return;
    fn();
  }, [fn, disabled]);

  useKeyboardShortcuts({
    [keys]: cb,
  });

  const title = isMac
    ? keys.replace("$mod", "⌘").replace("alt", "⌥").replace("shift", "⇧")
    : keys.replace("$mod", "ctrl").replace("alt", "alt").replace("shift", "shift");

  return (
    <span
      aria-disabled={disabled}
      title={title}
      className={clsx(disabled ? "cursor-not-allowed" : "cursor-pointer")}
      onClick={cb}
    >
      {children}
    </span>
  );
}
