import React, { useState, useEffect, useRef } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaTachometerAlt,
  FaVideo,
  FaCompress,
  FaRedo,
  FaSparkles,
} from "react-icons/fa";
import "./VideoShowcase.css";

const featureTabs = [
  {
    id: "dashboard",
    name: "Unified Dashboard",
    icon: <FaTachometerAlt />,
    video: "/videos/Dashboard.mp4",
    tagline: "Live dual-mode interface with instant context switching",
  },
  {
    id: "collaboration",
    name: "Meeting & Video Hub",
    icon: <FaVideo />,
    video: "/252736_large.mp4",
    tagline: "Next-generation video collaboration with real-time translation",
  },
  {
    id: "intelligence",
    name: "AI Opportunities",
    icon: <FaSparkles />,
    video: "/videos/Dashboard.mp4",
    tagline: "Automated profile optimization, job alerts, and hackathons",
  },
];

export default function VideoShowcase() {
  const [activeTab, setActiveTab] = useState(featureTabs[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(true); // default muted for autoplay compatibility
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef(null);
  const frameRef = useRef(null);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Video source change
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setProgress(0);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay policy prevented playback, keep muted
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setIsPlaying(false));
        });
    }
  }, [activeTab]);

  // Video event handlers
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
    setCurrentTime(formatTime(video.currentTime));
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(formatTime(video.duration));
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const seekPercentage = parseFloat(e.target.value);
    video.currentTime = (seekPercentage / 100) * video.duration;
    setProgress(seekPercentage);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && volume === 0) {
      setVolume(0.5);
      video.volume = 0.5;
    }
  };

  const handleVolumeSlider = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    const video = videoRef.current;
    if (video) {
      video.volume = newVol;
      if (newVol > 0 && isMuted) {
        video.muted = false;
        setIsMuted(false);
      } else if (newVol === 0) {
        video.muted = true;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!frameRef.current) return;
    if (!document.fullscreenElement) {
      frameRef.current.requestFullscreen().catch((err) => console.log(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="video-showcase-section">
      <div className="video-content-container">
        {/* Section Header */}
        <div className="section-header-block">
          <span className="section-pill-badge">
            ✦ Dynamic Experience
          </span>
          <h2 className="section-main-heading">
            Engineered for <span className="heading-gradient-accent">Effortless Flow</span>
          </h2>
          <p className="section-subtext">
            Explore the interface designed to unify your communications, video conferencing, and career growth in one fluid system.
          </p>
        </div>

        {/* Device Mockup */}
        <div className="device-frame-wrapper" ref={frameRef}>
          <div className="device-inner-screen">
            {/* Header bar */}
            <div className="device-header-bar">
              <div className="window-dots">
                <span className="window-dot dot-red" />
                <span className="window-dot dot-yellow" />
                <span className="window-dot dot-green" />
              </div>
              <div className="window-url-bar">
                <span>https://app.linkipax.com/{activeTab.id}</span>
              </div>
            </div>

            {/* Video Viewport */}
            <div className="device-viewport">
              <video
                ref={videoRef}
                src={activeTab.video}
                loop
                playsInline
                autoPlay
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={() => setHasError(true)}
                className="feature-video-element"
                aria-label={activeTab.name}
              />

              {hasError && (
                <div className="video-fallback-banner">
                  <h4>Video Preview Loading</h4>
                  <p>Stream buffer initializing. Click below to retry.</p>
                  <button
                    type="button"
                    className="nav-btn nav-btn-primary"
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.load();
                        setHasError(false);
                      }
                    }}
                  >
                    <FaRedo /> Retry Video Stream
                  </button>
                </div>
              )}

              {/* Custom Player Controls */}
              <div className="video-player-controls">
                <button
                  type="button"
                  className="control-btn"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>

                <div className="progress-track-container">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={progress}
                    onChange={handleSeek}
                    className="video-progress-slider"
                    aria-label="Video scrubber"
                  />
                </div>

                <span style={{ fontSize: "0.78rem", color: "#cbd5e1", minWidth: "75px" }}>
                  {currentTime} / {duration}
                </span>

                <div className="volume-group">
                  <button
                    type="button"
                    className="control-btn"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeSlider}
                    className="volume-slider"
                    aria-label="Volume controller"
                  />
                </div>

                <button
                  type="button"
                  className="control-btn"
                  onClick={toggleFullscreen}
                  aria-label="Toggle Fullscreen"
                >
                  <FaExpand />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Tab Selector */}
        <div className="showcase-tab-bar" role="tablist">
          {featureTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab.id === tab.id}
              className={`showcase-tab-btn ${activeTab.id === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
