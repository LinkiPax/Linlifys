import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Tab,
  Tabs,
  Badge,
  Spinner,
  Modal,
  Alert,
  Dropdown,
  Card,
  Form,
  OverlayTrigger,
  Tooltip,
  Pagination,
} from "react-bootstrap";
import {
  IoMdNotificationsOutline,
  IoMdCheckmarkCircleOutline,
  IoMdRefresh,
  IoMdSettings,
  IoMdTime,
  IoMdCheckmark,
  IoMdClose,
  IoMdArrowDropleft,
  IoMdArrowDropright,
} from "react-icons/io";
import { BsFilter } from "react-icons/bs";
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);

  // Check for push notification support
  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setPushSupported(true);
      checkPushPermission();
      checkSubscription();
    }
  }, []);

  const checkPushPermission = () => {
    navigator.permissions
      .query({ name: "notifications" })
      .then((permissionStatus) => {
        setPushPermission(permissionStatus.state);
        permissionStatus.onchange = () => {
          setPushPermission(permissionStatus.state);
        };
      });
  };

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
      setSubscription(sub);
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/sw-notifications.js"
      );
      console.log("Service Worker registered:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      throw error;
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPush = async () => {
    try {
      const registration = await registerServiceWorker();
      const existingSubscription =
        await registration.pushManager.getSubscription();

      if (existingSubscription) {
        console.log("Already subscribed:", existingSubscription);
        return existingSubscription;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/notifications/vapid-public-key`
      );
      const vapidPublicKey = response.data.publicKey;
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/subscribe`,
        {
          subscription: newSubscription,
          userId: localStorage.getItem("userId"),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      setSubscription(newSubscription);
      setIsSubscribed(true);
      return newSubscription;
    } catch (error) {
      console.error("Failed to subscribe:", error);
      throw error;
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      if (!subscription) return;

      await subscription.unsubscribe();

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/unsubscribe`,
        {
          subscription,
          userId: localStorage.getItem("userId"),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );

      setSubscription(null);
      setIsSubscribed(false);
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
      throw error;
    }
  };

  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        await subscribeToPush();
      }
      return permission;
    } catch (error) {
      console.error("Permission request failed:", error);
      throw error;
    }
  };

  const fetchNotifications = useCallback(
    async (filter = "all", dateFilter = "all", search = "", page = 1) => {
      setLoading(true);
      setError(null);

      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          throw new Error("User ID not found");
        }

        const params = {
          userId,
          status: filter === "all" ? undefined : filter,
          search,
          page,
          limit: pagination.limit,
          sort: "newest",
        };

        if (dateFilter !== "all") {
          const now = new Date();
          let startDate = new Date();

          if (dateFilter === "today") {
            startDate.setHours(0, 0, 0, 0);
          } else if (dateFilter === "week") {
            startDate.setDate(startDate.getDate() - 7);
          } else if (dateFilter === "month") {
            startDate.setMonth(startDate.getMonth() - 1);
          }

          params.createdAt = JSON.stringify({
            $gte: startDate.toISOString(),
            $lte: now.toISOString(),
          });
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/notifications`,
          {
            params,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        );

        setNotifications(response.data.notifications || []);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages,
        });
      } catch (err) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to fetch notifications. Please try again."
        );
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  const markAsRead = async (notificationId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      await axios.patch(
        `${
          import.meta.env.VITE_API_URL
        }/api/notifications/${notificationId}/read`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, status: "read" } : n
        )
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to mark notification as read."
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/read-all`,
        { userId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, status: "read" })));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to mark all notifications as read."
      );
    }
  };

  const clearAllNotifications = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        data: { userId },
      });
      setNotifications([]);
      setPagination((prev) => ({ ...prev, total: 0, pages: 1, page: 1 }));
      setShowClearModal(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to clear notifications."
      );
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("User ID not found");
      }

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
          data: { userId },
        }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
        pages: Math.ceil((prev.total - 1) / prev.limit),
      }));
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to delete notification."
      );
    }
  };

  useEffect(() => {
    const socketConnection = io(
      import.meta.env.VITE_API_URL || "${import.meta.env.VITE_API_URL}",
      {
        withCredentials: true,
        transports: ["websocket"],
      }
    );

    setSocket(socketConnection);

    socketConnection.on("new_notification", (newNotification) => {
      setNotifications((prev) => [
        {
          ...newNotification,
          isNew: true,
        },
        ...prev,
      ]);
      setPagination((prev) => ({
        ...prev,
        total: prev.total + 1,
        pages: Math.ceil((prev.total + 1) / prev.limit),
      }));

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

  useEffect(() => {
    fetchNotifications(activeTab, filterDate, searchQuery, pagination.page);
  }, [activeTab, filterDate, searchQuery, pagination.page, fetchNotifications]);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "all") return true;
    return n.status === activeTab;
  });

  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const renderSettingsModal = () => (
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

          {pushSupported && (
            <Form.Group className="mb-3">
              <Form.Label>Push Notifications</Form.Label>
              <div className="d-flex align-items-center">
                {pushPermission === "granted" ? (
                  <Button
                    variant={isSubscribed ? "danger" : "success"}
                    size="sm"
                    onClick={
                      isSubscribed ? unsubscribeFromPush : subscribeToPush
                    }
                    disabled={loading}
                  >
                    {isSubscribed ? "Disable Push" : "Enable Push"}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={requestPushPermission}
                    disabled={loading || pushPermission === "denied"}
                  >
                    {pushPermission === "denied"
                      ? "Permission Denied"
                      : "Allow Push Notifications"}
                  </Button>
                )}
                <span className="ms-2 text-muted small">
                  {pushPermission === "granted"
                    ? isSubscribed
                      ? "Active"
                      : "Inactive"
                    : pushPermission === "denied"
                    ? "Blocked in browser"
                    : "Not configured"}
                </span>
              </div>
            </Form.Group>
          )}

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
  );

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
                  fetchNotifications(
                    activeTab,
                    filterDate,
                    searchQuery,
                    pagination.page
                  )
                }
                className="me-2"
                disabled={loading}
              >
                <IoMdRefresh size={18} />
              </Button>

              <Dropdown>
                <Dropdown.Toggle
                  variant="outline-primary"
                  id="dropdown-settings"
                  disabled={loading}
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

      {error && (
        <Row className="mb-3">
          <Col>
            <Alert variant="danger" onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col md={8}>
          <div className="d-flex align-items-center">
            <Form.Control
              type="search"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="me-3"
              disabled={loading}
            />

            <Dropdown>
              <Dropdown.Toggle
                variant="outline-secondary"
                id="dropdown-date-filter"
                disabled={loading}
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
                    {pagination.total}
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
                    {pagination.total - unreadCount}
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

          {pagination.pages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                >
                  <IoMdArrowDropleft />
                </Pagination.Prev>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                  (number) => (
                    <Pagination.Item
                      key={number}
                      active={number === pagination.page}
                      onClick={() => handlePageChange(number)}
                      disabled={loading}
                    >
                      {number}
                    </Pagination.Item>
                  )
                )}
                <Pagination.Next
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages || loading}
                >
                  <IoMdArrowDropright />
                </Pagination.Next>
              </Pagination>
            </div>
          )}
        </Col>
      </Row>

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

      {renderSettingsModal()}
    </Container>
  );
};

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
                      <IoMdNotificationsOutline size={20} />
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
                      {new Date(notification.createdAt).toLocaleString()}
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
                        disabled={loading}
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
                      disabled={loading}
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
