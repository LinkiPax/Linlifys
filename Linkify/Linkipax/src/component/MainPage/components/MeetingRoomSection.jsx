import React, { useState } from "react";
import {
  FaVideo,
  FaGlobeAmericas,
  FaLanguage,
  FaUsers,
  FaCheckCircle,
  FaArrowRight,
  FaLock,
  FaMicrophone,
} from "react-icons/fa";
import { World } from "../../../components/ui/globe";
import "./MeetingRoomSection.css";

export default function MeetingRoomSection() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const globeConfig = {
    pointSize: 2,
    globeColor: "#0b1022",
    showAtmosphere: true,
    atmosphereColor: "#38bdf8",
    atmosphereAltitude: 0.15,
    polygonColor: "rgba(255,255,255,0.7)",
    emissive: "#000000",
    emissiveIntensity: 0.1,
    shininess: 0.9,
    arcTime: 2000,
    arcLength: 0.9,
    rings: 1,
    maxRings: 3,
    ambientLight: "#38bdf8",
    directionalLeftLight: "#ffffff",
    directionalTopLight: "#ffffff",
    pointLight: "#ffffff",
  };

  const sampleData = [
    {
      order: 1,
      startLat: 37.7749,
      startLng: -122.4194,
      endLat: 40.7128,
      endLng: -74.006,
      arcAlt: 0.2,
      color: "#38bdf8",
    },
    {
      order: 2,
      startLat: 51.5074,
      startLng: -0.1278,
      endLat: 48.8566,
      endLng: 2.3522,
      arcAlt: 0.2,
      color: "#818cf8",
    },
    {
      order: 3,
      startLat: 35.6762,
      startLng: 139.6503,
      endLat: 37.5665,
      endLng: 126.978,
      arcAlt: 0.2,
      color: "#38bdf8",
    },
    {
      order: 4,
      startLat: 28.6139,
      startLng: 77.209,
      endLat: 22.3193,
      endLng: 114.1694,
      arcAlt: 0.2,
      color: "#c084fc",
    },
    {
      order: 5,
      startLat: -33.8688,
      startLng: 151.2093,
      endLat: -22.9068,
      endLng: -43.1729,
      arcAlt: 0.2,
      color: "#818cf8",
    },
  ];

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setIsSubmitted(true);
  };

  return (
    <div className="meeting-room-section">
      <div className="meeting-room-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-pill-badge">
            ✦ Virtual Presence
          </span>
          <h2 className="section-main-heading">
            Linkipax <span className="heading-gradient-accent">3D Meeting Rooms</span>
          </h2>
          <p className="section-subtext">
            Immersive, low-latency spatial video conferences with integrated live language dubbing, zero software downloads, and encrypted collaboration.
          </p>
        </div>

        {/* 2-Column Grid: 3D Globe + Feature Cards */}
        <div className="meeting-room-layout">
          {/* 3D Interactive Globe */}
          <div className="globe-frame-box" aria-label="3D Global Connectivity Visualization">
            <World globeConfig={globeConfig} data={sampleData} />
          </div>

          {/* 4 Feature Highlights */}
          <div className="meeting-features-grid">
            <div className="feature-glass-card">
              <div className="feature-card-icon">
                <FaVideo />
              </div>
              <h3>4K Ultra-HD Video</h3>
              <p>
                Crystal-clear video with adaptive neural bitrate compression, maintaining high framerates on low-bandwidth connections.
              </p>
            </div>

            <div className="feature-glass-card">
              <div className="feature-card-icon">
                <FaGlobeAmericas />
              </div>
              <h3>Global Mesh Relay</h3>
              <p>
                Edge relays distributed across 30+ international regions ensure sub-30ms roundtrip audio latency worldwide.
              </p>
            </div>

            <div className="feature-glass-card">
              <div className="feature-card-icon">
                <FaLanguage />
              </div>
              <h3>Real-Time Live Translation</h3>
              <p>
                Speak in your native language; meeting participants hear AI-synthesized real-time voice or read live subtitles in 20+ languages.
              </p>
            </div>

            <div className="feature-glass-card">
              <div className="feature-card-icon">
                <FaUsers />
              </div>
              <h3>Spatial Collaboration</h3>
              <p>
                Integrated collaborative whiteboards, synchronized code sandboxes, and directional spatial audio for real team synergy.
              </p>
            </div>
          </div>
        </div>

        {/* Early Access Waitlist Box */}
        <div className="waitlist-card">
          <span className="waitlist-tag">✦ Coming Soon to Linkipax Pro</span>
          <h3>Reserve Your Early Access Seat</h3>
          <p>
            Get priority access to our 3D Meeting Rooms beta, exclusive founder badge, and unlimited HD meeting time.
          </p>

          {!isSubmitted ? (
            <form className="waitlist-form" onSubmit={handleWaitlistSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work or personal email..."
                required
                className="waitlist-input"
                aria-label="Email for meeting room early access"
              />
              <button type="submit" className="waitlist-btn">
                <span>Join Waitlist</span>
                <FaArrowRight style={{ marginLeft: "6px" }} />
              </button>
            </form>
          ) : (
            <div className="waitlist-success-msg">
              <FaCheckCircle style={{ fontSize: "1.2rem" }} />
              <span>You're on the list! We'll notify you as soon as early access opens.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
