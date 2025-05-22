import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Form,
  Modal,
  Image,
  ListGroup,
  InputGroup,
  FormControl,
} from "react-bootstrap";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiChevronRight,
  FiPlus,
  FiThumbsUp,
  FiThumbsDown,
  FiMessageSquare,
  FiHeart,
  FiShare2,
  FiX,
  FiImage,
} from "react-icons/fi";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { io } from "socket.io-client";

import "./EventsCard.css";
const userId = localStorage.getItem("userId");
const EventsCard = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    durationHours: 24,
    image: null,
  });
  const [commentText, setCommentText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [socket, setSocket] = useState(null);
  // Configure axios instance with user ID header
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      "X-User-ID": localStorage.getItem("userId"), // Store userId after login
    },
  });
  useEffect(() => {
    const socketInstance = io(import.meta.env.VITE_API_URL);
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, trendingRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/events`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/events/trending`),
        ]);
        setEvents(eventsRes.data);
        setTrendingEvents(trendingRes.data);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    if (socket) {
      socket.on("eventCreated", (event) => {
        setEvents((prev) => [event, ...prev]);
      });

      socket.on("eventDeleted", (eventId) => {
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
      });

      socket.on("voteUpdated", ({ eventId, upvotes, downvotes }) => {
        setEvents((prev) =>
          prev.map((e) =>
            e._id === eventId ? { ...e, upvotes, downvotes } : e
          )
        );
        setTrendingEvents((prev) =>
          prev.map((e) =>
            e._id === eventId ? { ...e, upvotes, downvotes } : e
          )
        );
      });

      socket.on("commentAdded", ({ eventId, comment }) => {
        setEvents((prev) =>
          prev.map((e) =>
            e._id === eventId
              ? { ...e, comments: [...(e.comments || []), comment] }
              : e
          )
        );
      });
    }

    return () => {
      if (socket) {
        socket.off("eventCreated");
        socket.off("eventDeleted");
        socket.off("voteUpdated");
        socket.off("commentAdded");
      }
    };
  }, [socket]);

  const toggleEventExpand = (eventId) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const getDateLabel = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE, MMM d");
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", newEvent.title);
      formData.append("description", newEvent.description);
      formData.append("date", newEvent.date);
      formData.append("time", newEvent.time);
      formData.append("location", newEvent.location);
      formData.append("durationHours", newEvent.durationHours);
      formData.append("creator", userId);
      if (newEvent.image) {
        formData.append("image", newEvent.image);
      }

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/events`,
        formData,
        config
      );

      setShowCreateModal(false);
      setNewEvent({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        durationHours: 24,
        image: null,
      });
    } catch (err) {
      console.error("Error creating event:", err);
      setError("Failed to create event. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleVote = async (eventId, type) => {
    try {
      const res = await api.post(`/api/events/${eventId}/vote`, { type });
      // Socket will handle the update via the voteUpdated event
    } catch (err) {
      console.error("Error voting:", err);
      if (err.response?.status === 401) {
        alert("Please login to vote");
      }
    }
  };
  const handleAddComment = async (eventId) => {
    if (!commentText.trim()) return;

    try {
      const res = await api.post(`/api/events/${eventId}/comments`, {
        content: commentText,
      });
      setCommentText("");
    } catch (err) {
      console.error("Error adding comment:", err);
      if (err.response?.status === 401) {
        alert("Please login to comment");
      }
    }
  };

  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewEvent({ ...newEvent, image: e.target.files[0] });
    }
  };

  const removeImage = () => {
    setNewEvent({ ...newEvent, image: null });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="events-container">
      <Card className="events-card">
        <Card.Header className="events-card-header">
          <div className="d-flex justify-content-between align-items-center">
            <h3>Upcoming Events</h3>
            {user && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                <FiPlus /> Create Event
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading events...</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="m-3">
              {error}
            </Alert>
          ) : events.length > 0 ? (
            <div className="events-list">
              <AnimatePresence>
                {events.map((event) => (
                  <motion.div
                    key={event._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`event-item ${
                        expandedEvent === event._id ? "expanded" : ""
                      }`}
                    >
                      <div
                        className="event-main-content"
                        onClick={() => toggleEventExpand(event._id)}
                      >
                        <div className="event-date">
                          <div className="date-label">
                            {getDateLabel(event.date)}
                          </div>
                          {isToday(parseISO(event.date)) && (
                            <Badge bg="danger" className="ms-2">
                              Live
                            </Badge>
                          )}
                          <Badge bg="secondary" className="ms-2">
                            {getTimeRemaining(event.expiresAt)}
                          </Badge>
                        </div>

                        <div className="event-content">
                          <div className="event-title">
                            <h5>{event.title}</h5>
                            <div className="event-meta">
                              <span>
                                <FiClock /> {event.time}
                              </span>
                              <span>
                                <FiMapPin /> {event.location || "Online"}
                              </span>
                            </div>
                          </div>

                          <div className="event-arrow">
                            <FiChevronRight
                              className={`arrow-icon ${
                                expandedEvent === event._id ? "rotated" : ""
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {expandedEvent === event._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="event-details"
                        >
                          {event.image && (
                            <Image
                              src={event.image.url}
                              alt={event.title}
                              fluid
                              className="mb-3 event-image"
                            />
                          )}
                          <p>{event.description}</p>

                          <div className="event-stats d-flex justify-content-between mb-3">
                            <div className="d-flex">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleVote(event._id, "up")}
                              >
                                <FiThumbsUp className="me-1" />
                                {event.upvotes || 0}
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleVote(event._id, "down")}
                              >
                                <FiThumbsDown className="me-1" />
                                {event.downvotes || 0}
                              </Button>
                            </div>
                            <div>
                              <Badge bg="light" text="dark">
                                <FiMessageSquare className="me-1" />
                                {event.comments
                                  ? event.comments.length
                                  : 0}{" "}
                                comments
                              </Badge>
                            </div>
                          </div>

                          <div className="comments-section mb-3">
                            <h6>Comments</h6>
                            {event.comments && event.comments.length > 0 ? (
                              <ListGroup variant="flush">
                                {event.comments.map((comment) => (
                                  <ListGroup.Item key={comment._id}>
                                    <strong>{comment.author?.name}:</strong>{" "}
                                    {comment.content}
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            ) : (
                              <p>No comments yet</p>
                            )}
                          </div>

                          <Form.Group className="mb-3">
                            <InputGroup>
                              <FormControl
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                              />
                              <Button
                                variant="primary"
                                onClick={() => handleAddComment(event._id)}
                              >
                                Post
                              </Button>
                            </InputGroup>
                          </Form.Group>

                          <div className="event-actions d-flex justify-content-between">
                            <div>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                              >
                                RSVP
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                className="me-2"
                              >
                                <FiShare2 /> Share
                              </Button>
                            </div>
                            {user && user._id === event.creator?._id && (
                              <Button variant="outline-danger" size="sm">
                                Delete Event
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-4 no-events">
              <FiCalendar size={48} className="text-muted mb-3" />
              <h5>No upcoming events</h5>
              <p className="text-muted">
                Check back later for scheduled events
              </p>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
              >
                Create an Event
              </Button>
            </div>
          )}
        </Card.Body>

        {events.length > 0 && (
          <Card.Footer className="text-center">
            <Button variant="link" size="sm">
              View All Events
            </Button>
          </Card.Footer>
        )}
      </Card>

      {trendingEvents.length > 0 && (
        <Card className="mt-4 trending-events">
          <Card.Header>
            <h5>🔥 Trending Events</h5>
          </Card.Header>
          <Card.Body>
            <div className="trending-list">
              {trendingEvents.map((event) => (
                <div
                  key={event._id}
                  className="trending-item"
                  onClick={() => setExpandedEvent(event._id)}
                >
                  <div className="d-flex align-items-center">
                    {event.image && (
                      <Image
                        src={event.image.url}
                        alt={event.title}
                        rounded
                        className="me-3 trending-image"
                      />
                    )}
                    <div>
                      <h6>{event.title}</h6>
                      <div className="trending-stats">
                        <Badge bg="success" className="me-2">
                          <FiThumbsUp /> {event.upvotes || 0}
                        </Badge>
                        <Badge bg="danger">
                          <FiThumbsDown /> {event.downvotes || 0}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Create Event Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Event</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateEvent}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Event Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter event title"
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, title: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter event description"
                value={newEvent.description}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, description: e.target.value })
                }
                required
              />
            </Form.Group>

            <div className="row mb-3">
              <Form.Group className="col-md-6">
                <Form.Label>Date</Form.Label>
                <Form.Control
                  type="date"
                  value={newEvent.date}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, date: e.target.value })
                  }
                  required
                />
              </Form.Group>

              <Form.Group className="col-md-6">
                <Form.Label>Time</Form.Label>
                <Form.Control
                  type="time"
                  value={newEvent.time}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, time: e.target.value })
                  }
                  required
                />
              </Form.Group>
            </div>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter location or 'Online'"
                value={newEvent.location}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, location: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Event Duration (hours)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="720"
                value={newEvent.durationHours}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, durationHours: e.target.value })
                }
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Event Image (optional)</Form.Label>
              {newEvent.image ? (
                <div className="image-preview-container">
                  <Image
                    src={URL.createObjectURL(newEvent.image)}
                    alt="Preview"
                    fluid
                    className="image-preview"
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    className="remove-image-btn"
                    onClick={removeImage}
                  >
                    <FiX />
                  </Button>
                </div>
              ) : (
                <div className="image-upload-container">
                  <label
                    htmlFor="event-image-upload"
                    className="image-upload-label"
                  >
                    <FiImage size={24} className="me-2" />
                    Choose Image
                  </label>
                  <input
                    id="event-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" /> Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default EventsCard;
