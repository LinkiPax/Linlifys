import React, { useState } from "react";

export default function ToggleIntegration() {
  const [isProfessional, setIsProfessional] = useState(true);

  return (
    <section className="toggle-section" aria-labelledby="toggle-section-title">
      <div className={`toggle-section-bg-overlay ${isProfessional ? "mode-pro" : "mode-pers"}`}></div>
      <div className="toggle-section-container">
        <div className="toggle-content">
          <h2 id="toggle-section-title">Seamless Integration</h2>
          <p>Connect your professional and personal worlds effortlessly</p>

          <div className="toggle-switch-container">
            <div className="toggle-switch">
              <label
                className="switch"
                aria-label="Toggle between professional and personal mode"
              >
                <input
                  type="checkbox"
                  checked={!isProfessional}
                  onChange={() => setIsProfessional((prev) => !prev)}
                />
                <span className="slider round"></span>
              </label>
              <p className="mode-label">
                {isProfessional ? "Professional Mode" : "Personal Mode"}
              </p>
            </div>

            <div className="mode-description">
              <h3>
                {isProfessional ? "Professional Network" : "Personal Connections"}
              </h3>
              <p>
                {isProfessional
                  ? "Showcase your skills with a polished profile, connect with colleagues, and grow your career."
                  : "Share moments with friends and family in a private, authentic space."}
              </p>
            </div>
          </div>

          <div className="chat-demo">
            <h3>Real-time Translation Chat</h3>
            <p className="in-progress-label">Feature in development</p>
            <div className="chat-container">
              <div className="chat-message received">
                <div className="message-content">
                  <p>Hello! How are you doing today?</p>
                </div>
                <div className="message-translation">
                  <span className="language-label">English → Spanish</span>
                  <p>¡Hola! ¿Cómo estás hoy?</p>
                </div>
              </div>
              <div className="chat-message sent">
                <div className="message-content">
                  <p>I'm doing great! Just finished a project.</p>
                </div>
                <div className="message-translation">
                  <span className="language-label">Spanish → English</span>
                  <p>¡Me va muy bien! Acabo de terminar un proyecto.</p>
                </div>
              </div>
              <div className="chat-message received">
                <div className="message-content">
                  <p>That's awesome! What kind of project was it?</p>
                </div>
                <div className="message-translation">
                  <span className="language-label">English → Spanish</span>
                  <p>¡Eso es genial! ¿Qué tipo de proyecto era?</p>
                </div>
              </div>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="Type your message here..." disabled />
              <button disabled>Send</button>
            </div>
          </div>
        </div>

        <div className="toggle-image-container">
          <div className="image-frame">
            <img
              src={
                isProfessional
                  ? "/night-sky-glows-with-aurora-snowy-mountains-generative-ai.webp"
                  : "/Earth-From-Space-HD-Backgrounds.jpg"
              }
              alt={isProfessional ? "Professional Life" : "Personal Life"}
              className="life-image"
              loading="lazy"
            />
            <div className="image-glow"></div>
          </div>
          <p className="life-quote">
            {isProfessional
              ? "\u201CProfessionalism is not about the job you do, but how you do the job.\u201D"
              : "\u201CThe most important things in life aren\u2019t things.\u201D"}
          </p>
        </div>
      </div>
    </section>
  );
}
