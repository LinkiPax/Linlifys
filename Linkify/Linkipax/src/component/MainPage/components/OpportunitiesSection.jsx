import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaRocket,
  FaTrophy,
  FaGraduationCap,
  FaBriefcase,
  FaArrowRight,
  FaCheck,
  FaFire,
} from "react-icons/fa";
import "./OpportunitiesSection.css";

const sampleOpportunities = [
  {
    id: 1,
    category: "jobs",
    title: "Senior AI Systems Engineer",
    company: "Anthropic Ecosystem Partner",
    icon: <FaRocket />,
    match: "99% Match",
    desc: "Architect low-latency distributed agent workflows and neural search pipelines with multi-modal LLMs.",
    tags: ["Remote", "$160k - $210k", "Full-Time", "Python / PyTorch"],
    linkTo: "/jobs",
    actionText: "View Job Details",
  },
  {
    id: 2,
    category: "hackathons",
    title: "Global Web3 & AI Hackathon 2026",
    company: "Linkipax Developer Network",
    icon: <FaTrophy />,
    match: "Top Pick",
    desc: "Build decentralized real-time collaboration applications and compete for $75,000 in grand bounty prizes.",
    tags: ["Worldwide Virtual", "$75K Prize Pool", "Team Matching", "48 Hours"],
    linkTo: "/hackathons",
    actionText: "Join Hackathon",
  },
  {
    id: 3,
    category: "startups",
    title: "Co-Founder & Lead Architect",
    company: "Stealth GenAI Venture",
    icon: <FaFire />,
    match: "96% Match",
    desc: "Partner with YC alumni building autonomous developer tooling. Equity-heavy founding role with seed funding secured.",
    tags: ["San Francisco / Remote", "10-20% Equity", "Seed Stage"],
    linkTo: "/startup",
    actionText: "Connect with Founder",
  },
  {
    id: 4,
    category: "jobs",
    title: "Full-Stack Distributed Systems Dev",
    company: "Scalable Cloud Labs",
    icon: <FaBriefcase />,
    match: "97% Match",
    desc: "Build next-gen edge messaging infrastructure using Rust, React, and WebRTC streaming protocols.",
    tags: ["Hybrid / NY", "$140k - $185k", "WebRTC", "React / Vite"],
    linkTo: "/jobs",
    actionText: "View Job Details",
  },
  {
    id: 5,
    category: "hackathons",
    title: "Zero-Knowledge Privacy Sprint",
    company: "Privacy Protocols Org",
    icon: <FaTrophy />,
    match: "Featured",
    desc: "Explore cryptographic proof systems and build identity verification without sensitive data leaks.",
    tags: ["Global Online", "$35K Prize Pool", "Mentorship Included"],
    linkTo: "/hackathons",
    actionText: "Register Free",
  },
  {
    id: 6,
    category: "startups",
    title: "Growth & Product Marketing Lead",
    company: "HyperGrowth SaaS",
    icon: <FaRocket />,
    match: "94% Match",
    desc: "Drive viral developer adoption and enterprise funnel for an open-source workflow engine.",
    tags: ["Remote Global", "$110k - $150k + Equity", "Series A"],
    linkTo: "/startup",
    actionText: "Explore Role",
  },
];

export default function OpportunitiesSection() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredOpportunities =
    activeFilter === "all"
      ? sampleOpportunities
      : sampleOpportunities.filter((opp) => opp.category === activeFilter);

  return (
    <div className="opportunities-section">
      <div className="opportunities-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-pill-badge">
            ✦ Intelligent Matching
          </span>
          <h2 className="section-main-heading">
            AI-Curated <span className="heading-gradient-accent">Career Opportunities</span>
          </h2>
          <p className="section-subtext">
            Discover roles, hackathons, and ventures precisely tailored to your verified skills, project history, and career ambition.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="opp-filter-tabs" role="tablist">
          <button
            type="button"
            className={`opp-filter-btn ${activeFilter === "all" ? "active" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            All Opportunities
          </button>
          <button
            type="button"
            className={`opp-filter-btn ${activeFilter === "jobs" ? "active" : ""}`}
            onClick={() => setActiveFilter("jobs")}
          >
            Engineering Roles
          </button>
          <button
            type="button"
            className={`opp-filter-btn ${activeFilter === "hackathons" ? "active" : ""}`}
            onClick={() => setActiveFilter("hackathons")}
          >
            Global Hackathons
          </button>
          <button
            type="button"
            className={`opp-filter-btn ${activeFilter === "startups" ? "active" : ""}`}
            onClick={() => setActiveFilter("startups")}
          >
            Startup Co-Founding
          </button>
        </div>

        {/* Opportunities Cards Grid */}
        <div className="opp-cards-grid">
          {filteredOpportunities.map((opp) => (
            <div key={opp.id} className="opp-card">
              <div className="opp-card-top">
                <div className="opp-icon-wrapper" style={{ color: "#38bdf8" }}>
                  {opp.icon}
                </div>
                <span className="opp-match-badge">{opp.match}</span>
              </div>

              <h3>{opp.title}</h3>
              <span style={{ fontSize: "0.82rem", color: "#64748b", display: "block", marginBottom: "0.6rem" }}>
                {opp.company}
              </span>
              <p>{opp.desc}</p>

              <div className="opp-tags-row">
                {opp.tags.map((tag, idx) => (
                  <span key={idx} className="opp-tag-chip">
                    {tag}
                  </span>
                ))}
              </div>

              <Link to={opp.linkTo} className="opp-card-action-btn">
                <span>{opp.actionText}</span>
                <FaArrowRight style={{ fontSize: "0.75rem" }} />
              </Link>
            </div>
          ))}
        </div>

        {/* Metrics Bar */}
        <div className="opp-stats-bar">
          <div className="stat-counter-block">
            <div className="stat-counter-number">15,000+</div>
            <div className="stat-counter-label">Verified Tech Opportunities</div>
          </div>
          <div className="stat-counter-block">
            <div className="stat-counter-number">98.4%</div>
            <div className="stat-counter-label">AI Matching Accuracy</div>
          </div>
          <div className="stat-counter-block">
            <div className="stat-counter-number">24/7</div>
            <div className="stat-counter-label">Real-Time Ecosystem Sync</div>
          </div>
        </div>
      </div>
    </div>
  );
}
