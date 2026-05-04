import React from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { useThemeContext } from "../context/ThemeContext";
import "./ThemeToggle.css";

export function ThemeToggle({
  className = "",
  showLabel = false,
  variant = "inline",
  size = "default",
}) {
  const { isDarkMode, toggleTheme } = useThemeContext();
  const label = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      className={`theme-toggle theme-toggle-${variant} theme-toggle-${size} ${className}`.trim()}
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      data-theme-state={isDarkMode ? "dark" : "light"}
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </span>
      {showLabel && <span className="theme-toggle-label">{isDarkMode ? "Light" : "Dark"}</span>}
    </button>
  );
}

export function GlobalThemeToggle() {
  const { pathname } = useLocation();
  const routeHasOwnThemeControl =
    pathname === "/" ||
    pathname.startsWith("/home/") ||
    pathname.startsWith("/profile/") ||
    pathname === "/shorts" ||
    pathname === "/uploadshorts";

  if (routeHasOwnThemeControl) return null;

  return <ThemeToggle variant="floating" size="large" />;
}
