import React, { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
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

  // Navigation items data with motion variants
  const navItems = [
    { name: "Home", icon: faHouse, path: `/home/${userId}` },
    { name: "Network", icon: faNetworkWired, path: "/network" },
    { name: "Jobs", icon: faBriefcase, path: "/jobs" },
    { name: "Messages", icon: faCommentDots, path: "/messages" },
    { name: "Notifications", icon: faBell, path: "/notifications" },
    { name: "Shorts", icon: faFilm, path: "/shorts" },
    { name: "Meeting", icon: faTv, path: "/meeting" },
  ];

  // Animation variants
  const navItemVariants = {
    initial: { y: 0, opacity: 1 },
    hover: { y: -8, transition: { type: "spring", stiffness: 400, damping: 10 } },
    tap: { scale: 0.95 }
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
  };

  const searchVariants = {
    focused: { scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
    blurred: { scale: 1, boxShadow: "none" }
  };

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
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setTimeout(() => {
            if (!Cookies.get("auth_token")) navigate("/");
          }, 1500);
        }
        
        const userId = localStorage.getItem("userId");
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
    const fetchSuggestions = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const token = Cookies.get("auth_token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/search/suggestions`,
          {
            params: { q: searchQuery, limit: 5 },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSearchSuggestions(response.data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSearchSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Handle selecting a suggestion
  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === "user") {
      navigate(`/profile/${suggestion._id}`);
    } else if (suggestion.type === "post") {
      navigate(`/post/${suggestion._id}`);
    } else if (suggestion.type === "job") {
      navigate(`/jobs/${suggestion._id}`);
    }
    setSearchQuery("");
    setShowSuggestions(false);
  };

  // Notification dropdown item click handler
  const handleNotificationClick = (notificationId) => {
    markAsRead(notificationId);
    setExpanded(false);
  };

  return (
    <Navbar
      expand="lg"
      className={`professional-navbar ${darkMode ? "dark-mode" : ""}`}
      variant={darkMode ? "dark" : "light"}
      sticky="top"
      expanded={expanded}
    >
      <Container fluid>
        {/* Logo/Brand with motion */}
        <motion.div
          whileHover={{ y: -2, letterSpacing: "4px" }}
          transition={{ type: "spring", stiffness: 400 }}
        >
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
        </motion.div>

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
          {/* Search Bar - Center with glassmorphism */}
          <motion.div 
            className="search-container" 
            ref={searchRef}
            animate={isSearchFocused ? "focused" : "blurred"}
            variants={searchVariants}
          >
            <Form onSubmit={handleSearch} className="search-form">
              <div className="search-input-wrapper">
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
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  />
                  {searchQuery && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Button
                        variant="link"
                        className="clear-search"
                        onClick={() => setSearchQuery("")}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </Button>
                    </motion.div>
                  )}
                </InputGroup>
                <motion.div
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="primary"
                    className="search-button"
                    type="submit"
                    disabled={!searchQuery.trim()}
                  >
                    Search
                  </Button>
                </motion.div>
              </div>
            </Form>

            {/* Search Suggestions with animation */}
            <AnimatePresence>
              {showSuggestions && searchSuggestions.length > 0 && (
                <motion.div
                  className={`search-suggestions ${darkMode ? "dark" : ""}`}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dropdownVariants}
                >
                  <div className="suggestions-header">
                    <small>Search Suggestions</small>
                  </div>
                  {searchSuggestions.map((item, index) => (
                    <motion.div
                      key={index}
                      className="suggestion-item"
                      onClick={() => {
                        navigate(item.path);
                        setShowSuggestions(false);
                        setSearchQuery("");
                      }}
                      whileHover={{ x: 4 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div className="suggestion-icon">
                        <FontAwesomeIcon icon={item.icon} />
                      </div>
                      <div className="suggestion-text">
                        <div className="suggestion-name">{item.name}</div>
                        <div className="suggestion-type">{item.type}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Main Navigation with micro-interactions */}
          <Nav className="main-navigation">
            {navItems.map((item, index) => (
              <motion.div
                key={index}
                className="nav-item-wrapper"
                variants={navItemVariants}
                initial="initial"
                whileHover="hover"
                whileTap="tap"
              >
                <Nav.Item>
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
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <Badge
                                pill
                                bg="danger"
                                className="notification-badge"
                              >
                                {unreadCount}
                              </Badge>
                            </motion.div>
                          )}
                        </div>
                        <span className="nav-label">{item.name}</span>
                      </Dropdown.Toggle>
                      
                      <AnimatePresence>
                        <Dropdown.Menu className="notification-menu" as={motion.div} variants={dropdownVariants}>
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
                              <motion.div
                                key={notification._id}
                                whileHover={{ x: 4 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <Dropdown.Item
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
                              </motion.div>
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
                      </AnimatePresence>
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
              </motion.div>
            ))}
          </Nav>

          {/* User Controls */}
          <div className="user-controls">
            {/* Dark Mode Toggle */}
            <motion.div
              whileHover={{ y: -2, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Button
                variant="link"
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
              </Button>
            </motion.div>

            {/* Create Post Button */}
            <motion.div
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Dropdown className="create-post-dropdown">
                <Dropdown.Toggle variant="primary" className="create-post-button">
                  <FontAwesomeIcon icon={faPlus} className="me-1" />
                  <span>Create</span>
                </Dropdown.Toggle>
                <AnimatePresence>
                  <Dropdown.Menu align="end" as={motion.div} variants={dropdownVariants}>
                    <motion.div whileHover={{ x: 4 }}>
                      <Dropdown.Item as={Link} to="/create/post">
                        Post
                      </Dropdown.Item>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }}>
                      <Dropdown.Item as={Link} to="/uploadshorts">
                        Short
                      </Dropdown.Item>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }}>
                      <Dropdown.Item as={Link} to="/create/event">
                        Event
                      </Dropdown.Item>
                    </motion.div>
                  </Dropdown.Menu>
                </AnimatePresence>
              </Dropdown>
            </motion.div>

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
                  <motion.div
                    className="user-avatar"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
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
                  </motion.div>
                </Dropdown.Toggle>
                
                <AnimatePresence>
                  <Dropdown.Menu as={motion.div} variants={dropdownVariants}>
                    <Dropdown.Header>
                      <div className="dropdown-user-info">
                        <h6>{user.name}</h6>
                        <small>{user.jobTitle || "Member"}</small>
                      </div>
                    </Dropdown.Header>
                    <Dropdown.Divider />
                    
                    <motion.div whileHover={{ x: 4 }}>
                      <Dropdown.Item as={Link} to={`/profile/${user._id}`}>
                        View Profile
                      </Dropdown.Item>
                    </motion.div>

                    {/* Push Notification Settings */}
                    {pushSupported && (
                      <>
                        <motion.div whileHover={{ x: 4 }}>
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
                        </motion.div>
                        <Dropdown.Divider />
                      </>
                    )}

                    <motion.div whileHover={{ x: 4 }}>
                      <Dropdown.Item as={Link} to="/settings">
                        Settings & Privacy
                      </Dropdown.Item>
                    </motion.div>
                    
                    <motion.div whileHover={{ x: 4 }}>
                      <Dropdown.Item as={Link} to="/help">
                        Help Center
                      </Dropdown.Item>
                    </motion.div>
                    
                    <Dropdown.Divider />
                    
                    <motion.div whileHover={{ x: 4 }}>
                      <Dropdown.Item
                        onClick={() => {
                          localStorage.removeItem("auth_token");
                          Cookies.remove("auth_token");
                          navigate("/");
                        }}
                      >
                        Sign Out
                      </Dropdown.Item>
                    </motion.div>
                  </Dropdown.Menu>
                </AnimatePresence>
              </Dropdown>
            ) : (
              <>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    as={Link}
                    to="/login"
                    variant="outline-primary"
                    className="auth-button"
                  >
                    Sign In
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    as={Link}
                    to="/signup"
                    variant="primary"
                    className="auth-button"
                  >
                    Join Now
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;