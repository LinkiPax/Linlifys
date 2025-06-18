import React, { useState, useEffect, useRef, useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faNetworkWired,
  faBriefcase,
  faCommentDots,
  faBell,
  faUser,
  faMoon,
  faSun,
  faFilm,
  faSearch,
  faTimes,
  faPlus,
  faTv,
} from "@fortawesome/free-solid-svg-icons";
import {
  Navbar,
  Nav,
  Form,
  Button,
  NavDropdown,
  Spinner,
  Container,
  InputGroup,
  Dropdown,
  Badge,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";
import Cookies from "js-cookie";
import { useNotificationContext } from "../../context/NotificationContext";

const NavbarComponent = () => {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const userId = localStorage.getItem("userId");
  // Notification context
  const {
    notifications = [],
    unreadCount = 0,
    loading: loadingNotifications,
    error: notificationError,
    markAsRead,
    fetchNotifications,
    isSupported: pushSupported,
    permission: pushPermission,
    isSubscribed,
    requestPermission: requestPushPermission,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribeFromPush,
  } = useNotificationContext();

  // Navigation items data
  const navItems = [
    { name: "Home", icon: faHouse, path: `/home/${userId}` },
    { name: "Network", icon: faNetworkWired, path: "/network" },
    { name: "Jobs", icon: faBriefcase, path: "/jobs" },
    { name: "Messages", icon: faCommentDots, path: "/messages" },
    { name: "Notifications", icon: faBell, path: "/notifications" },
    { name: "Shorts", icon: faFilm, path: "/shorts" },
    { name: "Meeting", icon: faTv, path: "/meeting" },
  ];

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("auth_token");
        if (!token) {
          navigate("/");
          return;
        }

        localStorage.setItem("auth_token", token);
        const userId = localStorage.getItem("userId");

        // Fetch user data
        const userResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/me/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(userResponse.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response?.status === 401) navigate("/");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Triple-click detection for easter egg
  useEffect(() => {
    const timer = setTimeout(() => setClickCount(0), 500);
    if (clickCount === 3) navigate("/resume");
    return () => clearTimeout(timer);
  }, [clickCount, navigate]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.body.classList.toggle("dark-mode", newMode);
    localStorage.setItem("darkMode", newMode);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.trim() && isSearchFocused) {
      const debounceTimer = setTimeout(async () => {
        try {
          const response = await axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/search/suggestions?q=${searchQuery}`
          );
          setSearchSuggestions(response.data);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchQuery, isSearchFocused]);

  // Notification dropdown item click handler
  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
    setExpanded(false);
  };

  return (
    <Navbar
      expand="lg"
      className={`professional-navbar ${darkMode ? "dark-mode" : ""} `}
      variant={darkMode ? "dark" : "light"}
      sticky="top"
      expanded={expanded}
    >
      <Container fluid>
        {/* Logo/Brand */}
        <Navbar.Brand
          as={Link}
          to="/home"
          className="navbar-brand"
          onClick={() => setClickCount((prev) => prev + 1)}
        >
          <div className="logo-container">
            <span className="logo-text">Linkipax</span>
            <span className="logo-beta">PRO</span>
          </div>
        </Navbar.Brand>

        {/* Mobile Toggle */}
        <Navbar.Toggle
          aria-controls="main-navbar"
          onClick={() => setExpanded(!expanded)}
          className="navbar-toggler"
        >
          <div className={`hamburger ${expanded ? "open" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </Navbar.Toggle>

        <Navbar.Collapse id="main-navbar">
          {/* Search Bar - Center */}
          <div className="search-container" ref={searchRef}>
            <Form onSubmit={handleSearch} className="search-form">
              <InputGroup className="search-input-group">
                <InputGroup.Text className="search-icon">
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  type="search"
                  placeholder="Search people, jobs, posts..."
                  className="search-field"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() =>
                    setTimeout(() => setIsSearchFocused(false), 200)
                  }
                />
                {searchQuery && (
                  <Button
                    variant="link"
                    className="clear-search"
                    onClick={() => setSearchQuery("")}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </Button>
                )}
                <Button
                  variant="primary"
                  className="search-button"
                  type="submit"
                  disabled={!searchQuery.trim()}
                >
                  Search
                </Button>
              </InputGroup>
            </Form>

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className={`search-suggestions ${darkMode ? "dark" : ""}`}>
                {searchSuggestions.map((item, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => {
                      navigate(item.path);
                      setShowSuggestions(false);
                    }}
                  >
                    <FontAwesomeIcon icon={item.icon} className="me-2" />
                    {item.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main Navigation */}
          <Nav className="main-navigation">
            {navItems.map((item, index) => (
              <Nav.Item key={index} className="nav-item-wrapper">
                {item.name === "Notifications" ? (
                  <Dropdown className="notification-dropdown">
                    <Dropdown.Toggle
                      as={Nav.Link}
                      className="nav-link"
                      id="notification-dropdown"
                    >
                      <div className="nav-icon-container">
                        <FontAwesomeIcon icon={item.icon} />
                        {unreadCount > 0 && (
                          <Badge
                            pill
                            bg="danger"
                            className="notification-badge"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                      <span className="nav-label">{item.name}</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="notification-menu">
                      <Dropdown.Header>
                        Notifications{" "}
                        {unreadCount > 0 && `(${unreadCount} new)`}
                      </Dropdown.Header>

                      {loadingNotifications ? (
                        <Dropdown.Item className="text-center">
                          <Spinner animation="border" size="sm" />
                        </Dropdown.Item>
                      ) : notificationError ? (
                        <Dropdown.Item className="text-danger">
                          <small>Error loading notifications</small>
                        </Dropdown.Item>
                      ) : notifications.length === 0 ? (
                        <Dropdown.Item className="text-muted">
                          No notifications
                        </Dropdown.Item>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <Dropdown.Item
                            key={notification._id}
                            as={Link}
                            to={notification.actionUrl || "/notifications"}
                            className={`notification-item ${
                              notification.status === "unread" ? "unread" : ""
                            }`}
                            onClick={() =>
                              handleNotificationClick(notification._id)
                            }
                          >
                            <div className="notification-content">
                              <div className="notification-icon">
                                <FontAwesomeIcon
                                  icon={
                                    notification.type === "message"
                                      ? faCommentDots
                                      : notification.type === "alert"
                                      ? faBell
                                      : faBell
                                  }
                                />
                              </div>
                              <div>
                                <div className="notification-title">
                                  {notification.title}
                                </div>
                                <div className="notification-message">
                                  {notification.message}
                                </div>
                                <div className="notification-time">
                                  {new Date(
                                    notification.createdAt
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </div>
                          </Dropdown.Item>
                        ))
                      )}

                      <Dropdown.Divider />
                      <Dropdown.Item
                        as={Link}
                        to="/notifications"
                        className="text-center view-all"
                      >
                        View all notifications
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                ) : (
                  <Nav.Link
                    as={Link}
                    to={item.path}
                    className="nav-link"
                    onClick={() => setExpanded(false)}
                  >
                    <div className="nav-icon-container">
                      <FontAwesomeIcon icon={item.icon} />
                    </div>
                    <span className="nav-label">{item.name}</span>
                  </Nav.Link>
                )}
              </Nav.Item>
            ))}
          </Nav>

          {/* User Controls */}
          <div className="user-controls">
            {/* Dark Mode Toggle */}
            <Button
              variant="link"
              className="dark-mode-toggle"
              onClick={toggleDarkMode}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            </Button>

            {/* Create Post Button */}
            <Dropdown className="create-post-dropdown">
              <Dropdown.Toggle variant="primary" className="create-post-button">
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                <span>Create</span>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Item as={Link} to="/create/post">
                  Post
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/uploadshorts">
                  Short
                </Dropdown.Item>
                <Dropdown.Item as={Link} to="/create/event">
                  Event
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* User Dropdown */}
            {loadingUser ? (
              <Spinner animation="border" size="sm" className="user-spinner" />
            ) : user ? (
              <Dropdown className="user-dropdown" align="end">
                <Dropdown.Toggle
                  as={Button}
                  variant="link"
                  className="user-toggle"
                >
                  <div className="user-avatar">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.name}
                        className="avatar-image"
                      />
                    ) : (
                      <div className="avatar-initials">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                    )}
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>
                    <div className="dropdown-user-info">
                      <h6>{user.name}</h6>
                      <small>{user.jobTitle || "Member"}</small>
                    </div>
                  </Dropdown.Header>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to={`/profile/${user._id}`}>
                    View Profile
                  </Dropdown.Item>

                  {/* Push Notification Settings */}
                  {pushSupported && (
                    <>
                      <Dropdown.Item
                        onClick={() => {
                          if (pushPermission === "granted") {
                            isSubscribed
                              ? unsubscribeFromPush()
                              : subscribeToPush();
                          } else {
                            requestPushPermission();
                          }
                        }}
                      >
                        {pushPermission === "granted"
                          ? isSubscribed
                            ? "Disable Push Notifications"
                            : "Enable Push Notifications"
                          : "Allow Push Notifications"}
                      </Dropdown.Item>
                      <Dropdown.Divider />
                    </>
                  )}

                  <Dropdown.Item as={Link} to="/settings">
                    Settings & Privacy
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/help">
                    Help Center
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item
                    onClick={() => {
                      localStorage.removeItem("auth_token");
                      Cookies.remove("auth_token");
                      navigate("/");
                    }}
                  >
                    Sign Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline-primary"
                  className="auth-button"
                >
                  Sign In
                </Button>
                <Button
                  as={Link}
                  to="/signup"
                  variant="primary"
                  className="auth-button"
                >
                  Join Now
                </Button>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
