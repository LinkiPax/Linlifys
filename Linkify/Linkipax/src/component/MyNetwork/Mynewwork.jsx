import React, { useEffect, useState } from "react";
import { Button, Card, Spinner, Badge, Modal, Form } from "react-bootstrap";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiMessageSquare,
  FiUsers,
  FiBell,
} from "react-icons/fi";
import "./MyNetwork.css";

const MyNetwork = () => {
  const location = useLocation();
  const { targetUserId } = location.state || {};
  const userId = localStorage.getItem("userId");

  const [connections, setConnections] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState(null);
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    if (!userId) return;

    const fetchNetwork = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/api/user/suggestions/network?userId=${userId}`
        );
        setConnections(response.data.connections || []);
        setConnectionRequests(response.data.requests || []);
        setPendingRequests(response.data.pending || []);
        setBlockedUsers(response.data.blocked || []);
        setFilteredConnections(response.data.connections || []);
      } catch (error) {
        setError("Failed to fetch network data");
        console.error("Error fetching network:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNetwork();
  }, [userId]);

  const navigate = useNavigate();
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredConnections(connections);
    } else {
      const filtered = connections.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.jobTitle &&
            user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (user.company &&
            user.company.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredConnections(filtered);
    }
  }, [searchTerm, connections]);

  const handleAccept = async (targetUserId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/suggestions/accept`,
        {
          userId,
          targetUserId,
        }
      );

      const acceptedUser = connectionRequests.find(
        (user) => user._id === targetUserId
      );

      setConnections((prev) => [...prev, acceptedUser]);
      setConnectionRequests((prev) =>
        prev.filter((user) => user._id !== targetUserId)
      );
    } catch (error) {
      console.error("Error accepting connection:", error);
      alert("Failed to accept connection");
    }
  };

  const handleDecline = async (targetUserId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/suggestions/decline`,
        {
          userId,
          targetUserId,
        }
      );
      setConnectionRequests((prev) =>
        prev.filter((user) => user._id !== targetUserId)
      );
    } catch (error) {
      console.error("Error declining connection:", error);
      alert("Failed to decline connection");
    }
  };

  const confirmBlock = (user) => {
    setUserToBlock(user);
    setShowBlockModal(true);
  };

  const handleBlock = async () => {
    if (!userToBlock) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/suggestions/block`,
        {
          userId,
          targetUserId: userToBlock._id,
        }
      );

      // Remove from all lists
      setConnections((prev) =>
        prev.filter((user) => user._id !== userToBlock._id)
      );
      setConnectionRequests((prev) =>
        prev.filter((user) => user._id !== userToBlock._id)
      );
      setPendingRequests((prev) =>
        prev.filter((user) => user._id !== userToBlock._id)
      );
      setBlockedUsers((prev) => [...prev, userToBlock]);

      setShowBlockModal(false);
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user");
    }
  };
  const handleMessageClick = (userId) => {
    navigate(`/messages?userId=${userId}`);
  };
  const handleUnblock = async (targetUserId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/suggestions/unblock`,
        {
          userId,
          targetUserId,
        }
      );

      setBlockedUsers((prev) =>
        prev.filter((user) => user._id !== targetUserId)
      );
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="my-network-container"
    >
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              <FiUsers className="me-2" />
              My Network
            </h4>
            <Badge pill bg="primary">
              {connectionRequests.length} new requests
            </Badge>
          </div>

          <div className="d-flex mt-3 flex-wrap">
            <Button
              variant={activeTab === "requests" ? "primary" : "outline-primary"}
              className="me-2 mb-2 rounded-pill"
              onClick={() => setActiveTab("requests")}
            >
              <FiBell className="me-1" />
              Requests ({connectionRequests.length})
            </Button>
            <Button
              variant={
                activeTab === "connections" ? "primary" : "outline-primary"
              }
              className="me-2 mb-2 rounded-pill"
              onClick={() => setActiveTab("connections")}
            >
              <FiUserCheck className="me-1" />
              Connections ({connections.length})
            </Button>
            <Button
              variant={activeTab === "pending" ? "primary" : "outline-primary"}
              className="me-2 mb-2 rounded-pill"
              onClick={() => setActiveTab("pending")}
            >
              <FiUserPlus className="me-1" />
              Pending ({pendingRequests.length})
            </Button>
            <Button
              variant={activeTab === "blocked" ? "primary" : "outline-primary"}
              className="mb-2 rounded-pill"
              onClick={() => setActiveTab("blocked")}
            >
              <FiUserX className="me-1" />
              Blocked ({blockedUsers.length})
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {error && (
            <div className="alert alert-danger alert-dismissible fade show">
              {error}
              <button
                type="button"
                className="btn-close"
                onClick={() => setError(null)}
              ></button>
            </div>
          )}

          {activeTab === "requests" && (
            <>
              <h5 className="mb-3">
                <FiUserPlus className="me-2" />
                Connection Requests
              </h5>

              {connectionRequests.length > 0 ? (
                <div className="row">
                  {connectionRequests.map((user) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="col-md-6 col-lg-4 mb-4"
                    >
                      <Card className="h-100 shadow-sm">
                        <Card.Body className="text-center">
                          <div className="position-relative">
                            <img
                              src={
                                user.profilePicture ||
                                `https://ui-avatars.com/api/?name=${user.name}&size=150`
                              }
                              alt="Profile"
                              className="rounded-circle mb-3 profile-image-my"
                              width="100"
                            height="100"
                            />
                            <Badge
                              bg="success"
                              className="position-absolute bottom-0 end-0"
                            >
                              New
                            </Badge>
                          </div>
                          <Card.Title>{user.name}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {user.jobTitle}{" "}
                            {user.company && `at ${user.company}`}
                          </Card.Subtitle>
                          <div className="d-flex justify-content-center gap-2 mt-3">
                            <Button
                              variant="success"
                              size="sm"
                              className="rounded-pill"
                              onClick={() => handleAccept(user._id)}
                            >
                              <FiUserCheck className="me-1" />
                              Accept
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="rounded-pill"
                              onClick={() => handleDecline(user._id)}
                            >
                              <FiUserX className="me-1" />
                              Decline
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <FiBell size={48} className="text-muted mb-3" />
                  <h5>No connection requests</h5>
                  <p className="text-muted">
                    When you receive connection requests, they'll appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "connections" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>
                  <FiUserCheck className="me-2" />
                  Your Connections ({connections.length})
                </h5>
                <Form.Control
                  type="search"
                  placeholder="Search connections..."
                  className="w-25"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredConnections.length > 0 ? (
                <div className="row">
                  {filteredConnections.map((user) => (
                    <motion.div
                      key={user._id}
                      whileHover={{ scale: 1.02 }}
                      className="col-md-6 col-lg-4 mb-4"
                    >
                      <Card className="h-100 shadow-sm">
                        <Card.Body className="text-center">
                          <img
                            src={
                              user.profilePicture ||
                              `https://ui-avatars.com/api/?name=${user.name}&size=150`
                            }
                            alt="Profile"
                            className="rounded-circle mb-3 profile-image-my"
                            width="100"
                            height="100"
                          />
                          <Card.Title>{user.name}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {user.jobTitle}{" "}
                            {user.company && `at ${user.company}`}
                          </Card.Subtitle>
                          <div className="d-flex justify-content-center gap-2 mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              className="rounded-pill"
                              onClick={() => handleMessageClick(user._id)}
                            >
                              <FiMessageSquare className="me-1" />
                              Message
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="rounded-pill"
                              onClick={() => confirmBlock(user)}
                            >
                              <FiUserX className="me-1" />
                              Block
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : searchTerm ? (
                <div className="text-center py-5">
                  <h5>No connections found</h5>
                  <p className="text-muted">Try a different search term.</p>
                </div>
              ) : (
                <div className="text-center py-5">
                  <FiUsers size={48} className="text-muted mb-3" />
                  <h5>No connections yet</h5>
                  <p className="text-muted">
                    Start building your network by connecting with others.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "pending" && (
            <>
              <h5 className="mb-3">
                <FiUserPlus className="me-2" />
                Pending Connection Requests
              </h5>

              {pendingRequests.length > 0 ? (
                <div className="row">
                  {pendingRequests.map((user) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="col-md-6 col-lg-4 mb-4"
                    >
                      <Card className="h-100 shadow-sm">
                        <Card.Body className="text-center">
                          <img
                            src={
                              user.profilePicture ||
                              `https://ui-avatars.com/api/?name=${user.name}&size=150`
                            }
                            alt="Profile"
                            className="rounded-circle mb-3 profile-image-my"
                            width="100"
                            height="100"
                          />
                          <Card.Title>{user.name}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {user.jobTitle}{" "}
                            {user.company && `at ${user.company}`}
                          </Card.Subtitle>
                          <div className="d-flex justify-content-center gap-2 mt-3">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="rounded-pill"
                              disabled
                            >
                              <FiUserPlus className="me-1" />
                              Pending
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <FiUserPlus size={48} className="text-muted mb-3" />
                  <h5>No pending requests</h5>
                  <p className="text-muted">
                    Your sent connection requests will appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "blocked" && (
            <>
              <h5 className="mb-3">
                <FiUserX className="me-2" />
                Blocked Users
              </h5>

              {blockedUsers.length > 0 ? (
                <div className="row">
                  {blockedUsers.map((user) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="col-md-6 col-lg-4 mb-4"
                    >
                      <Card className="h-100 shadow-sm">
                        <Card.Body className="text-center">
                          <img
                            src={
                              user.profilePicture ||
                              `https://ui-avatars.com/api/?name=${user.name}&size=150`
                            }
                            alt="Profile"
                            className="rounded-circle mb-3 profile-image-my"
                            width="100"
                            height="100"
                          />
                          <Card.Title>{user.name}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            {user.jobTitle}{" "}
                            {user.company && `at ${user.company}`}
                          </Card.Subtitle>
                          <div className="d-flex justify-content-center gap-2 mt-3">
                            <Button
                              variant="success"
                              size="sm"
                              className="rounded-pill"
                              onClick={() => handleUnblock(user._id)}
                            >
                              <FiUserCheck className="me-1" />
                              Unblock
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <FiUserX size={48} className="text-muted mb-3" />
                  <h5>No blocked users</h5>
                  <p className="text-muted">
                    Users you block will appear here.
                  </p>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Block User Modal */}
      <Modal
        show={showBlockModal}
        onHide={() => setShowBlockModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Block User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to block {userToBlock?.name}? You won't see
          their profile or receive messages from them.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBlockModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleBlock}>
            Block User
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default MyNetwork;
