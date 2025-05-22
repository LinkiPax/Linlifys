import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Tab,
  Tabs,
  ListGroup,
  Badge,
  Spinner,
  Modal,
  Alert,
  Dropdown,
  Card,
  Form,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import {
  IoMdNotificationsOutline,
  IoMdCheckmarkCircleOutline,
  IoMdTrash,
  IoMdRefresh,
  IoMdSettings,
  IoMdTime,
  IoMdCheckmark,
  IoMdClose,
} from "react-icons/io";
import { BsThreeDotsVertical, BsFilter } from "react-icons/bs";
import io from "socket.io-client";
import axios from "axios";
import "./NotificationPage.css";

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    pushNotifications: true,
    soundEnabled: false,
  });
  const [filterDate, setFilterDate] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch Notifications with filters
  const fetchNotifications = useCallback(
    async (filter = "all", dateFilter = "all", search = "") => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:5000/notification/filter`,
          {
            params: {
              status: filter,
              date: dateFilter,
              search,
            },
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            withCredentials: true,
          }
        );
        setNotifications(response.data.notifications || []);
      } catch (err) {
        setError("Failed to fetch notifications. Please try again.");
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Mark Notification as Read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://localhost:5000/notification/mark-as-read/${notificationId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          withCredentials: true,
        }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, status: "read" } : n
        )
      );
    } catch (err) {
      setError("Failed to mark notification as read.");
      console.error("Error marking notification as read:", err);
    }
  };

  // Mark All Notifications as Read
  const markAllAsRead = async () => {
    try {
      await axios.patch(
        "http://localhost:5000/notification/mark-all-as-read",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
    } catch (err) {
      setError("Failed to mark all notifications as read.");
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Clear All Notifications
  const clearAllNotifications = async () => {
    try {
      await axios.delete("http://localhost:5000/notification/clear-all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      setNotifications([]);
      setShowClearModal(false);
    } catch (err) {
      setError("Failed to clear notifications.");
      console.error("Error clearing notifications:", err);
    }
  };

  // Delete single notification
  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `http://localhost:5000/notification/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      setError("Failed to delete notification.");
      console.error("Error deleting notification:", err);
    }
  };

  // Handle real-time notifications
  useEffect(() => {
    const socketConnection = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    setSocket(socketConnection);

    socketConnection.on("new_notification", (newNotification) => {
      setNotifications((prev) => [
        {
          ...newNotification,
          isNew: true,
        },
        ...prev,
      ]);

      // Remove the new indicator after 3 seconds
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === newNotification._id ? { ...n, isNew: false } : n
          )
        );
      }, 3000);
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Fetch notifications when filters change
  useEffect(() => {
    fetchNotifications(activeTab, filterDate, searchQuery);
  }, [activeTab, filterDate, searchQuery, fetchNotifications]);

  // Count unread notifications
  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.status === activeTab;
  });

  return (
    <Container fluid className="notification-container px-lg-4 py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <IoMdNotificationsOutline
                size={28}
                className="text-primary me-2"
              />
              <h2 className="mb-0">Notifications</h2>
              <Badge bg="danger" className="ms-3">
                {unreadCount} Unread
              </Badge>
            </div>

            <div className="d-flex">
              <Button
                variant="outline-secondary"
                onClick={() =>
                  fetchNotifications(activeTab, filterDate, searchQuery)
                }
                className="me-2"
              >
                <IoMdRefresh size={18} />
              </Button>

              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-primary"
                  id="dropdown-settings"
                >
                  <IoMdSettings size={18} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setShowSettings(true)}>
                    Notification Settings
                  </Dropdown.Item>
                  <Dropdown.Item onClick={markAllAsRead}>
                    Mark All as Read
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowClearModal(true)}>
                    Clear All Notifications
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Col>
      </Row>

      {/* Error Message */}
      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Filters and Search */}
      <Row className="mb-4">
        <Col md={8}>
          <div className="d-flex align-items-center">
            <Form.Control
              type="search"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="me-3"
            />

            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                id="dropdown-date-filter"
              >
                <BsFilter size={16} className="me-1" />
                {filterDate === "all"
                  ? "All Time"
                  : filterDate === "today"
                  ? "Today"
                  : filterDate === "week"
                  ? "This Week"
                  : "This Month"}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFilterDate("all")}>
                  All Time
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterDate("today")}>
                  Today
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterDate("week")}>
                  This Week
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFilterDate("month")}>
                  This Month
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Col>
      </Row>

      {/* Notification Tabs */}
      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(key) => setActiveTab(key)}
            className="custom-tabs mb-4"
          >
            <Tab
              eventKey="all"
              title={
                <span>
                  All{" "}
                  <Badge bg="secondary" className="ms-1">
                    {notifications.length}
                  </Badge>
                </span>
              }
            >
              <NotificationList
                notifications={filteredNotifications}
                markAsRead={markAsRead}
                deleteNotification={deleteNotification}
                loading={loading}
              />
            </Tab>
            <Tab
              eventKey="unread"
              title={
                <span>
                  Unread{" "}
                  <Badge bg="danger" className="ms-1">
                    {unreadCount}
                  </Badge>
                </span>
              }
            >
              <NotificationList
                notifications={filteredNotifications}
                markAsRead={markAsRead}
                deleteNotification={deleteNotification}
                loading={loading}
              />
            </Tab>
            <Tab
              eventKey="read"
              title={
                <span>
                  Read{" "}
                  <Badge bg="success" className="ms-1">
                    {notifications.length - unreadCount}
                  </Badge>
                </span>
              }
            >
              <NotificationList
                notifications={filteredNotifications}
                markAsRead={markAsRead}
                deleteNotification={deleteNotification}
                loading={loading}
              />
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Clear All Modal */}
      <Modal
        show={showClearModal}
        onHide={() => setShowClearModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Clear All Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to permanently delete all notifications? This
          action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClearModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={clearAllNotifications}>
            Clear All
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Settings Modal */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Notification Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="email-alerts"
                label="Email notifications"
                checked={notificationSettings.emailAlerts}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    emailAlerts: e.target.checked,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="push-notifications"
                label="Push notifications"
                checked={notificationSettings.pushNotifications}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    pushNotifications: e.target.checked,
                  })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="sound-enabled"
                label="Notification sound"
                checked={notificationSettings.soundEnabled}
                onChange={(e) =>
                  setNotificationSettings({
                    ...notificationSettings,
                    soundEnabled: e.target.checked,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSettings(false)}>
            Save Settings
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Notification List Component
const NotificationList = ({
  notifications,
  markAsRead,
  deleteNotification,
  loading,
}) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-5">
        <img
          src="/images/no-notifications.svg"
          alt="No notifications"
          className="empty-state-img mb-3"
          style={{ width: "150px", opacity: 0.7 }}
        />
        <h5 className="text-muted">No notifications found</h5>
        <p className="text-muted">
          When you get notifications, they'll appear here
        </p>
      </div>
    );
  }

  return (
    <div className="notification-list">
      {notifications.map((notification) => (
        <Card
          key={notification._id}
          className={`mb-3 notification-card ${
            notification.status === "unread" ? "unread" : ""
          } ${notification.isNew ? "new-notification" : ""}`}
        >
          <Card.Body>
            <Row className="align-items-center">
              <Col xs={9} md={10}>
                <div className="d-flex align-items-start">
                  <div
                    className={`notification-icon ${
                      notification.type || "default"
                    }`}
                  >
                    {notification.type === "message" && (
                      <IoMdCommentDots size={20} />
                    )}
                    {notification.type === "alert" && (
                      <IoMdNotificationsOutline size={20} />
                    )}
                    {notification.type === "success" && (
                      <IoMdCheckmarkCircleOutline size={20} />
                    )}
                    {!notification.type && (
                      <IoMdNotificationsOutline size={20} />
                    )}
                  </div>
                  <div className="ms-3">
                    <h6 className="mb-1">
                      {notification.title || "Notification"}
                    </h6>
                    <p className="mb-1">{notification.message}</p>
                    <small className="text-muted">
                      <IoMdTime className="me-1" />
                      {new Date(notification.date).toLocaleString()}
                    </small>
                  </div>
                </div>
              </Col>
              <Col xs={3} md={2} className="text-end">
                <div className="d-flex justify-content-end">
                  {notification.status === "unread" && (
                    <OverlayTrigger
                      placement="top"
                      overlay={<Tooltip>Mark as read</Tooltip>}
                    >
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="me-2"
                        onClick={() => markAsRead(notification._id)}
                      >
                        <IoMdCheckmark size={16} />
                      </Button>
                    </OverlayTrigger>
                  )}
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Delete</Tooltip>}
                  >
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => deleteNotification(notification._id)}
                    >
                      <IoMdClose size={16} />
                    </Button>
                  </OverlayTrigger>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default NotificationPage;
