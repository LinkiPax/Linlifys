import React from "react";
import { FiMicOff, FiMic, FiVideo, FiVideoOff } from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";

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
  return (
    <div className={`video-containers ${!showChat ? "full-width" : ""}`}>
      <div className="main-video">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className={!isVideoOn ? "video-off" : ""}
          onLoadedMetadata={(e) => {
            console.log("✅ Local video metadata loaded");
            e.target.play().catch((err) =>
              console.error("❌ Local video play failed:", err)
            );
          }}
          onCanPlay={(e) => {
            console.log("✅ Local video can play");
            e.target.play().catch((err) =>
              console.error("❌ Local video play failed:", err)
            );
          }}
        ></video>
        {(!isVideoOn || !mediaAccessGranted) && (
          <div className="video-placeholder">
            <div className="user-avatar">
              {username ? username.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        )}
        <div className="user-info">
          <span>{username} (You)</span>
          <div className="user-status">
            {!isMicOn && <FiMicOff className="mic-status" />}
            {isScreenSharing && (
              <FaChalkboardTeacher className="screen-share-icon" />
            )}
            {!mediaAccessGranted && (
              <span className="media-warning">No media access</span>
            )}
          </div>
        </div>
      </div>

      <div className="participants-grid">
        {participants.map((participant) => (
          <div
            key={`participant-${participant.id}`}
            className={`participant-video ${
              participant.id === activeSpeaker ? "active-speaker" : ""
            }`}
          >
            <video
              ref={(ref) => {
                if (!ref) return;

                // Store the reference in the passed-in ref object
                if (userVideoRefs) {
                  userVideoRefs.current[participant.id] = ref;
                }

                // Set srcObject if the stream is present and is not already set
                if (
                  participant.stream &&
                  ref.srcObject !== participant.stream
                ) {
                  console.log(`🎬 Setting up video for ${participant.username}`);
                  ref.srcObject = participant.stream;
                }
              }}
              autoPlay
              playsInline
              muted={participant.id === userId}
              className="remote-video"
              onLoadedMetadata={(e) => {
                console.log(`✅ Video metadata loaded for ${participant.username}`);
                const playPromise = e.target.play();
                if (playPromise !== undefined) {
                  playPromise.catch((err) => {
                    console.log(`⚠️ Auto-play prevented for ${participant.username}`);
                  });
                }
              }}
              onCanPlay={(e) => {
                const playPromise = e.target.play();
                if (playPromise !== undefined) {
                  playPromise.catch((err) => {
                    console.log(`⚠️ Play failed for ${participant.username}:`, err.name);
                  });
                }
              }}
              onError={(e) => {
                console.error(`❌ Video error for ${participant.username}:`, e.target.error);
              }}
            />
            {(!participant.stream || !participant.isVideoOn) && (
              <div className="video-placeholder">
                <div className="user-avatar">
                  {participant.username
                    ? participant.username.charAt(0).toUpperCase()
                    : "?"}
                </div>
              </div>
            )}
            <div className="user-info">
              <span>{participant.username}</span>
              <div className="participant-status">
                {participant.isMicOn ? (
                  <FiMic size={12} />
                ) : (
                  <FiMicOff size={12} />
                )}
                {participant.isVideoOn ? (
                  <FiVideo size={12} />
                ) : (
                  <FiVideoOff size={12} />
                )}
                {participant.isScreenSharing && (
                  <FaChalkboardTeacher size={12} />
                )}
                {!participant.connected && (
                  <span className="connection-warning">Connecting...</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
