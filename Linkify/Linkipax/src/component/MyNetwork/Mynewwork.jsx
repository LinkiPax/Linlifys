import React, { useEffect, useState } from "react";
import { Button, Card, Spinner, Badge, Modal, Form, InputGroup } from "react-bootstrap";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUserPlus,
  FiUserCheck,
  FiUserX,
  FiMessageSquare,
  FiUsers,
  FiBell,
  FiSearch,
  FiX,
  FiFilter
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
  const [stats, setStats] = useState({
    connections: 0,
    requests: 0,
    pending: 0,
    blocked: 0
  });

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
        
        // Update stats
        setStats({
          connections: response.data.connections?.length || 0,
          requests: response.data.requests?.length || 0,
          pending: response.data.pending?.length || 0,
          blocked: response.data.blocked?.length || 0
        });
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
      
      // Update stats
      setStats(prev => ({
        ...prev,
        connections: prev.connections + 1,
        requests: prev.requests - 1
      }));
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
      
      // Update stats
      setStats(prev => ({
        ...prev,
        requests: prev.requests - 1
      }));
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
      
      // Update stats
      setStats(prev => ({
        ...prev,
        connections: prev.connections - 1,
        blocked: prev.blocked + 1
      }));

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
      
      // Update stats
      setStats(prev => ({
        ...prev,
        blocked: prev.blocked - 1
      }));
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
          <h5 className="text-muted">Building your network...</h5>
        </div>
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
      <div className="network-header">
        <div className="d-flex align-items-center mb-4">
          <div className="network-icon-wrapper me-3">
            <FiUsers className="network-main-icon" />
          </div>
          <div>
            <h1 className="mb-0">My Network</h1>
            <p className="text-muted mb-0">Manage your professional connections</p>
          </div>
        </div>

        <div className="stats-grid mb-4">
          <div className="stat-card" onClick={() => setActiveTab("requests")}>
            <div className="stat-icon requests">
              <FiBell />
            </div>
            <div className="stat-content">
              <h3>{stats.requests}</h3>
              <p>Requests</p>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => setActiveTab("connections")}>
            <div className="stat-icon connections">
              <FiUserCheck />
            </div>
            <div className="stat-content">
              <h3>{stats.connections}</h3>
              <p>Connections</p>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => setActiveTab("pending")}>
            <div className="stat-icon pending">
              <FiUserPlus />
            </div>
            <div className="stat-content">
              <h3>{stats.pending}</h3>
              <p>Pending</p>
            </div>
          </div>
          
          <div className="stat-card" onClick={() => setActiveTab("blocked")}>
            <div className="stat-icon blocked">
              <FiUserX />
            </div>
            <div className="stat-content">
              <h3>{stats.blocked}</h3>
              <p>Blocked</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="network-content-card">
        <Card.Header className="network-tab-header">
          <div className="network-tabs">
            <button 
              className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              <FiBell className="me-2" />
              Requests
              {stats.requests > 0 && <span className="notification-badge">{stats.requests}</span>}
            </button>
            
            <button 
              className={`tab-btn ${activeTab === "connections" ? "active" : ""}`}
              onClick={() => setActiveTab("connections")}
            >
              <FiUserCheck className="me-2" />
              Connections
            </button>
            
            <button 
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <FiUserPlus className="me-2" />
              Pending
            </button>
            
            <button 
              className={`tab-btn ${activeTab === "blocked" ? "active" : ""}`}
              onClick={() => setActiveTab("blocked")}
            >
              <FiUserX className="me-2" />
              Blocked
            </button>
          </div>
          
          {activeTab === "connections" && (
            <div className="search-container">
              <InputGroup className="search-input-group">
                <InputGroup.Text className="search-icon">
                  <FiSearch />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search connections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-field"
                />
                {searchTerm && (
                  <Button variant="link" className="clear-search" onClick={clearSearch}>
                    <FiX />
                  </Button>
                )}
              </InputGroup>
            </div>
          )}
        </Card.Header>

        <Card.Body className="network-tab-content">
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

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "requests" && (
                <>
                  <h4 className="tab-title">
                    <FiBell className="me-2" />
                    Connection Requests
                  </h4>

                  {connectionRequests.length > 0 ? (
                    <div className="users-grid">
                      {connectionRequests.map((user) => (
                        <UserCard 
                          key={user._id} 
                          user={user} 
                          type="request"
                          onAccept={() => handleAccept(user._id)}
                          onDecline={() => handleDecline(user._id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<FiBell size={48} />}
                      title="No connection requests"
                      description="When you receive connection requests, they'll appear here."
                    />
                  )}
                </>
              )}

              {activeTab === "connections" && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="tab-title">
                      <FiUserCheck className="me-2" />
                      Your Connections
                    </h4>
                    <Badge bg="light" text="dark" className="connections-count">
                      {filteredConnections.length} {filteredConnections.length === 1 ? 'connection' : 'connections'}
                    </Badge>
                  </div>

                  {filteredConnections.length > 0 ? (
                    <div className="users-grid">
                      {filteredConnections.map((user) => (
                        <UserCard 
                          key={user._id} 
                          user={user} 
                          type="connection"
                          onMessage={() => handleMessageClick(user._id)}
                          onBlock={() => confirmBlock(user)}
                        />
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <EmptyState
                      icon={<FiSearch size={48} />}
                      title="No connections found"
                      description="Try a different search term."
                    />
                  ) : (
                    <EmptyState
                      icon={<FiUsers size={48} />}
                      title="No connections yet"
                      description="Start building your network by connecting with others."
                    />
                  )}
                </>
              )}

              {activeTab === "pending" && (
                <>
                  <h4 className="tab-title">
                    <FiUserPlus className="me-2" />
                    Pending Connection Requests
                  </h4>

                  {pendingRequests.length > 0 ? (
                    <div className="users-grid">
                      {pendingRequests.map((user) => (
                        <UserCard 
                          key={user._id} 
                          user={user} 
                          type="pending"
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<FiUserPlus size={48} />}
                      title="No pending requests"
                      description="Your sent connection requests will appear here."
                    />
                  )}
                </>
              )}

              {activeTab === "blocked" && (
                <>
                  <h4 className="tab-title">
                    <FiUserX className="me-2" />
                    Blocked Users
                  </h4>

                  {blockedUsers.length > 0 ? (
                    <div className="users-grid">
                      {blockedUsers.map((user) => (
                        <UserCard 
                          key={user._id} 
                          user={user} 
                          type="blocked"
                          onUnblock={() => handleUnblock(user._id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<FiUserX size={48} />}
                      title="No blocked users"
                      description="Users you block will appear here."
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </Card.Body>
      </Card>

      {/* Block User Modal */}
      <Modal
        show={showBlockModal}
        onHide={() => setShowBlockModal(false)}
        centered
        className="network-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <FiUserX className="me-2 text-danger" />
            Block User
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-3">
            <img
              src={
                userToBlock?.profilePicture ||
                `https://ui-avatars.com/api/?name=${userToBlock?.name}&size=64`
              }
              alt="Profile"
              className="rounded-circle mb-2"
              width="64"
              height="64"
            />
            <h5>{userToBlock?.name}</h5>
            <p className="text-muted mb-0">
              {userToBlock?.jobTitle} {userToBlock?.company && `at ${userToBlock.company}`}
            </p>
          </div>
          <p className="text-center">
            Are you sure you want to block {userToBlock?.name}? You won't see
            their profile or receive messages from them.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowBlockModal(false)}>
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

// User Card Component
const UserCard = ({ user, type, onAccept, onDecline, onMessage, onBlock, onUnblock }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="user-card"
    >
      <Card className="h-100">
        <Card.Body className="text-center">
          <div className="user-image-container">
            <img
              src={
                user.profilePicture ||
                `https://ui-avatars.com/api/?name=${user.name}&size=120&background=random`
              }
              alt="Profile"
              className="user-image"
            />
            {type === "request" && (
              <Badge bg="success" className="status-badge">
                New
              </Badge>
            )}
          </div>
          
          <Card.Title className="user-name">{user.name}</Card.Title>
          
          <Card.Subtitle className="user-details">
            {user.jobTitle && <div>{user.jobTitle}</div>}
            {user.company && <div className="text-muted">{user.company}</div>}
          </Card.Subtitle>
          
          <div className="user-actions">
            {type === "request" && (
              <>
                <Button
                  variant="success"
                  size="sm"
                  className="action-btn accept"
                  onClick={onAccept}
                >
                  <FiUserCheck className="me-1" />
                  Accept
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="action-btn"
                  onClick={onDecline}
                >
                  <FiUserX className="me-1" />
                  Decline
                </Button>
              </>
            )}
            
            {type === "connection" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  className="action-btn"
                  onClick={onMessage}
                >
                  <FiMessageSquare className="me-1" />
                  Message
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="action-btn"
                  onClick={onBlock}
                >
                  <FiUserX className="me-1" />
                  Block
                </Button>
              </>
            )}
            
            {type === "pending" && (
              <Button
                variant="outline-secondary"
                size="sm"
                className="action-btn"
                disabled
              >
                <FiUserPlus className="me-1" />
                Pending
              </Button>
            )}
            
            {type === "blocked" && (
              <Button
                variant="success"
                size="sm"
                className="action-btn"
                onClick={onUnblock}
              >
                <FiUserCheck className="me-1" />
                Unblock
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
};

// Empty State Component
const EmptyState = ({ icon, title, description }) => {
  return (
    <div className="empty-state text-center py-5">
      <div className="empty-icon mb-3">
        {icon}
      </div>
      <h5>{title}</h5>
      <p className="text-muted">{description}</p>
    </div>
  );
};

export default MyNetwork;