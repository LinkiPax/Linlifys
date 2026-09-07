import React from "react";
import { WorldMap } from "../../../components/ui/world-map";
import { FaGlobe, FaWifi, FaServer, FaShieldAlt } from "react-icons/fa";

export default function NetworkMapSection() {
  const mapConnections = [
    {
      start: { lat: 40.7128, lng: -74.006 }, // New York
      end: { lat: 51.5074, lng: -0.1278 },   // London
    },
    {
      start: { lat: 51.5074, lng: -0.1278 }, // London
      end: { lat: 28.6139, lng: 77.209 },    // New Delhi
    },
    {
      start: { lat: 28.6139, lng: 77.209 },  // New Delhi
      end: { lat: 35.6762, lng: 139.6503 },  // Tokyo
    },
    {
      start: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      end: { lat: 35.6762, lng: 139.6503 },    // Tokyo
    },
    {
      start: { lat: 48.8566, lng: 2.3522 },    // Paris
      end: { lat: -33.8688, lng: 151.2093 },  // Sydney
    },
    {
      start: { lat: -22.9068, lng: -43.1729 }, // Rio de Janeiro
      end: { lat: 40.7128, lng: -74.006 },     // New York
    },
    {
      start: { lat: 1.3521, lng: 103.8198 },   // Singapore
      end: { lat: 51.5074, lng: -0.1278 },     // London
    },
  ];

  return (
    <div className="network-section">
      <div className="network-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-pill-badge">
            ✦ Global Telemetry
          </span>
          <h2 className="section-main-heading">
            Worldwide <span className="heading-gradient-accent">Distributed Edge Mesh</span>
          </h2>
          <p className="section-subtext">
            Powering real-time video relays, instant message routing, and peer discovery across every continent with enterprise-grade resilience.
          </p>
        </div>

        {/* World Map Container */}
        <div className="network-map-box">
          <WorldMap dots={mapConnections} lineColor="#38bdf8" />
        </div>

        {/* Global Network Stats */}
        <div className="network-metrics-row">
          <div className="network-metric-item">
            <div className="network-metric-num">50+</div>
            <div className="network-metric-label">Active Edge Regions</div>
          </div>
          <div className="network-metric-item">
            <div className="network-metric-num">10M+</div>
            <div className="network-metric-label">Daily Peer Interactions</div>
          </div>
          <div className="network-metric-item">
            <div className="network-metric-num">99.99%</div>
            <div className="network-metric-label">Cluster Availability</div>
          </div>
          <div className="network-metric-item">
            <div className="network-metric-num">&lt; 25ms</div>
            <div className="network-metric-label">Average Global Relay Latency</div>
          </div>
        </div>
      </div>
    </div>
  );
}
