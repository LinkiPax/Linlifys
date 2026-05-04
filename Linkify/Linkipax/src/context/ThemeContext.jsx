import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext();

const getPreferredTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
};

const applyThemeClasses = (theme) => {
  const actualTheme = theme === "system" ? getPreferredTheme() : theme;
  document.documentElement.classList.remove("dark-theme", "light-theme", "dark-mode");
  document.documentElement.classList.add(`${actualTheme}-theme`);
  document.documentElement.dataset.theme = actualTheme;
  document.documentElement.style.colorScheme = actualTheme;
  document.body.classList.remove("dark-theme", "light-theme", "dark-mode");
  document.body.classList.add(`${actualTheme}-theme`);
  document.body.dataset.theme = actualTheme;
  if (actualTheme === "dark") {
    document.documentElement.classList.add("dark-mode");
    document.body.classList.add("dark-mode");
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("light");

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    if (!theme) return;
    localStorage.setItem("theme", theme);
    const actualTheme = theme === "system" ? getPreferredTheme() : theme;
    setResolvedTheme(actualTheme);
    applyThemeClasses(theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        setResolvedTheme(systemTheme);
        applyThemeClasses(theme);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, toggleTheme }),
    [theme, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
