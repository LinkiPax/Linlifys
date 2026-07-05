import React from "react";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiShare2,
  FiLogOut,
  FiUsers,
  FiMessageSquare,
  FiSettings,
} from "react-icons/fi";
import { BsRecordCircle } from "react-icons/bs";

export default function MeetingControls({
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
  return (
    <div className="controls-container">
      <div className="control-buttons">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{isMicOn ? "Mute" : "Unmute"}</Tooltip>}
        >
          <Button
            variant={isMicOn ? "secondary" : "danger"}
            onClick={toggleMic}
            disabled={!mediaAccessGranted}
            className="control-btn"
          >
            {isMicOn ? <FiMic /> : <FiMicOff />}
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{isVideoOn ? "Stop video" : "Start video"}</Tooltip>}
        >
          <Button
            variant={isVideoOn ? "secondary" : "danger"}
            onClick={toggleVideo}
            disabled={!mediaAccessGranted}
            className="control-btn"
          >
            {isVideoOn ? <FiVideo /> : <FiVideoOff />}
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip>
              {isScreenSharing ? "Stop sharing" : "Share screen"}
            </Tooltip>
          }
        >
          <Button
            variant={isScreenSharing ? "danger" : "secondary"}
            onClick={shareScreen}
            className="control-btn"
          >
            <FiShare2 /> {isScreenSharing ? "Stop" : "Share"}
          </Button>
        </OverlayTrigger>

        {isRecording ? (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Stop recording</Tooltip>}
          >
            <Button
              variant="danger"
              onClick={stopRecording}
              className="control-btn"
            >
              <BsRecordCircle /> Recording
            </Button>
          </OverlayTrigger>
        ) : (
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Start recording</Tooltip>}
          >
            <Button
              variant="secondary"
              onClick={startRecording}
              className="control-btn"
            >
              <BsRecordCircle /> Record
            </Button>
          </OverlayTrigger>
        )}
      </div>

      <div>
        <Button
          variant="danger"
          onClick={handleLeaveMeeting}
          className="leave-btn"
        >
          <FiLogOut /> Leave
        </Button>
      </div>

      <div className="utility-buttons">
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Participants ({participantsCount})</Tooltip>}
        >
          <Button
            variant={showParticipants ? "primary" : "secondary"}
            onClick={() => setShowParticipants(!showParticipants)}
            className="utility-btn"
          >
            <FiUsers />
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Toggle chat</Tooltip>}
        >
          <Button
            variant={showChat ? "primary" : "secondary"}
            onClick={() => setShowChat(!showChat)}
            className="utility-btn"
          >
            <FiMessageSquare />
          </Button>
        </OverlayTrigger>

        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>Settings</Tooltip>}
        >
          <Button
            variant="secondary"
            onClick={() => setShowSettings(true)}
            className="utility-btn"
          >
            <FiSettings />
          </Button>
        </OverlayTrigger>
      </div>
    </div>
  );
}
