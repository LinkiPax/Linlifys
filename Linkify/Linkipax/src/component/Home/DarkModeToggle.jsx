import React from "react";
import { Button } from "react-bootstrap";
import { FaMoon, FaSun } from "react-icons/fa";

const DarkModeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <Button
      variant="link"
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {darkMode ? <FaSun className="icon" /> : <FaMoon className="icon" />}
    </Button>
  );
};

export default DarkModeToggle;