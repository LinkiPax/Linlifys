import React from "react";
import { FaVideo, FaGlobe, FaLanguage, FaUsers } from "react-icons/fa";
import { World } from "../../../components/ui/globe";

export default function MeetingRoomSection() {
  const globeConfig = {
    pointSize: 2,
    globeColor: "#1d072e",
    showAtmosphere: true,
    atmosphereColor: "#ffffff",
    atmosphereAltitude: 0.1,
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
      color: "#3b82f6",
    },
    {
      order: 2,
      startLat: 51.5074,
      startLng: -0.1278,
      endLat: 48.8566,
      endLng: 2.3522,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
    {
      order: 3,
      startLat: 35.6762,
      startLng: 139.6503,
      endLat: 37.5665,
      endLng: 126.978,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
    {
      order: 4,
      startLat: 28.6139,
      startLng: 77.209,
      endLat: 22.3193,
      endLng: 114.1694,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
    {
      order: 5,
      startLat: -33.8688,
      startLng: 151.2093,
      endLat: -22.9068,
      endLng: -43.1729,
      arcAlt: 0.2,
      color: "#3b82f6",
    },
  ];

  return (
    <section className="meeting-room-section" aria-labelledby="meeting-room-title">
      <div className="meeting-room-content">
        <div className="meeting-room-header">
          <h2 id="meeting-room-title">Linkipax Meeting Room</h2>
          <p className="meeting-room-subtitle">
            Connect globally with our seamless video conferencing platform
          </p>
        </div>

        <div className="meeting-room-features">
          <div className="meeting-room-globe">
            <div className="globe-container">
              <World globeConfig={globeConfig} data={sampleData} />
            </div>
          </div>

          <div className="meeting-room-details">
            <div className="feature-card">
              <div className="feature-icon">
                <FaVideo aria-hidden="true" />
              </div>
              <h3>High-Quality Video</h3>
              <p>
                Crystal clear video calls with adaptive bitrate for any
                connection.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaGlobe aria-hidden="true" />
              </div>
              <h3>Global Connectivity</h3>
              <p>
                Low-latency connections worldwide with our optimized
                network.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaLanguage aria-hidden="true" />
              </div>
              <h3>Real-time Translation</h3>
              <p>
                Speak in your language, others hear in theirs with
                AI-powered translation.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaUsers aria-hidden="true" />
              </div>
              <h3>Collaboration Tools</h3>
              <p>
                Screen sharing, whiteboard, and document collaboration
                built-in.
              </p>
            </div>
          </div>
        </div>

        <div className="meeting-room-cta">
          <p className="release-timeline">
            Full release with all features coming in Q3 2025
          </p>
          <button
            className="cta-button"
            aria-label="Join waitlist for early access"
          >
            Join Waitlist for Early Access
          </button>
        </div>
      </div>
    </section>
  );
}
