import React, { Suspense, lazy } from "react";
import "./MainPage.css";
import MainNavbar from "./MainNavbar";

// Eagerly load lightweight sections
import HeroSection from "./components/HeroSection";
import Footer from "./components/Footer";

// Lazy-load heavy sections (Three.js, video, globe)
const VideoShowcase = lazy(() => import("./components/VideoShowcase"));
const ToggleIntegration = lazy(() => import("./components/ToggleIntegration"));
const MeetingRoomSection = lazy(() => import("./components/MeetingRoomSection"));
const OpportunitiesSection = lazy(() => import("./components/OpportunitiesSection"));
const TeamSection = lazy(() => import("./components/TeamSection"));
const NetworkMapSection = lazy(() => import("./components/NetworkMapSection"));

/* Minimal placeholder while lazy chunks load */
const SectionLoader = () => (
  <div className="section-loader">
    <div className="loader-spinner" />
  </div>
);

const MainPage = () => {
  return (
    <div className="main-homepage-container" role="main">
      <MainNavbar />

      <div className="content-sections">
        {/* Standard Hero Section (Lightweight, No Canvas) — loaded eagerly (above the fold) */}
        <HeroSection />

        {/* Everything below the fold is lazy-loaded */}
        <Suspense fallback={<SectionLoader />}>
          <VideoShowcase />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <ToggleIntegration />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <MeetingRoomSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <OpportunitiesSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <TeamSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <NetworkMapSection />
        </Suspense>

        {/* Footer — lightweight, loaded eagerly */}
        <Footer />
      </div>
    </div>
  );
};

export default MainPage;