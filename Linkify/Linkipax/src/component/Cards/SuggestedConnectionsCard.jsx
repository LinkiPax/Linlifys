import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  ListGroup,
  Spinner,
  Badge,
  OverlayTrigger,
  Tooltip,
  Modal,
  Image,
  Form,
  ButtonGroup,
  Dropdown,
} from "react-bootstrap";
import {
  FiUserPlus,
  FiCheck,
  FiX,
  FiMoreHorizontal,
  FiUser,
  FiBriefcase,
  FiSend,
  FiMessageSquare,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./SuggestedConnectionsCard.css";

const SuggestedConnectionsCard = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("Please log in to see suggestions");

      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/api/user/suggestions/suggestions?userId=${userId}`
      );

      // Ensure we always have an array, even if API response structure varies
      const suggestionsData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setSuggestions(suggestionsData);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (targetUserId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        navigate("/login");
        return;
      }

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/suggestions/request`,
        {
          userId,
          targetUserId,
        }
      );

      setSuggestions((prev) =>
        prev.map((user) =>
          user._id === targetUserId
            ? { ...user, requestStatus: "pending" }
            : user
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send connection request");
    }
  };

  const handleRemove = (userId) => {
    setSuggestions((prev) => prev.filter((user) => user._id !== userId));
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      alert("Please enter a message");
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/messages`, {
        recipient: selectedUser._id,
        content: messageContent,
      });
      setShowMessageModal(false);
      setMessageContent("");
      alert("Message sent successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send message");
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <Card className="connections-card shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center bg-white border-0 pb-0">
        <div>
          <h5 className="mb-0 fw-bold">People You May Know</h5>
          <p className="text-muted small mb-0">
            Based on your profile and connections
          </p>
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={fetchSuggestions}
          disabled={loading}
          className="d-flex align-items-center"
        >
          <FiRefreshCw className={`me-1 ${loading ? "spin" : ""}`} />
          {loading ? "Refreshing" : "Refresh"}
        </Button>
      </Card.Header>

      <Card.Body className="px-3 py-2">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Finding suggestions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <FiUser size={48} className="text-muted mb-3" />
            <p className="text-danger mb-3">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/login")}
              className="px-3"
            >
              Log In
            </Button>
          </div>
        ) : suggestions.length > 0 ? (
          <ListGroup variant="flush" className="suggestions-list">
            <AnimatePresence>
              {suggestions.map((user) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListGroup.Item className="suggestion-item border-0 px-0 py-3">
                    <div className="d-flex align-items-start">
                      <div
                        className="profile-avatar me-3"
                        onClick={() => navigate(`/profile/${user._id}`)}
                      >
                        <Image
                          src={
                            user.profilePicture ||
                            `https://ui-avatars.com/api/?name=${user.name}&background=random`
                          }
                          roundedCircle
                          width={56}
                          height={56}
                          className="border border-2 border-white shadow-sm"
                        />
                      </div>

                      <div className="user-details flex-grow-1">
                        <div
                          className="d-flex justify-content-between align-items-start"
                          onClick={() => navigate(`/profile/${user._id}`)}
                        >
                          <div>
                            <h6 className="mb-1 user-name fw-bold">
                              {user.name}
                              {user.verified && (
                                <OverlayTrigger
                                  placement="top"
                                  overlay={<Tooltip>Verified</Tooltip>}
                                >
                                  <span className="verified-badge ms-1">✓</span>
                                </OverlayTrigger>
                              )}
                            </h6>
                            <div className="user-meta text-muted small">
                              {user.jobTitle && (
                                <span className="d-flex align-items-center me-2">
                                  <FiBriefcase size={12} className="me-1" />
                                  {user.jobTitle}
                                </span>
                              )}
                              {user.company && <span>at {user.company}</span>}
                            </div>
                          </div>
                        </div>

                        {user.mutualConnections > 0 && (
                          <div className="mutual-connections mt-2">
                            <Badge bg="light" text="dark" className="fw-normal">
                              {user.mutualConnections} mutual connection
                              {user.mutualConnections !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}

                        <div className="d-flex mt-3">
                          {user.requestStatus === "pending" ? (
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              disabled
                              className="flex-grow-1 me-2 d-flex align-items-center justify-content-center"
                            >
                              <FiCheck className="me-1" /> Request Sent
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleConnect(user._id)}
                              className="flex-grow-1 me-2 d-flex align-items-center justify-content-center"
                            >
                              <FiUserPlus className="me-1" /> Connect
                            </Button>
                          )}

                          <Dropdown>
                            <Dropdown.Toggle
                              variant="outline-secondary"
                              size="sm"
                              className="more-btn px-2"
                            >
                              <FiMoreHorizontal />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowMessageModal(true);
                                }}
                              >
                                <FiMessageSquare className="me-2" /> Send
                                Message
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() => handleRemove(user._id)}
                              >
                                <FiX className="me-2" /> Remove
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </div>
                      </div>
                    </div>
                  </ListGroup.Item>
                </motion.div>
              ))}
            </AnimatePresence>
          </ListGroup>
        ) : (
          <div className="text-center py-4">
            <FiUser size={48} className="text-muted mb-3" />
            <h5 className="mb-2">No suggestions available</h5>
            <p className="text-muted mb-3">
              We'll find more connections for you soon
            </p>
            <Button variant="outline-primary" onClick={fetchSuggestions}>
              Try Again
            </Button>
          </div>
        )}
      </Card.Body>

      {suggestions.length > 0 && (
        <Card.Footer className="text-center bg-white border-0 pt-0">
          <Button
            variant="link"
            onClick={() => navigate("/network")}
            className="text-primary fw-medium"
          >
            View all connections →
          </Button>
        </Card.Footer>
      )}

      {/* Message Modal */}
      <Modal
        show={showMessageModal}
        onHide={() => setShowMessageModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title>Message {selectedUser?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder={`Write a message to ${selectedUser?.name}`}
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="mb-3"
            />
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                onClick={() => setShowMessageModal(false)}
                className="me-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!messageContent.trim()}
              >
                <FiSend className="me-1" /> Send Message
              </Button>
            </div>
          </Form.Group>
        </Modal.Body>
      </Modal>
    </Card>
  );
};

export default SuggestedConnectionsCard;
