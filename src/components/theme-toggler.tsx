import { useTheme } from "./theme-provider";
import { Sun, Moon, SunMoon } from "lucide-react";
import Hotkeys from "./Hotkeys";

const themes = ["system", "light", "dark"] as const;

export function ThemeToggler() {
  const { theme, setTheme } = useTheme();

  const toggle = () => {
    const index = themes.indexOf(theme);
    const next = (index + 1) % themes.length;
    setTheme(themes[next]);
  };

  const Icon = () => {
    switch (theme) {
      case "system":
        return <SunMoon size={16} />;
      case "light":
        return <Sun size={16} />;
      case "dark":
        return <Moon size={16} />;
    }
  };

  return (
    <Hotkeys keys="ctrl+alt+9" fn={toggle}>
      <Icon></Icon>
    </Hotkeys>
  );
}
