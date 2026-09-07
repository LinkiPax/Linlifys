import React, { useState } from "react";
import {
  FaBriefcase,
  FaHeart,
  FaLanguage,
  FaPaperPlane,
  FaCheckDouble,
  FaRobot,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";

export default function ToggleIntegration() {
  const [isProfessional, setIsProfessional] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "received",
      original: "Hello! Did you review the engineering proposal for the global cluster?",
      translation: "¡Hola! ¿Revisaste la propuesta de ingeniería para el clúster global?",
      fromLang: "English",
      toLang: "Spanish",
      time: "10:42 AM",
    },
    {
      id: 2,
      sender: "sent",
      original: "Yes, approved! The low-latency routing architecture looks exceptional.",
      translation: "¡Sí, aprobado! La arquitectura de enrutamiento de baja latencia se ve excepcional.",
      fromLang: "English",
      toLang: "Spanish",
      time: "10:43 AM",
    },
    {
      id: 3,
      sender: "received",
      original: "Parfait ! La réunion de déploiement commence à 15h UTC.",
      translation: "Perfect! The deployment meeting begins at 3:00 PM UTC.",
      fromLang: "French",
      toLang: "English",
      time: "10:44 AM",
    },
  ]);

  const presetPrompts = [
    { text: "Can we schedule a 3D sync call?", target: "Spanish", translated: "¿Podemos programar una llamada de sincronización 3D?" },
    { text: "All system tests passed 100%.", target: "German", translated: "Alle Systemtests wurden zu 100 % bestanden." },
    { text: "See you at the conference!", target: "Japanese", translated: "カンファレンスでお会いしましょう！" },
  ];

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    // Simulate instant AI Translation
    const newMsg = {
      id: Date.now(),
      sender: "sent",
      original: text,
      translation: `[AI Translated]: ${text} (simulated target translation)`,
      fromLang: "English",
      toLang: "Spanish",
      time: "Just now",
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");

    // Simulate smart agent response after 800ms
    setTimeout(() => {
      const autoReply = {
        id: Date.now() + 1,
        sender: "received",
        original: "¡Recibido con éxito! Todo sincronizado en tu espacio de trabajo.",
        translation: "Received successfully! Everything is synchronized in your workspace.",
        fromLang: "Spanish",
        toLang: "English",
        time: "Just now",
      };
      setChatMessages((prev) => [...prev, autoReply]);
    }, 800);
  };

  return (
    <div className="dual-identity-section">
      {/* Section Header */}
      <div className="section-header-block">
        <span className="section-pill-badge">
          ✦ Core Innovation
        </span>
        <h2 className="section-main-heading">
          Seamless <span className="heading-gradient-accent">Dual Workspace</span>
        </h2>
        <p className="section-subtext">
          Toggle between your verified professional career and authentic personal circles with absolute privacy, zero crossover, and live AI multi-lingual translation.
        </p>
      </div>

      <div className="dual-identity-grid">
        {/* Left Column: Switcher & Live Interactive Chat */}
        <div className="dual-identity-left">
          {/* Workspace Toggle Card */}
          <div className="workspace-toggle-box">
            <div className="switch-header">
              <div className="switch-label-group">
                <div
                  className={`mode-icon-badge ${
                    isProfessional ? "pro" : "personal"
                  }`}
                >
                  {isProfessional ? <FaBriefcase /> : <FaHeart />}
                </div>
                <div className="switch-titles">
                  <h3>
                    {isProfessional ? "Professional Mode" : "Personal Mode"}
                  </h3>
                  <p>
                    {isProfessional
                      ? "Verified credentials, career network & meeting hubs"
                      : "Private social feed, casual chat & close circles"}
                  </p>
                </div>
              </div>

              {/* iOS Style Smooth Toggle Switch */}
              <label
                className="ios-toggle-switch"
                aria-label="Toggle between Professional and Personal mode"
              >
                <input
                  type="checkbox"
                  checked={!isProfessional}
                  onChange={() => setIsProfessional((prev) => !prev)}
                />
                <span className="ios-slider" />
              </label>
            </div>

            <p className="workspace-desc-text">
              {isProfessional
                ? "Your professional identity presents your work history, verified portfolio, and direct access to enterprise meeting rooms with strict data compartmentalization."
                : "Your personal space keeps all friends, casual messages, personal galleries, and private circles completely shielded from recruiters and coworkers."}
            </p>
          </div>

          {/* Interactive Live AI Translation Chat Demo */}
          <div className="chat-demo-card">
            <div className="chat-demo-header">
              <h4>
                <FaLanguage style={{ color: "#38bdf8" }} />
                <span>Live AI Real-Time Translation</span>
              </h4>
              <span className="chat-badge-live">● Live Interactive Demo</span>
            </div>

            <div className="chat-messages-container">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-bubble-wrapper ${msg.sender}`}
                >
                  <div className="chat-bubble-main">
                    <p style={{ margin: 0 }}>{msg.original}</p>
                  </div>
                  <div className="chat-translation-subbox">
                    <span className="translation-lang-pill">
                      {msg.fromLang} → {msg.toLang}
                    </span>
                    <span style={{ fontStyle: "italic" }}>{msg.translation}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Test Prompt Chips */}
            <div className="chat-prompt-chips">
              <span style={{ fontSize: "0.74rem", color: "#64748b", alignSelf: "center" }}>
                Try prompts:
              </span>
              {presetPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="prompt-chip-btn"
                  onClick={() => handleSendMessage(p.text)}
                >
                  "{p.text}"
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form
              className="chat-input-bar"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message to test live AI translation..."
                className="chat-input-field"
                aria-label="Test message for live translation"
              />
              <button
                type="submit"
                className="chat-send-btn"
                aria-label="Send message"
              >
                <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dynamic Persona Preview Frame */}
        <div className="dual-identity-right">
          <div className="preview-media-card">
            <img
              src={
                isProfessional
                  ? "/night-sky-glows-with-aurora-snowy-mountains-generative-ai.webp"
                  : "/Earth-From-Space-HD-Backgrounds.jpg"
              }
              alt={isProfessional ? "Professional Horizon" : "Personal World"}
              className="media-image"
              loading="lazy"
            />
            <div className="media-overlay-gradient" />
            <div className="media-quote-box">
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <span className="opp-tag-chip">
                  <FaShieldAlt style={{ color: "#38bdf8", marginRight: "4px" }} />
                  {isProfessional ? "Zero Data Crossover" : "Encrypted Social Media"}
                </span>
                <span className="opp-tag-chip">
                  <FaUserCheck style={{ color: "#10b981", marginRight: "4px" }} />
                  {isProfessional ? "Verified Work ID" : "Anonymous or Real Alias"}
                </span>
              </div>
              <p className="media-quote-text">
                {isProfessional
                  ? "“Excellence in your professional craft without sacrificing your personal serenity.”"
                  : "“True connection happens when privacy is guaranteed and authentic moments are shared.”"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
