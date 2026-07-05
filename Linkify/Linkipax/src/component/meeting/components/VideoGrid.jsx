import React, { useState } from "react";
import { FiMicOff, FiMic, FiVideo, FiVideoOff } from "react-icons/fi";
import { FaChalkboardTeacher, FaThumbtack } from "react-icons/fa";

export default function VideoGrid({
  localVideoRef,
  isVideoOn,
  mediaAccessGranted,
  username,
  isMicOn,
  isScreenSharing,
  participants,
  activeSpeaker,
  userId,
  userVideoRefs,
  showChat,
}) {
  const [pinnedId, setPinnedId] = useState(null);

  // Helper to build list of all active streams
  const feeds = [];
  
  // Local stream feed
  feeds.push({
    id: "local",
    username: `${username} (You)`,
    isVideoOn,
    isMicOn,
    isScreenSharing,
    mediaAccessGranted,
    ref: localVideoRef,
    isLocal: true,
  });

  // Remote participant feeds
  participants.forEach((p) => {
    feeds.push({
      id: p.id,
      username: p.username,
      isVideoOn: p.isVideoOn,
      isMicOn: p.isMicOn,
      isScreenSharing: p.isScreenSharing,
      connected: p.connected,
      stream: p.stream,
      isLocal: false,
    });
  });

  const handlePinToggle = (id) => {
    setPinnedId((prev) => (prev === id ? null : id));
  };

  // Split into pinned feed and side feeds if a feed is pinned
  const pinnedFeed = pinnedId ? feeds.find((f) => f.id === pinnedId) : null;
  const secondaryFeeds = pinnedId ? feeds.filter((f) => f.id !== pinnedId) : feeds;

  // Render a single video tile (Google Meet style)
  const renderTile = (feed, isLarge = false) => {
    const isFeedActiveSpeaker = feed.id === "local" ? activeSpeaker === userId : feed.id === activeSpeaker;
    const isMuted = !feed.isMicOn;

    return (
      <div
        key={`tile-${feed.id}`}
        className={`meet-tile ${isLarge ? "large-pinned" : ""} ${
          isFeedActiveSpeaker ? "active-speaker-border" : ""
        }`}
      >
        {feed.isLocal ? (
          <video
            ref={feed.ref}
            autoPlay
            muted
            playsInline
            className={!feed.isVideoOn ? "video-hidden" : ""}
          />
        ) : (
          <video
            ref={(ref) => {
              if (!ref) return;
              if (userVideoRefs) {
                userVideoRefs.current[feed.id] = ref;
              }
              if (feed.stream && ref.srcObject !== feed.stream) {
                ref.srcObject = feed.stream;
              }
            }}
            autoPlay
            playsInline
            muted={feed.id === userId}
            className={!feed.isVideoOn ? "video-hidden" : ""}
            onLoadedMetadata={(e) => {
              e.target.play().catch(() => {});
            }}
          />
        )}

        {/* Avatar Placeholder when video is off */}
        {(!feed.isVideoOn || (feed.isLocal && !feed.mediaAccessGranted)) && (
          <div className="meet-avatar-placeholder">
            <div className="meet-avatar-circle">
              {feed.username ? feed.username.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        )}

        {/* Hover overlay controls (e.g. Pin button) */}
        <div className="tile-hover-controls">
          <button
            type="button"
            className={`tile-pin-btn ${pinnedId === feed.id ? "active-pinned" : ""}`}
            onClick={() => handlePinToggle(feed.id)}
            title={pinnedId === feed.id ? "Unpin screen" : "Pin screen"}
          >
            <FaThumbtack />
          </button>
        </div>

        {/* Bottom indicator tag */}
        <div className="tile-info-tag">
          <span className="tile-name">{feed.username}</span>
          <div className="tile-badges">
            {isMuted ? (
              <span className="badge-icon muted"><FiMicOff /></span>
            ) : (
              <span className="badge-icon"><FiMic /></span>
            )}
            {feed.isScreenSharing && (
              <span className="badge-icon sharing"><FaChalkboardTeacher /></span>
            )}
            {!feed.isLocal && !feed.connected && (
              <span className="badge-text">Connecting...</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`google-meet-grid-container ${showChat ? "sidebar-open" : ""}`}>
      {pinnedFeed ? (
        <div className="pinned-layout-wrapper">
          {/* Main dominant focus panel */}
          <div className="pinned-focus-area">
            {renderTile(pinnedFeed, true)}
          </div>

          {/* Right strip scroll list of other participants */}
          <div className="pinned-strip-sidebar">
            {secondaryFeeds.map((feed) => renderTile(feed, false))}
          </div>
        </div>
      ) : (
        /* Equal-sized Auto Grid Layout */
        <div className={`meet-auto-grid tiles-count-${feeds.length}`}>
          {feeds.map((feed) => renderTile(feed, false))}
        </div>
      )}
    </div>
  );
}
