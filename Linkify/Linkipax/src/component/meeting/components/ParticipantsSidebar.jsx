import React from "react";
import { Button } from "react-bootstrap";
import { FiUsers, FiX, FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import { FaChalkboardTeacher } from "react-icons/fa";

export default function ParticipantsSidebar({
  participants,
  username,
  isMicOn,
  isVideoOn,
  isScreenSharing,
  setShowParticipants,
}) {
  return (
    <div className="participants-sidebar">
      <div className="sidebar-header">
        <h3>
          <FiUsers /> Participants ({participants.length + 1})
        </h3>
        <Button
          variant="link"
          onClick={() => setShowParticipants(false)}
          className="close-btn"
        >
          <FiX />
        </Button>
      </div>
      <div className="participants-list">
        <div className="participant-item you">
          <div className="participant-avatar">
            {username ? username.charAt(0).toUpperCase() : "?"}
          </div>
          <div className="participant-info">
            <span>{username} (You)</span>
            <div className="participant-status">
              {isMicOn ? <FiMic size={12} /> : <FiMicOff size={12} />}
              {isVideoOn ? (
                <FiVideo size={12} />
              ) : (
                <FiVideoOff size={12} />
              )}
              {isScreenSharing && <FaChalkboardTeacher size={12} />}
            </div>
          </div>
        </div>
        {participants.map((participant) => (
          <div
            key={`participant-${participant.id}`}
            className="participant-item"
          >
            <div className="participant-avatar">
              {participant.username ? participant.username.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="participant-info">
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
