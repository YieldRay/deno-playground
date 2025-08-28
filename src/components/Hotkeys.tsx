import { useHotkeys, type Keys } from "react-hotkeys-hook";
import { clsx } from "clsx";

export default function Shortcut({
  children,
  keys,
  fn,
  disabled,
}: React.PropsWithChildren<{
  keys: Keys;
  fn: VoidFunction;
  disabled?: boolean;
}>) {
  useHotkeys(keys, fn);
  return (
    <span
      aria-disabled={disabled}
      title={String(keys || "")}
      className={clsx(disabled ? "cursor-not-allowed" : "cursor-pointer")}
      onClick={() => {
        if (disabled) return;
        fn();
      }}
    >
      {children}
    </span>
  );
}
