import React from "react";
import { Button, Form, Alert, Spinner, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FiCopy } from "react-icons/fi";

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
}) {
  return (
    <div className="join-screen">
      <div className="join-card">
        <h1 className="text-center mb-4">
          <span className="logo-primary">Meeting</span>
          <span className="logo-secondary">Room</span>
          <span className="logo-tagline">Premium Video Meetings</span>
        </h1>

        {error && (
          <Alert variant="danger" className="text-center">
            {error}
          </Alert>
        )}

        <div className="action-buttons mb-4">
          <Button
            variant="primary"
            onClick={handleCreateRoom}
            disabled={loading}
            className="action-btn"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" /> Creating...
              </>
            ) : (
              "New Meeting"
            )}
          </Button>
          <div className="divider">or</div>
          <Form.Control
            type="text"
            placeholder="Enter Meeting ID"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            className="meeting-id-input"
          />
        </div>

        {roomCreated && (
          <div className="meeting-id-container">
            <p className="text-muted">Your Meeting ID:</p>
            <div className="meeting-id-display">
              <span>{meetingId}</span>
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Copy to clipboard</Tooltip>}
              >
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={copyMeetingId}
                  className="copy-btn"
                >
                  <FiCopy />
                </Button>
              </OverlayTrigger>
            </div>
            <p className="text-muted small mt-2">
              Share this ID with participants to join the meeting
            </p>
          </div>
        )}

        <Form className="join-form" onSubmit={(e) => { e.preventDefault(); handleJoinMeeting(); }}>
          <Form.Group className="mb-3">
            <Form.Label>Your Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            variant="success"
            type="submit"
            disabled={!meetingId || !username || loading}
            className="join-btn"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" /> Joining...
              </>
            ) : (
              "Join Meeting"
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
