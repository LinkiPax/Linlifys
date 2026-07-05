import React from "react";
import {
  FaLinkedin,
  FaTwitter,
  FaGithub,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="main-footer" aria-label="Footer">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-brand">
            <h3>Linkipax</h3>
            <p>Bridging your professional and personal worlds seamlessly</p>
            <div className="footer-social">
              <a href="#" aria-label="Visit our LinkedIn page">
                <FaLinkedin />
              </a>
              <a href="#" aria-label="Visit our Twitter page">
                <FaTwitter />
              </a>
              <a href="#" aria-label="Visit our GitHub page">
                <FaGithub />
              </a>
              <a href="#" aria-label="Visit our Instagram page">
                <FaInstagram />
              </a>
            </div>
          </div>

          <div className="footer-links">
            <div className="link-column">
              <h4>Product</h4>
              <a href="#">Features</a>
              <a href="#">Pricing</a>
              <a href="#">Integrations</a>
              <a href="#">Updates</a>
            </div>
            <div className="link-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Blog</a>
              <a href="#">Press</a>
            </div>
            <div className="link-column">
              <h4>Resources</h4>
              <a href="#">Help Center</a>
              <a href="#">Tutorials</a>
              <a href="#">API Docs</a>
              <a href="#">Community</a>
            </div>
            <div className="link-column">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="newsletter">
            <h4>Stay Updated</h4>
            <div className="newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                aria-label="Email address for newsletter"
              />
              <button aria-label="Subscribe to newsletter">
                <FaEnvelope /> Subscribe
              </button>
            </div>
          </div>

          <div className="footer-legal">
            <p>© 2025 Linkipax. All rights reserved.</p>
            <div className="footer-locale">
              <span>🌐 English</span>
              <span>📍 United States</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
