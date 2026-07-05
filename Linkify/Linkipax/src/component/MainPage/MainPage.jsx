import React from "react";
import "./MainPage.css";
import MainNavbar from "./MainNavbar";

// Import modular section components
import HeroSection from "./components/HeroSection";
import VideoShowcase from "./components/VideoShowcase";
import ToggleIntegration from "./components/ToggleIntegration";
import MeetingRoomSection from "./components/MeetingRoomSection";
import OpportunitiesSection from "./components/OpportunitiesSection";
import TeamSection from "./components/TeamSection";
import NetworkMapSection from "./components/NetworkMapSection";
import Footer from "./components/Footer";

const MainPage = () => {
  return (
    <div className="main-homepage-container" role="main">
      <MainNavbar />

      <div className="content-sections">
        {/* Particle Hero Section */}
        <HeroSection />

        {/* Video Showcase Section */}
        <VideoShowcase />

        {/* Professional vs Personal Switch Section */}
        <ToggleIntegration />

        {/* Globe Meeting Room Section */}
        <MeetingRoomSection />

        {/* AI Suggested Opportunities Section */}
        <OpportunitiesSection />

        {/* Team Members & Corporate Values Section */}
        <TeamSection />

        {/* Global Connectivity Map Section */}
        <NetworkMapSection />

        {/* Brand footer */}
        <Footer />
      </div>
    </div>
  );
};

export default MainPage;