import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();
  const [heroMode, setHeroMode] = useState("merged");

  const modeDescriptions = {
    personal: {
      title: "Personal Space",
      desc: "Connect privately with friends, share genuine moments, and manage your personal circles with zero workplace clutter.",
      icon: "👨‍💻",
      highlight: "Private & Social",
    },
    professional: {
      title: "Professional Workspace",
      desc: "Present your verified credentials, expand your business network, join meeting rooms, and discover top career opportunities.",
      icon: "💼",
      highlight: "Career & Network",
    },
    merged: {
      title: "Unified Experience",
      desc: "Seamlessly balance your daily life and career in one unified dashboard — toggle between identities anytime with one click.",
      icon: "✨",
      highlight: "All-in-One",
    },
  };

  const handleScrollDown = () => {
    const nextSection = document.querySelector(".video-showcase-section, .toggle-section, .meeting-room-section");
    if (nextSection) {
      nextSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    }
  };

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-content">
        {/* Top Feature Badge */}
        <div className="hero-badge">
          <span className="badge-sparkle">✦</span>
          <span className="badge-text">The All-in-One Dual Workspace</span>
          <span className="badge-pill">v2.0</span>
        </div>

        {/* Shiny Black Hero Title */}
        <div className="titleMainpage">
          <h1 id="hero-title" className="shiny-black-title">
            One Platform,
            <span className="title-break"> Two Worlds</span>
          </h1>

          <p className="hero-subtitle">
            Linkipax blends your personal life and professional presence.
            Switch contexts instantly with a single toggle — no context-switching fatigue.
          </p>

          {/* Interactive Mode Pills */}
          <div className="hero-mode-pills" role="tablist" aria-label="Identity Mode Selector">
            <button
              type="button"
              role="tab"
              aria-selected={heroMode === "personal"}
              className={`mode-pill ${heroMode === "personal" ? "active" : ""}`}
              onClick={() => setHeroMode("personal")}
            >
              <span className="pill-icon">👨‍💻</span>
              <span className="pill-label">Personal</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={heroMode === "merged"}
              className={`mode-pill ${heroMode === "merged" ? "active" : ""}`}
              onClick={() => setHeroMode("merged")}
            >
              <span className="pill-icon">✨</span>
              <span className="pill-label">Unified</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={heroMode === "professional"}
              className={`mode-pill ${heroMode === "professional" ? "active" : ""}`}
              onClick={() => setHeroMode("professional")}
            >
              <span className="pill-icon">💼</span>
              <span className="pill-label">Professional</span>
            </button>
          </div>

          {/* Dynamic Mode Card Banner */}
          <div className="hero-mode-preview">
            <div className="preview-badge">{modeDescriptions[heroMode].highlight}</div>
            <div className="preview-text">
              <strong>{modeDescriptions[heroMode].title}:</strong> {modeDescriptions[heroMode].desc}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hero-actions">
            <button
              className="hero-shiny-cta"
              onClick={() => navigate("/signup")}
              aria-label="Get started with Linkipax"
            >
              <span className="cta-text">Get Started</span>
              <span className="cta-arrow">→</span>
              <span className="cta-shine-effect" />
            </button>

            <button
              className="hero-secondary-cta"
              onClick={handleScrollDown}
              aria-label="Explore features"
            >
              <span>Explore Features</span>
              <span className="secondary-icon">↓</span>
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="hero-trust-bar">
            <div className="trust-item">
              <span className="trust-icon">⚡</span>
              <span>Zero-lag Performance</span>
            </div>
            <div className="trust-dot">•</div>
            <div className="trust-item">
              <span className="trust-icon">🔄</span>
              <span>1-Click Switch</span>
            </div>
            <div className="trust-dot">•</div>
            <div className="trust-item">
              <span className="trust-icon">🔒</span>
              <span>Encrypted & Private</span>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="hero-scroll-indicator" onClick={handleScrollDown} role="button" tabIndex={0}>
          <div className="scroll-line"></div>
          <span className="flicker-text">Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}
