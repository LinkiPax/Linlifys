import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = "theme";
const THEMES = ["light", "dark", "system"];

const isBrowser = () => typeof window !== "undefined";

const getPreferredTheme = () => {
  if (!isBrowser()) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getInitialTheme = () => {
  if (!isBrowser()) return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return THEMES.includes(stored) ? stored : "system";
};

const resolveTheme = (theme) => (theme === "system" ? getPreferredTheme() : theme);

const applyThemeClasses = (theme) => {
  if (typeof document === "undefined") return;

  const actualTheme = resolveTheme(theme);
  const roots = [document.documentElement, document.body].filter(Boolean);

  roots.forEach((root) => {
    root.classList.remove("dark-theme", "light-theme", "dark-mode");
    root.classList.add(`${actualTheme}-theme`);
    root.dataset.theme = actualTheme;
    if (actualTheme === "dark") root.classList.add("dark-mode");
  });

  document.documentElement.dataset.themePreference = theme;
  document.documentElement.style.colorScheme = actualTheme;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() =>
    resolveTheme(getInitialTheme())
  );

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    const actualTheme = resolveTheme(theme);
    setResolvedTheme(actualTheme);
    applyThemeClasses(theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme !== "system") return;
      const actualTheme = mediaQuery.matches ? "dark" : "light";
      setResolvedTheme(actualTheme);
      applyThemeClasses(theme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const currentResolvedTheme = resolveTheme(currentTheme);
      return currentResolvedTheme === "dark" ? "light" : "dark";
    });
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      isDarkMode: resolvedTheme === "dark",
      toggleTheme,
    }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
