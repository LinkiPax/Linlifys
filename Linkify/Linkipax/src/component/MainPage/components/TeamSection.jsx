import React from "react";
import { AnimatedTooltip } from "../../../components/ui/animated-tooltip";
import { FaLightbulb, FaShieldAlt, FaHeart } from "react-icons/fa";
import "./TeamSection.css";

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
      designation: "CTO & Co-Founder",
      image: "https://avatars.githubusercontent.com/u/73744585?v=4",
    },
    {
      id: 3,
      name: "Elena Rostova",
      designation: "Head of AI & NLP",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: 4,
      name: "Marcus Chen",
      designation: "Principal 3D Engineer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
    {
      id: 5,
      name: "Sarah Williams",
      designation: "VP Product Experience",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  ];

  return (
    <div className="team-section">
      <div className="team-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-pill-badge">
            ✦ The Innovators
          </span>
          <h2 className="section-main-heading">
            Meet the Builders Behind <span className="heading-gradient-accent">Linkipax</span>
          </h2>
          <p className="section-subtext">
            A distributed team of engineers, designers, and privacy advocates obsessed with crafting the future of unified human interaction.
          </p>
        </div>

        {/* Animated Tooltip Avatar Group */}
        <div className="team-avatars-row">
          <AnimatedTooltip items={teamMembers} />
        </div>

        {/* 3 Core Values Cards */}
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon-box">
              <FaLightbulb />
            </div>
            <h3>Relentless Innovation</h3>
            <p>
              We push WebGL, real-time spatial networking, and multi-modal AI to shatter traditional social and professional silos.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon-box">
              <FaShieldAlt />
            </div>
            <h3>Radical Privacy</h3>
            <p>
              Zero corporate snooping and strict cryptographic persona compartmentalization guarantee your personal life stays truly private.
            </p>
          </div>

          <div className="value-card">
            <div className="value-icon-box">
              <FaHeart />
            </div>
            <h3>Human-Centric Design</h3>
            <p>
              Software should remove anxiety, not induce it. We design intuitive, fast, and respectful interfaces for modern digital citizens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
