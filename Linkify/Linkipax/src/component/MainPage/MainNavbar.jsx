import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./MainNavbar.css";

const MainNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [scrolled, setScrolled] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const languages = [
    { code: "EN", name: "English", country: "United States" },
    { code: "FR", name: "Français", country: "France" },
    { code: "ES", name: "Español", country: "Spain" },
    { code: "DE", name: "Deutsch", country: "Germany" },
    { code: "IT", name: "Italiano", country: "Italy" },
    { code: "PT", name: "Português", country: "Portugal" },
    { code: "RU", name: "Русский", country: "Russia" },
    { code: "JA", name: "日本語", country: "Japan" },
    { code: "ZH", name: "中文", country: "China" },
    { code: "AR", name: "العربية", country: "Saudi Arabia" },
    { code: "HI", name: "हिन्दी", country: "India" },
  ];

  const selectLanguage = (langCode) => {
    setLanguage(langCode);
    setShowLanguageModal(false);
  };

  return (
    <nav className={`navbars ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Left - Logo */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo">
            Linkipax
          </Link>
        </div>

        {/* Center - Navigation links */}
        <ul className={`navbar-center navbar-menu ${isOpen ? "active" : ""}`}>
          <li className="navbar-item">
            <Link to="/about" className="navbar-link">
              About
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/help" className="navbar-link">
              Help
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/pricing" className="navbar-link">
              Pricing
            </Link>
          </li>
          <li className="navbar-item">
            <Link to="/community" className="navbar-link">
              Community
            </Link>
          </li>
        </ul>

        {/* Right - Auth buttons & language toggle */}
        <div className="navbar-right">
          <div
            className="language-toggle-container"
            onMouseEnter={() => setShowLanguageModal(true)}
            onMouseLeave={() => setShowLanguageModal(false)}
          >
            <button
              className="language-toggle"
              onClick={() => setShowLanguageModal(!showLanguageModal)}
            >
              {language}
              <span className="language-arrow">▼</span>
            </button>

            {showLanguageModal && (
              <div className="language-modal">
                <div className="language-modal-content">
                  <h4>Select Language</h4>
                  <ul className="language-list">
                    {languages.map((lang) => (
                      <li
                        key={lang.code}
                        className={`language-option ${
                          language === lang.code ? "selected" : ""
                        }`}
                        onClick={() => selectLanguage(lang.code)}
                      >
                        <span className="language-flag">{lang.code}</span>
                        <span className="language-name">{lang.name}</span>
                        <span className="language-country">{lang.country}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <Link to="/login" className="navbar-link login-btn">
            Login
          </Link>
          <Link to="/signup" className="navbar-link signup-btn">
            Sign Up
          </Link>
          <button className="navbar-toggle" onClick={toggleMenu}>
            <span className={`hamburger ${isOpen ? "open" : ""}`}></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;
