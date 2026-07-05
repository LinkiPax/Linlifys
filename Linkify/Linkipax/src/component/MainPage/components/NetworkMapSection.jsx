import React from "react";
import { WorldMap } from "../../../components/ui/world-map";

export default function NetworkMapSection() {
  const mapConnections = [
    {
      start: { lat: 40.7128, lng: -74.006 },
      end: { lat: 51.5074, lng: -0.1278 },
    },
    {
      start: { lat: 48.8566, lng: 2.3522 },
      end: { lat: 35.6762, lng: 139.6503 },
    },
    {
      start: { lat: 37.7749, lng: -122.4194 },
      end: { lat: 28.6139, lng: 77.209 },
    },
    {
      start: { lat: -33.8688, lng: 151.2093 },
      end: { lat: 22.3193, lng: 114.1694 },
    },
  ];

  return (
    <section className="network-section" aria-labelledby="network-title">
      <div className="network-content">
        <div className="network-header">
          <h2 id="network-title">Our Global Network</h2>
          <p className="network-subtitle">
            Connecting professionals and communities worldwide
          </p>
        </div>

        <div className="network-map">
          <WorldMap dots={mapConnections} lineColor="#3b82f6" />
        </div>

        <div className="network-stats">
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Countries</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10M+</div>
            <div className="stat-label">Connections</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Support</div>
          </div>
        </div>
      </div>
    </section>
  );
}
