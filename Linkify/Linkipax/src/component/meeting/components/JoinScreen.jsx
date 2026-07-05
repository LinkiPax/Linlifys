import React from "react";
import { Button, Form, Alert, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FiCopy, FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";

export default function JoinScreen({
  meetingId,
  setMeetingId,
  username,
  setUsername,
  loading,
  error,
  roomCreated,
  handleCreateRoom,
  handleJoinMeeting,
  copyMeetingId,
  localVideoRef,
  isVideoOn,
  isMicOn,
  toggleVideo,
  toggleMic,
}) {
  return (
    <div className="google-meet-green-room">
      <div className="green-room-container">
        {/* Left Side: Video Preview Frame */}
        <div className="preview-panel">
          <div className="video-preview-wrapper">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`local-preview-video ${!isVideoOn ? "video-off" : ""}`}
            />
            {!isVideoOn && (
              <div className="avatar-placeholder">
                <div className="avatar-circle">
                  {username ? username.charAt(0).toUpperCase() : "?"}
                </div>
              </div>
            )}
            
            {/* Camera/Mic floating overlays */}
            <div className="preview-controls-overlay">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{isMicOn ? "Mute microphone" : "Unmute microphone"}</Tooltip>}
              >
                <button
                  type="button"
                  className={`overlay-btn ${!isMicOn ? "off" : ""}`}
                  onClick={toggleMic}
                >
                  {isMicOn ? <FiMic /> : <FiMicOff />}
                </button>
              </OverlayTrigger>
              
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{isVideoOn ? "Turn camera off" : "Turn camera on"}</Tooltip>}
              >
                <button
                  type="button"
                  className={`overlay-btn ${!isVideoOn ? "off" : ""}`}
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <FiVideo /> : <FiVideoOff />}
                </button>
              </OverlayTrigger>
            </div>
          </div>
        </div>

        {/* Right Side: Credentials & Join Card */}
        <div className="join-panel">
          <div className="join-actions-card">
            <h2>Ready to join?</h2>
            
            {error && (
              <Alert variant="danger" className="text-center py-2 mb-3">
                {error}
              </Alert>
            )}

            <Form className="join-form-meet" onSubmit={(e) => { e.preventDefault(); handleJoinMeeting(); }}>
              <Form.Group className="mb-4">
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="meet-input name-input"
                  required
                />
              </Form.Group>

              <div className="meet-id-section mb-4">
                <div className="input-with-button">
                  <Form.Control
                    type="text"
                    placeholder="Enter Meeting ID"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    className="meet-input id-input"
                  />
                  <Button
                    type="button"
                    variant="outline-primary"
                    onClick={handleCreateRoom}
                    disabled={loading}
                    className="meet-create-btn"
                  >
                    {loading ? <Spinner size="sm" /> : "New code"}
                  </Button>
                </div>
              </div>

              {roomCreated && (
                <div className="new-room-display mb-4">
                  <span className="small text-muted">Created meeting code:</span>
                  <div className="code-box">
                    <span className="code-text">{meetingId}</span>
                    <button type="button" className="code-copy-btn" onClick={copyMeetingId}>
                      <FiCopy /> Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="join-buttons-group">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={!meetingId || !username || loading}
                  className="meet-join-btn primary-btn"
                >
                  Join now
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
