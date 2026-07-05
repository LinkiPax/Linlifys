import React from "react";

export default function OpportunitiesSection() {
  return (
    <section className="opportunities-section" aria-labelledby="opportunities-title">
      <div className="opportunities-content">
        <div className="opportunities-header">
          <h2 id="opportunities-title">Discover Opportunities</h2>
          <p className="opportunities-subtitle">
            AI-curated opportunities tailored to your profile and interests
          </p>
        </div>

        <div className="opportunity-cards">
          <div className="opportunity-card">
            <div className="card-icon" aria-hidden="true">
              🚀
            </div>
            <h3>AI-Suggested Jobs</h3>
            <p>
              Get matched with ideal positions based on your skills,
              experience, and preferences.
            </p>
            <div className="card-highlight">
              <span>95% relevance matching</span>
            </div>
          </div>

          <div className="opportunity-card">
            <div className="card-icon" aria-hidden="true">
              🏆
            </div>
            <h3>Hackathon Alerts</h3>
            <p>
              Personalized hackathon recommendations with team matching
              features.
            </p>
            <div className="card-highlight">
              <span>200+ events monthly</span>
            </div>
          </div>

          <div className="opportunity-card">
            <div className="card-icon" aria-hidden="true">
              📚
            </div>
            <h3>Learning Paths</h3>
            <p>
              Dynamic course recommendations that evolve with your career
              goals.
            </p>
            <div className="card-highlight">
              <span>10,000+ resources</span>
            </div>
          </div>
        </div>

        <div className="opportunities-stats">
          <div className="stat-item">
            <div className="stat-number">10,000+</div>
            <div className="stat-label">Opportunities</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">85%</div>
            <div className="stat-label">Match Accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24h</div>
            <div className="stat-label">Daily Updates</div>
          </div>
        </div>
      </div>
    </section>
  );
}
