import React from "react";
import { Link } from "react-router-dom";
import hackathons from "../data/hackathons.json";
import "./Hackathons.css";

export default function Hackathons() {
  return (
    <div className="hackathons-page">
      <h1>Upcoming Hackathons</h1>
      <div className="hackathons-grid">
        {hackathons.map((hack) => (
          <div key={hack.id} className="hackathon-card">
            <h3>{hack.name}</h3>
            <p>🏆 Prize: ${hack.prize}</p>
            <p>📅 Deadline: {hack.deadline}</p>
            <div className="tags">
              {hack.themes.map((theme) => (
                <span key={theme}>{theme}</span>
              ))}
            </div>
            <Link to={`/hackathon/${hack.id}`} className="join-btn">
              Join Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
