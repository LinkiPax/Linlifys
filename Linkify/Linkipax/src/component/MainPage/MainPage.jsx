import React, { Suspense, lazy } from "react";
import "./MainPage.css";
import MainNavbar from "./MainNavbar";

// Eagerly load lightweight sections
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";

// Lazy-load heavy sections (Three.js, video, globe, map)
const VideoShowcase = lazy(() => import("./components/VideoShowcase"));
const ToggleIntegration = lazy(() => import("./components/ToggleIntegration"));
const MeetingRoomSection = lazy(() => import("./components/MeetingRoomSection"));
const OpportunitiesSection = lazy(() => import("./components/OpportunitiesSection"));
const TeamSection = lazy(() => import("./components/TeamSection"));
const NetworkMapSection = lazy(() => import("./components/NetworkMapSection"));

/* Sleek dark-glass placeholder while lazy sections bundle loads */
const SectionLoader = () => (
  <div className="section-loader" aria-label="Loading section content">
    <div className="loader-pulse-ring" />
    <div className="loader-spinner" />
  </div>
);

const MainPage = () => {
  return (
    <div className="main-homepage-container" role="main">
      <MainNavbar />

      <main className="content-sections">
        {/* Hero Section */}
        <section id="hero">
          <HeroSection />
        </section>

        {/* Video & Feature Showcase */}
        <section id="features">
          <Suspense fallback={<SectionLoader />}>
            <VideoShowcase />
          </Suspense>
        </section>

        {/* Dual Identity & Real-time Translation */}
        <section id="dual-identity">
          <Suspense fallback={<SectionLoader />}>
            <ToggleIntegration />
          </Suspense>
        </section>

        {/* 3D Meeting Room */}
        <section id="meeting-room">
          <Suspense fallback={<SectionLoader />}>
            <MeetingRoomSection />
          </Suspense>
        </section>

        {/* AI Curated Opportunities */}
        <section id="opportunities">
          <Suspense fallback={<SectionLoader />}>
            <OpportunitiesSection />
          </Suspense>
        </section>

        {/* Team & Core Values */}
        <section id="team">
          <Suspense fallback={<SectionLoader />}>
            <TeamSection />
          </Suspense>
        </section>

        {/* Global Network Map */}
        <section id="global-network">
          <Suspense fallback={<SectionLoader />}>
            <NetworkMapSection />
          </Suspense>
        </section>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default MainPage;