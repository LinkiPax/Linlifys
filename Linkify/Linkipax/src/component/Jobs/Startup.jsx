import React, { useState } from "react";
import startups from "../data/startups.json";
import "./Startup.css";

export default function Startup() {
  const [pitch, setPitch] = useState("");

  return (
    <div className="startup-page">
      <div className="startup-pitch">
        <h2>Pitch Your Idea to Investors</h2>
        <textarea
          placeholder="Describe your startup in 200 words..."
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
        />
        <button>Submit Pitch</button>
      </div>

      <div className="startup-list">
        {startups.map((startup) => (
          <div key={startup.id} className="startup-card">
            <h3>{startup.name}</h3>
            <p>{startup.description}</p>
            <button>Contact Founder</button>
          </div>
        ))}
      </div>
    </div>
  );
}
