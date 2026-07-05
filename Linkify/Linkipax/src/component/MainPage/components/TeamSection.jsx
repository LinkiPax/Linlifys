import React from "react";
import { AnimatedTooltip } from "../../../components/ui/animated-tooltip";

export default function TeamSection() {
  const teamMembers = [
    {
      id: 1,
      name: "Sarthak Nag",
      designation: "Founder & CEO",
      image: "https://avatars.githubusercontent.com/u/73744585?v=4",
    },
    {
      id: 2,
      name: "Prerit Nag",
      designation: "CTO",
      image: "https://avatars.githubusercontent.com/u/73744585?v=4",
    },
    {
      id: 3,
      name: "Mike Johnson",
      designation: "Lead Designer",
      image: "https://randomuser.me/api/portraits/men/22.jpg",
    },
    {
      id: 4,
      name: "Sarah Williams",
      designation: "Marketing Head",
      image: "https://randomuser.me/api/portraits/women/63.jpg",
    },
  ];

  return (
    <section className="team-section" aria-labelledby="team-title">
      <div className="team-content">
        <div className="team-header">
          <h2 id="team-title">Meet Our Team</h2>
          <p className="team-subtitle">
            The passionate people behind Linkipax
          </p>
        </div>

        <div className="team-members">
          <AnimatedTooltip items={teamMembers} />
        </div>

        <div className="team-values">
          <div className="value-card">
            <h3>Innovation</h3>
            <p>
              We constantly push boundaries to deliver cutting-edge
              solutions
            </p>
          </div>
          <div className="value-card">
            <h3>Transparency</h3>
            <p>Open communication and honesty in everything we do</p>
          </div>
          <div className="value-card">
            <h3>User Focus</h3>
            <p>
              Your needs are at the center of our design and development
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
