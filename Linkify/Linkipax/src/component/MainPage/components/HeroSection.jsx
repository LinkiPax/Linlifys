import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaChevronDown,
  FaUserFriends,
  FaBriefcase,
  FaLayerGroup,
  FaBolt,
  FaLock,
  FaGlobeAmericas,
  FaCheckCircle,
} from "react-icons/fa";

export default function HeroSection() {
  const navigate = useNavigate();
  const [heroMode, setHeroMode] = useState("unified");

  const modeData = {
    personal: {
      tag: "Personal Identity",
      title: "Your Private Social Sanctuary",
      desc: "Connect genuinely with friends and inner circles. Share memories, custom media, and real-time moments without workplace pressure or resume anxiety.",
      chips: ["Private Moments", "End-to-End Encrypted", "No Workplace Noise", "Custom Themes"],
      status: "Personal Mode Active",
      icon: <FaUserFriends />,
    },
    unified: {
      tag: "Unified Architecture",
      title: "One Fluid Interface. Two Distinct Worlds.",
      desc: "Effortlessly toggle between personal and professional personas with zero context-switching fatigue. One login, complete identity isolation.",
      chips: ["Instant 1-Click Toggle", "Zero Context Fatigue", "Dual Profiles", "Smart Routing"],
      status: "Unified Mode Active",
      icon: <FaLayerGroup />,
    },
    professional: {
      tag: "Professional Presence",
      title: "Accelerate Your Career & Business Network",
      desc: "Showcase verified credentials, connect with top industry peers, collaborate in 3D meeting rooms, and unlock tailored high-impact opportunities.",
      chips: ["Verified Credentials", "AI Job Match (98%)", "3D Meeting Rooms", "Global Peer Network"],
      status: "Professional Mode Active",
      icon: <FaBriefcase />,
    },
  };

  const handleScrollToFeatures = () => {
    const target = document.getElementById("features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const activeMode = modeData[heroMode];

  return (
    <div className="hero-section">
      <div className="hero-content">
        {/* Top Feature Pill Badge */}
        <div className="hero-badge">
          <span className="badge-sparkle">✦</span>
          <span>The Next-Generation Dual Identity Network</span>
          <span className="badge-pill">v2.4</span>
        </div>

        {/* Shiny Metallic Title */}
        <h1 className="hero-main-title">
          <span className="shiny-metallic-title">One Platform. Two Worlds.</span>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Linkipax bridges your authentic personal life with your verified professional career.
          Switch contexts instantly with zero identity overlap.
        </p>

        {/* Interactive Mode Pills */}
        <div className="hero-mode-pills" role="tablist" aria-label="Workspace Mode Switcher">
          <button
            type="button"
            role="tab"
            aria-selected={heroMode === "personal"}
            className={`mode-pill ${heroMode === "personal" ? "active" : ""}`}
            onClick={() => setHeroMode("personal")}
          >
            <FaUserFriends />
            <span>Personal</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={heroMode === "unified"}
            className={`mode-pill ${heroMode === "unified" ? "active" : ""}`}
            onClick={() => setHeroMode("unified")}
          >
            <FaLayerGroup />
            <span>Unified</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={heroMode === "professional"}
            className={`mode-pill ${heroMode === "professional" ? "active" : ""}`}
            onClick={() => setHeroMode("professional")}
          >
            <FaBriefcase />
            <span>Professional</span>
          </button>
        </div>

        {/* Dynamic Mode Card Banner */}
        <div className="hero-mode-preview-card" role="region" aria-live="polite">
          <div className="preview-card-header">
            <span className="preview-tag">
              {activeMode.icon}
              <span>{activeMode.tag}</span>
            </span>
            <div className="preview-status-pill">
              <span className="status-dot-active" />
              <span>{activeMode.status}</span>
            </div>
          </div>

          <h2 className="preview-title">{activeMode.title}</h2>
          <p className="preview-desc">{activeMode.desc}</p>

          <div className="preview-feature-chips">
            {activeMode.chips.map((chip, idx) => (
              <span key={idx} className="feature-chip">
                <FaCheckCircle className="chip-check" />
                <span>{chip}</span>
              </span>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="hero-actions">
          <Link to="/Signup" className="hero-primary-cta">
            <span>Get Started Free</span>
            <FaArrowRight />
            <span className="btn-shine" />
          </Link>

          <button
            type="button"
            className="hero-secondary-cta"
            onClick={handleScrollToFeatures}
          >
            <span>Explore Ecosystem</span>
            <FaChevronDown />
          </button>
        </div>

        {/* Trust Highlights */}
        <div className="hero-trust-bar">
          <div className="trust-item">
            <FaBolt className="trust-icon" />
            <span>Sub-millisecond Switch</span>
          </div>
          <span className="trust-dot">•</span>
          <div className="trust-item">
            <FaLock className="trust-icon" />
            <span>100% Identity Isolation</span>
          </div>
          <span className="trust-dot">•</span>
          <div className="trust-item">
            <FaGlobeAmericas className="trust-icon" />
            <span>50+ Countries Connected</span>
          </div>
        </div>

        {/* Scroll down indicator */}
        <div
          className="hero-scroll-indicator"
          onClick={handleScrollToFeatures}
          role="button"
          tabIndex={0}
          aria-label="Scroll down to explore features"
        >
          <div className="scroll-mouse-icon">
            <div className="scroll-wheel" />
          </div>
        </div>
      </div>
    </div>
  );
}
