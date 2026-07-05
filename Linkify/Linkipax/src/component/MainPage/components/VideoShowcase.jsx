import React, { useState, useEffect, useRef } from "react";
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaVideo,
} from "react-icons/fa";

const aroraImage = "/aurora.d2a6947c3dcfb777c25f.webp";
const dashboardvideo = "/videos/Dashboard.mp4";

export default function VideoShowcase() {
  const features = [
    { name: "Dashboard", video: dashboardvideo },
    { name: "Team", video: "/videos/demo2.mp4" },
    { name: "Features", video: "/videos/demo3.mp4" },
  ];

  const [videoSrc, setVideoSrc] = useState(features[0].video);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoError = () => {
      console.error("Video failed to load:", videoSrc);
      if (videoSrc !== dashboardvideo) {
        console.log("Falling back to default dashboard video.");
        setVideoSrc(dashboardvideo);
      } else {
        setIsPlaying(false);
        setVideoError(true);
      }
    };

    const handleVideoLoad = () => {
      console.log("Video loaded successfully:", videoSrc);
      if (isPlaying) {
        video.play().catch(err => {
          console.error("Video play failed:", err);
          setIsPlaying(false);
        });
      }
    };

    video.addEventListener('error', handleVideoError);
    video.addEventListener('loadeddata', handleVideoLoad);
    video.addEventListener('canplay', handleVideoLoad);

    if (video.readyState >= 3 && isPlaying) {
      video.play().catch(err => {
        console.error("Video play failed:", err);
        setIsPlaying(false);
      });
    }

    return () => {
      video.removeEventListener('error', handleVideoError);
      video.removeEventListener('loadeddata', handleVideoLoad);
      video.removeEventListener('canplay', handleVideoLoad);
    };
  }, [videoSrc, isPlaying]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Play failed:", err);
        setIsPlaying(false);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume > 0) {
        videoRef.current.muted = false;
      }
    }
  };

  const handleProgress = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const seekTime = (e.target.value / 100) * video.duration;
    video.currentTime = seekTime;
    setProgress(e.target.value);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    video.volume = volume;
    video.addEventListener("timeupdate", handleProgress);
    
    return () => {
      video.removeEventListener("timeupdate", handleProgress);
    };
  }, [volume]);

  return (
    <section className="video-showcase-section" aria-labelledby="video-showcase-title">
      <img
        src={aroraImage}
        alt="Aurora Background"
        className="video-bg-image"
        loading="lazy"
      />
      <div className="video-content">
        <div className="feature-header">
          <h2 id="video-showcase-title">
            One platform. Infinite possibilities
          </h2>
          <p>
            Build your brand, share your world, and connect deeper — all in
            one place.
          </p>
        </div>

        <div className="tablet-wrapper">
          <div className="tablet-normal">
            <video
              id="feature-video"
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted={volume === 0}
              loop
              playsInline
              preload="auto"
              aria-label="Feature demonstration video"
            />
            
            {videoError && (
              <div className="video-error-state">
                <div className="error-content">
                  <FaVideo size={32} />
                  <h4>Video Not Available</h4>
                  <p>This demo video cannot be loaded.</p>
                  <div className="error-actions">
                    <button 
                      onClick={() => window.open(videoSrc, '_blank')}
                      className="error-btn"
                    >
                      Try Direct Link
                    </button>
                    <button 
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.load();
                          setVideoError(false);
                        }
                      }}
                      className="error-btn secondary"
                    >
                      Retry Loading
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="video-controls">
              <button
                className="play-pause-icon"
                onClick={handlePlayPause}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="video-progress"
                aria-label="Video progress"
              />
              <div className="volume-control">
                <button
                  onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
                  aria-label={volume > 0 ? "Mute" : "Unmute"}
                >
                  {volume > 0 ? <FaVolumeUp /> : <FaVolumeMute />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                  aria-label="Volume control"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="feature-navbar" role="navigation" aria-label="Feature selection">
          {features.map((feature, idx) => (
            <button
              key={idx}
              onClick={() => {
                setVideoSrc(feature.video);
                setIsPlaying(true);
              }}
              className={videoSrc === feature.video ? "active" : ""}
              aria-current={videoSrc === feature.video ? "true" : "false"}
            >
              {feature.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
