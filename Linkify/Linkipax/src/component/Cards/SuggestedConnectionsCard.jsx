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
  Alert,
  Toast,
  ToastContainer,
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
  FiUsers,
  FiAward,
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
  const [toast, setToast] = useState(null);
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
      
      // Show success toast
      setToast({
        title: "Connection Request Sent",
        message: "You'll be notified when they accept your request",
        type: "success",
      });
    } catch (err) {
      setToast({
        title: "Connection Failed",
        message: err.response?.data?.message || "Failed to send connection request",
        type: "danger",
      });
    }
  };

  const handleRemove = (userId) => {
    const removedUser = suggestions.find(user => user._id === userId);
    setSuggestions((prev) => prev.filter((user) => user._id !== userId));
    
    setToast({
      title: "Suggestion Removed",
      message: `We've removed ${removedUser.name} from your suggestions`,
      type: "info",
    });
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setToast({
        title: "Message Empty",
        message: "Please enter a message before sending",
        type: "warning",
      });
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/messages`, {
        recipient: selectedUser._id,
        content: messageContent,
      });
      setShowMessageModal(false);
      setMessageContent("");
      setToast({
        title: "Message Sent",
        message: `Your message to ${selectedUser.name} was sent successfully`,
        type: "success",
      });
    } catch (err) {
      setToast({
        title: "Message Failed",
        message: err.response?.data?.message || "Failed to send message",
        type: "danger",
      });
    }
  };

  useEffect(() => {
    fetchSuggestions();
    
    // Simulate a connection acceptance (for demo purposes)
    const timer = setTimeout(() => {
      setToast({
        // title: "Connection Accepted",
        // message: "John Doe accepted your connection request",
        // type: "success",
        // showProfile: true,
        // profileId: "12345", // This would come from your actual API
      });
    }, 8000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Card className="connections-card shadow-lg">
        <Card.Header className="d-flex justify-content-between align-items-center bg-gradient-primary text-white border-0 pb-0">
          <div>
            <h5 className="mb-0 fw-bold d-flex align-items-center">
              <FiUsers className="me-2" /> People You May Know
            </h5>
            <p className="mb-0 opacity-75">
              Based on your profile and connections
            </p>
          </div>
          <Button
            variant="light"
            size="sm"
            onClick={fetchSuggestions}
            disabled={loading}
            className="d-flex align-items-center rounded-pill"
          >
            <FiRefreshCw className={`me-1 ${loading ? "spin" : ""}`} />
            {loading ? "Refreshing" : "Refresh"}
          </Button>
        </Card.Header>

        <Card.Body className="px-3 py-2">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Finding suggestions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4">
              <FiUser size={48} className="text-muted mb-3" />
              <p className="text-danger mb-3">{error}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate("/login")}
                className="px-3 rounded-pill"
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
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <ListGroup.Item className="suggestion-item border-0 px-0 py-3">
                      <div className="d-flex align-items-start">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="profile-avatar me-3 position-relative"
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
                            className="border border-3 border-white shadow"
                          />
                          {user.verified && (
                            <span className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1 border border-2 border-white">
                              <FiAward size={10} className="text-white" />
                            </span>
                          )}
                        </motion.div>

                        <div className="user-details flex-grow-1">
                          <div
                            className="d-flex justify-content-between align-items-start mb-1"
                            onClick={() => navigate(`/profile/${user._id}`)}
                          >
                            <div>
                              <h6 className="mb-1 user-name fw-bold">
                                {user.name}
                              </h6>
                              <div className="user-meta text-muted small d-flex flex-wrap">
                                {user.jobTitle && (
                                  <span className="d-flex align-items-center me-2">
                                    <FiBriefcase size={12} className="me-1" />
                                    {user.jobTitle}
                                  </span>
                                )}
                                {user.company && (
                                  <span className="d-flex align-items-center">
                                    at {user.company}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {user.mutualConnections > 0 && (
                            <div className="mutual-connections mt-2">
                              <Badge bg="light" text="dark" className="fw-normal px-2 py-1">
                                <FiUsers size={12} className="me-1" />
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
                                className="flex-grow-1 me-2 d-flex align-items-center justify-content-center rounded-pill"
                              >
                                <FiClock className="me-1" /> Pending
                              </Button>
                            ) : (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleConnect(user._id)}
                                  className="flex-grow-1 me-2 d-flex align-items-center justify-content-center rounded-pill"
                                >
                                  <FiUserPlus className="me-1" /> Connect
                                </Button>
                              </motion.div>
                            )}

                            <Dropdown>
                              <Dropdown.Toggle
                                variant="outline-secondary"
                                size="sm"
                                className="more-btn px-2 rounded-pill"
                              >
                                <FiMoreHorizontal />
                              </Dropdown.Toggle>
                              <Dropdown.Menu>
                                <Dropdown.Item
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowMessageModal(true);
                                  }}
                                  className="d-flex align-items-center"
                                >
                                  <FiMessageSquare className="me-2" /> Send Message
                                </Dropdown.Item>
                                <Dropdown.Item
                                  onClick={() => handleRemove(user._id)}
                                  className="d-flex align-items-center"
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
              <Button variant="primary" onClick={fetchSuggestions} className="rounded-pill">
                Try Again
              </Button>
            </div>
          )}
        </Card.Body>

        {suggestions.length > 0 && (
          <Card.Footer className="text-center bg-light border-0 pt-0">
            <Button
              variant="link"
              onClick={() => navigate("/network")}
              className="text-primary fw-medium p-0"
            >
              View all connections <FiUsers className="ms-1" />
            </Button>
          </Card.Footer>
        )}

        {/* Message Modal */}
        <Modal
          show={showMessageModal}
          onHide={() => setShowMessageModal(false)}
          centered
          className="message-modal"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="w-100 text-center">
              <div className="d-flex justify-content-center mb-2">
                <Image
                  src={
                    selectedUser?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${selectedUser?.name}&background=random`
                  }
                  roundedCircle
                  width={64}
                  height={64}
                  className="border border-3 border-primary"
                />
              </div>
              Message {selectedUser?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder={`Write a message to ${selectedUser?.name}`}
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="mb-3 rounded"
              />
              <div className="d-flex justify-content-end">
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowMessageModal(false)}
                  className="me-2 rounded-pill"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                  className="rounded-pill d-flex align-items-center"
                >
                  <FiSend className="me-1" /> Send Message
                </Button>
              </div>
            </Form.Group>
          </Modal.Body>
        </Modal>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3 position-fixed">
        <Toast 
          show={!!toast} 
          onClose={() => setToast(null)} 
          delay={5000} 
          autohide
          bg={toast?.type}
          className={`border-0 shadow-lg ${toast?.showProfile ? 'toast-with-action' : ''}`}
        >
          <Toast.Header className={`text-${toast?.type} bg-white`}>
            <strong className="me-auto">{toast?.title}</strong>
          </Toast.Header>
          <Toast.Body className="bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <p className="mb-0">{toast?.message}</p>
              {toast?.showProfile && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="ms-3 rounded-pill"
                  onClick={() => navigate(`/profile/${toast.profileId}`)}
                >
                  View Profile
                </Button>
              )}
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default SuggestedConnectionsCard;