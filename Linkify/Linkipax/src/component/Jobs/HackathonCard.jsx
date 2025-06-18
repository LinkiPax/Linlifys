import React from "react";
import { Link } from "react-router-dom";
import hackathons from "../data/hackathons.json";
import "./HackathonCard.css";

export default function HackathonCard() {
  // Safely access the first hackathon
  const featuredHackathon = hackathons.hackathons?.[0];

  if (!featuredHackathon) {
    return (
      <div className="hackathon-preview">
        <p>No featured hackathons currently</p>
        <Link to="/hackathons" className="view-all-btn">
          Browse Hackathons
        </Link>
      </div>
    );
  }

  return (
    <div className="hackathon-preview">
      <h3>Featured Hackathon</h3>
      <p>{featuredHackathon.name}</p>
      <p className="prize">🏆 Prize: ${featuredHackathon.prize}</p>
      <Link to="/hackathons" className="view-all-btn">
        View All
      </Link>
    </div>
  );
}
