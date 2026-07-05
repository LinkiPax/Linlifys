import React, { useState, useEffect } from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiShare2,
  FiInfo,
  FiUsers,
  FiMessageSquare,
  FiSettings,
} from "react-icons/fi";
import { MdCallEnd } from "react-icons/md";
import { BsRecordCircle } from "react-icons/bs";

export default function MeetingControls({
  meetingId,
  isMicOn,
  toggleMic,
  mediaAccessGranted,
  isVideoOn,
  toggleVideo,
  isScreenSharing,
  shareScreen,
  isRecording,
  stopRecording,
  startRecording,
  handleLeaveMeeting,
  showParticipants,
  setShowParticipants,
  participantsCount,
  showChat,
  setShowChat,
  setShowSettings,
}) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="google-meet-controls-bar">
      {/* Left side: Time and Meeting Code */}
      <div className="bar-section-left">
        <span className="meet-clock">{time}</span>
        <span className="meet-divider">|</span>
        <span className="meet-code-label">{meetingId}</span>
      </div>

      {/* Center side: Primary Action Circles */}
      <div className="bar-section-center">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{isMicOn ? "Turn off microphone" : "Turn on microphone"}</Tooltip>}
        >
          <button
            type="button"
            onClick={toggleMic}
            disabled={!mediaAccessGranted}
            className={`meet-control-circle ${!isMicOn ? "disabled-off" : ""}`}
          >
            {isMicOn ? <FiMic /> : <FiMicOff />}
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{isVideoOn ? "Turn off camera" : "Turn on camera"}</Tooltip>}
        >
          <button
            type="button"
            onClick={toggleVideo}
            disabled={!mediaAccessGranted}
            className={`meet-control-circle ${!isVideoOn ? "disabled-off" : ""}`}
          >
            {isVideoOn ? <FiVideo /> : <FiVideoOff />}
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{isScreenSharing ? "Stop presenting" : "Present now"}</Tooltip>}
        >
          <button
            type="button"
            onClick={shareScreen}
            className={`meet-control-circle ${isScreenSharing ? "active-on" : ""}`}
          >
            <FiShare2 />
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{isRecording ? "Stop recording" : "Record meeting"}</Tooltip>}
        >
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`meet-control-circle ${isRecording ? "recording-on" : ""}`}
          >
            <BsRecordCircle />
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Leave call</Tooltip>}
        >
          <button
            type="button"
            onClick={handleLeaveMeeting}
            className="meet-control-leave"
          >
            <MdCallEnd />
          </button>
        </OverlayTrigger>
      </div>

      {/* Right side: Utilities & Info */}
      <div className="bar-section-right">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Show meeting details</Tooltip>}
        >
          <button type="button" className="meet-utility-btn">
            <FiInfo />
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Show everyone ({participantsCount})</Tooltip>}
        >
          <button
            type="button"
            onClick={() => {
              setShowParticipants(!showParticipants);
              if (showChat) setShowChat(false);
            }}
            className={`meet-utility-btn ${showParticipants ? "active-tab" : ""}`}
          >
            <FiUsers />
            {participantsCount > 0 && (
              <span className="meet-badge">{participantsCount}</span>
            )}
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Chat with everyone</Tooltip>}
        >
          <button
            type="button"
            onClick={() => {
              setShowChat(!showChat);
              if (showParticipants) setShowParticipants(false);
            }}
            className={`meet-utility-btn ${showChat ? "active-tab" : ""}`}
          >
            <FiMessageSquare />
          </button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Settings</Tooltip>}
        >
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="meet-utility-btn"
          >
            <FiSettings />
          </button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
