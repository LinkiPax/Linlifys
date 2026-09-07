import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaLinkedin,
  FaTwitter,
  FaGithub,
  FaInstagram,
  FaEnvelope,
  FaCheckCircle,
  FaGlobe,
  FaPaperPlane,
} from "react-icons/fa";
import "./Footer.css";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) return;
    setSubscribed(true);
  };

  return (
    <footer className="main-footer" aria-label="Linkipax Site Footer">
      <div className="footer-container">
        {/* Newsletter Banner */}
        <div className="footer-newsletter-row">
          <div className="newsletter-info">
            <h4>Stay Connected to the Frontier</h4>
            <p>Get exclusive product releases, early access invites, and engineering deep-dives.</p>
          </div>

          {!subscribed ? (
            <form className="newsletter-form-box" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email..."
                required
                className="newsletter-email-input"
                aria-label="Newsletter email address"
              />
              <button type="submit" className="newsletter-submit-btn">
                <span>Subscribe</span>
                <FaPaperPlane style={{ marginLeft: "5px" }} />
              </button>
            </form>
          ) : (
            <div className="newsletter-subscribed-alert">
              <FaCheckCircle />
              <span>Thank you for subscribing! Check your inbox for updates.</span>
            </div>
          )}
        </div>

        {/* 5-Column Navigation Grid */}
        <div className="footer-grid-top">
          {/* Brand Column */}
          <div className="footer-brand-column">
            <div className="footer-brand-title">
              <span style={{ color: "#818cf8" }}>LP</span>
              <span>Linkipax</span>
            </div>
            <p className="footer-brand-bio">
              The dual workspace uniting authentic personal interaction with verified professional opportunity. Built for modern digital humans.
            </p>
            <div className="footer-social-row">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="Twitter"
              >
                <FaTwitter />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="footer-social-btn"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="footer-link-group">
            <h4>Product</h4>
            <ul className="footer-link-list">
              <li>
                <a href="#features" className="footer-nav-link">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="#dual-identity" className="footer-nav-link">
                  Dual Persona
                </a>
              </li>
              <li>
                <Link to="/meeting" className="footer-nav-link">
                  3D Meeting Room
                </Link>
              </li>
              <li>
                <Link to="/jobs" className="footer-nav-link">
                  AI Job Board
                </Link>
              </li>
              <li>
                <Link to="/hackathons" className="footer-nav-link">
                  Hackathons
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="footer-link-group">
            <h4>Ecosystem</h4>
            <ul className="footer-link-list">
              <li>
                <Link to="/network" className="footer-nav-link">
                  Global Network
                </Link>
              </li>
              <li>
                <Link to="/startup" className="footer-nav-link">
                  Startup Hub
                </Link>
              </li>
              <li>
                <Link to="/shorts" className="footer-nav-link">
                  Linkipax Shorts
                </Link>
              </li>
              <li>
                <Link to="/tree" className="footer-nav-link">
                  3D Spatial Forest
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="footer-link-group">
            <h4>Access</h4>
            <ul className="footer-link-list">
              <li>
                <Link to="/login" className="footer-nav-link">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/Signup" className="footer-nav-link">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/forgot-password" className="footer-nav-link">
                  Reset Password
                </Link>
              </li>
              <li>
                <Link to="/settings" className="footer-nav-link">
                  Account Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-link-group">
            <h4>Trust & Legal</h4>
            <ul className="footer-link-list">
              <li>
                <a href="#" className="footer-nav-link">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="footer-nav-link">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="footer-nav-link">
                  Security Architecture
                </a>
              </li>
              <li>
                <a href="#" className="footer-nav-link">
                  GDPR & Compliance
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            <span>© 2026 Linkipax, Inc. All rights reserved.</span>
          </div>

          <div className="footer-sys-status">
            <span className="status-dot-green" />
            <span>All Global Systems Operational</span>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <span>🌐 English (US)</span>
            <span>🔒 TLS 1.3 Encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
