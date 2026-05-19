import { useEffect, useState } from "react";

type Theme = "boy" | "girl";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "boy";
    return (localStorage.getItem("eclipse-theme") as Theme) || "boy";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-boy", "theme-girl");
    root.classList.add(theme === "girl" ? "theme-girl" : "theme-boy");
    localStorage.setItem("eclipse-theme", theme);
  }, [theme]);

  return { theme, setTheme, toggle: () => setTheme((t) => (t === "boy" ? "girl" : "boy")) };
}
