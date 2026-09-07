import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaGlobe,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaArrowRight,
  FaCheck,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { useThemeContext } from "../../context/ThemeContext";
import "./MainNavbar.css";

const languages = [
  { code: "EN", name: "English", flag: "🇺🇸", country: "United States" },
  { code: "ES", name: "Español", flag: "🇪🇸", country: "Spain" },
  { code: "FR", name: "Français", flag: "🇫🇷", country: "France" },
  { code: "DE", name: "Deutsch", flag: "🇩🇪", country: "Germany" },
  { code: "JA", name: "日本語", flag: "🇯🇵", country: "Japan" },
  { code: "ZH", name: "中文", flag: "🇨🇳", country: "China" },
  { code: "HI", name: "हिन्दी", flag: "🇮🇳", country: "India" },
  { code: "PT", name: "Português", flag: "🇵🇹", country: "Portugal" },
  { code: "IT", name: "Italiano", flag: "🇮🇹", country: "Italy" },
  { code: "AR", name: "العربية", flag: "🇸🇦", country: "Saudi Arabia" },
];

export default function MainNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedLang, setSelectedLang] = useState(languages[0]);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);
  const navigate = useNavigate();

  const { isDarkMode, toggleTheme } = useThemeContext();

  // Scroll detection for frosted glass navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click outside to close language dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(e.target)
      ) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Smooth scroll to sections on the landing page
  const scrollToSection = (id) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className={`main-navbar-wrapper ${scrolled ? "scrolled" : ""}`}>
      <nav className="main-navbar" aria-label="Main Navigation">
        {/* Left: Brand Logo */}
        <div className="navbar-brand">
          <Link to="/" className="brand-logo" aria-label="Linkipax Homepage">
            <div className="brand-icon-wrapper">
              <span className="brand-icon-symbol">LP</span>
              <span className="brand-icon-glow" />
            </div>
            <span className="brand-name">
              Linki<span className="brand-highlight">pax</span>
            </span>
            <span className="brand-badge">PRO</span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links */}
        <ul className="navbar-nav-links">
          <li>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("features")}
            >
              Features
            </button>
          </li>
          <li>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("dual-identity")}
            >
              Dual Identity
            </button>
          </li>
          <li>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("meeting-room")}
            >
              Meeting Room
            </button>
          </li>
          <li>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("opportunities")}
            >
              Opportunities
            </button>
          </li>
          <li>
            <button
              type="button"
              className="nav-link-btn"
              onClick={() => scrollToSection("global-network")}
            >
              Network
            </button>
          </li>
        </ul>

        {/* Right: Actions (Theme Switcher, Language, Auth) */}
        <div className="navbar-actions">
          {/* Theme Switcher Toggle (Light vs B&W Noir) */}
          <button
            type="button"
            className="navbar-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to Light Aesthetic Mode" : "Switch to Black & White Mode"}
            title={isDarkMode ? "Switch to Light Aesthetic Mode" : "Switch to Black & White Mode"}
          >
            <span className="theme-toggle-icon">
              {isDarkMode ? <FaSun style={{ color: "#f59e0b" }} /> : <FaMoon style={{ color: "#475569" }} />}
            </span>
            <span className="theme-toggle-label">
              {isDarkMode ? "Light" : "B&W Mode"}
            </span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="language-selector" ref={langDropdownRef}>
            <button
              type="button"
              className={`lang-pill-btn ${langDropdownOpen ? "active" : ""}`}
              onClick={() => setLangDropdownOpen((prev) => !prev)}
              aria-expanded={langDropdownOpen}
              aria-label="Select Language"
            >
              <span className="lang-flag">{selectedLang.flag}</span>
              <span className="lang-code">{selectedLang.code}</span>
              <FaChevronDown
                className={`lang-chevron ${langDropdownOpen ? "open" : ""}`}
              />
            </button>

            {langDropdownOpen && (
              <div className="lang-dropdown-menu" role="menu">
                <div className="lang-dropdown-header">
                  <span>Select Regional Language</span>
                </div>
                <div className="lang-list">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      className={`lang-option ${
                        selectedLang.code === lang.code ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedLang(lang);
                        setLangDropdownOpen(false);
                      }}
                      role="menuitem"
                    >
                      <span className="option-flag">{lang.flag}</span>
                      <div className="option-meta">
                        <span className="option-name">{lang.name}</span>
                        <span className="option-country">{lang.country}</span>
                      </div>
                      {selectedLang.code === lang.code && (
                        <FaCheck className="option-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sign In Ghost Button */}
          <Link to="/login" className="nav-btn nav-btn-ghost">
            Sign In
          </Link>

          {/* Get Started Primary CTA */}
          <Link to="/Signup" className="nav-btn nav-btn-primary">
            <span>Get Started</span>
            <FaArrowRight className="btn-arrow" />
            <span className="btn-shine" />
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${isOpen ? "open" : ""}`}>
        <div className="mobile-nav-content">
          <ul className="mobile-nav-links">
            <li>
              <button
                type="button"
                className="mobile-link-btn"
                onClick={() => scrollToSection("features")}
              >
                Features
              </button>
            </li>
            <li>
              <button
                type="button"
                className="mobile-link-btn"
                onClick={() => scrollToSection("dual-identity")}
              >
                Dual Identity Workspace
              </button>
            </li>
            <li>
              <button
                type="button"
                className="mobile-link-btn"
                onClick={() => scrollToSection("meeting-room")}
              >
                3D Meeting Room
              </button>
            </li>
            <li>
              <button
                type="button"
                className="mobile-link-btn"
                onClick={() => scrollToSection("opportunities")}
              >
                AI Opportunities
              </button>
            </li>
            <li>
              <button
                type="button"
                className="mobile-link-btn"
                onClick={() => scrollToSection("global-network")}
              >
                Global Network
              </button>
            </li>
          </ul>

          <div className="mobile-nav-footer">
            {/* Mobile Theme Switcher */}
            <button
              type="button"
              className="mobile-btn mobile-btn-ghost"
              onClick={toggleTheme}
            >
              {isDarkMode ? <FaSun style={{ color: "#f59e0b" }} /> : <FaMoon />}
              <span>{isDarkMode ? "Switch to Light Aesthetic" : "Switch to Black & White Mode"}</span>
            </button>

            <Link
              to="/login"
              className="mobile-btn mobile-btn-ghost"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/Signup"
              className="mobile-btn mobile-btn-primary"
              onClick={() => setIsOpen(false)}
            >
              <span>Get Started Free</span>
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
