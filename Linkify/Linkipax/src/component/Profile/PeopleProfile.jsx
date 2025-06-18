import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
  Alert,
  ListGroup,
  OverlayTrigger,
  Tooltip,
  Tab,
  Tabs,
  ProgressBar,
  Modal,
} from "react-bootstrap";
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaGlobe,
  FaEnvelope,
  FaUserPlus,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaRegStar,
  FaStar,
  FaRegThumbsUp,
  FaThumbsUp,
  FaRegComment,
  FaShare,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { FiAward, FiBriefcase, FiMapPin, FiMail } from "react-icons/fi";
import "./PeopleProfile.css"; // Custom CSS file for additional styling

const PeopleProfile = () => {
  const { userId } = useParams();
  const loggedInUserId = localStorage.getItem("userId");

  const [profile, setProfile] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("none");
  const [feedback, setFeedback] = useState({
    show: false,
    message: "",
    variant: "info",
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("about");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [skills, setSkills] = useState([]);

  const showAlert = (message, variant = "info") => {
    setFeedback({ show: true, message, variant });
    setTimeout(() => setFeedback({ ...feedback, show: false }), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, connectionRes, skillsRes] = await Promise.all([
          axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/profile/merged-user-details/${userId}`
          ),
          axios.get(
            `${
              import.meta.env.VITE_API_URL
            }/connections/status/${loggedInUserId}/${userId}`
          ),
          axios.get(`${import.meta.env.VITE_API_URL}/skill/${userId}`),
        ]);

        setProfile(profileRes.data);
        setConnectionStatus(connectionRes.data.status);
        setSkills(skillsRes.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        showAlert("Failed to load profile", "danger");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, loggedInUserId]);

  const handleConnectionAction = async (type) => {
    try {
      const actions = {
        send: () =>
          axios.post(`${import.meta.env.VITE_API_URL}/connections/request`, {
            senderId: loggedInUserId,
            receiverId: userId,
          }),
        withdraw: () =>
          axios.post(`${import.meta.env.VITE_API_URL}/connections/withdraw`, {
            senderId: loggedInUserId,
            receiverId: userId,
          }),
        accept: () =>
          axios.post(`${import.meta.env.VITE_API_URL}/connections/accept`, {
            senderId: userId,
            receiverId: loggedInUserId,
          }),
        block: () =>
          axios.post(`${import.meta.env.VITE_API_URL}/connections/block`, {
            blockerId: loggedInUserId,
            blockedId: userId,
          }),
      };

      await actions[type]();

      // Update status locally
      const statusMap = {
        send: "pending",
        withdraw: "none",
        accept: "connected",
        block: "blocked",
      };
      setConnectionStatus(statusMap[type]);

      showAlert("Action completed", "success");
    } catch (err) {
      console.error("Connection action failed:", err);
      showAlert("Action failed", "danger");
    }
  };

  const handleSendMessage = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/messages/send`, {
        senderId: loggedInUserId,
        receiverId: userId,
        content: messageContent,
      });
      showAlert("Message sent successfully", "success");
      setShowMessageModal(false);
      setMessageContent("");
    } catch (error) {
      console.error("Error sending message:", error);
      showAlert("Failed to send message", "danger");
    }
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Spinner
            animation="border"
            variant="primary"
            style={{ width: "3rem", height: "3rem" }}
          />
          <p className="mt-3">Loading profile...</p>
        </motion.div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container className="text-center my-5">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Alert variant="danger" className="shadow">
            <h4>User not found</h4>
            <p>
              The profile you're looking for doesn't exist or may have been
              removed.
            </p>
          </Alert>
        </motion.div>
      </Container>
    );
  }

  const {
    name,
    email,
    bio,
    company,
    jobTitle,
    profilePicture,
    backgroundImage,
    socialLinks,
    interests,
    location,
    occupation,
    achievements,
    hobbies,
    education,
    projects,
  } = profile;

  const getConnectionButton = () => {
    switch (connectionStatus) {
      case "none":
        return (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              onClick={() => handleConnectionAction("send")}
              className="rounded-pill px-4"
            >
              <FaUserPlus className="me-2" /> Connect
            </Button>
          </motion.div>
        );
      case "pending":
        return (
          <OverlayTrigger overlay={<Tooltip>Request already sent</Tooltip>}>
            <Button variant="secondary" disabled className="rounded-pill px-4">
              <FaUserClock className="me-2" /> Pending
            </Button>
          </OverlayTrigger>
        );
      case "received":
        return (
          <div className="d-flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="success"
                onClick={() => handleConnectionAction("accept")}
                className="rounded-pill px-4"
              >
                <FaUserCheck className="me-2" /> Accept
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="danger"
                onClick={() => handleConnectionAction("block")}
                className="rounded-pill px-4"
              >
                <FaUserTimes className="me-2" /> Block
              </Button>
            </motion.div>
          </div>
        );
      case "connected":
        return (
          <div className="d-flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline-primary"
                onClick={() => setShowMessageModal(true)}
                className="rounded-pill px-4"
              >
                <FaEnvelope className="me-2" /> Message
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline-danger"
                onClick={() => handleConnectionAction("withdraw")}
                className="rounded-pill px-4"
              >
                <FaUserTimes className="me-2" /> Disconnect
              </Button>
            </motion.div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return <FaLinkedin />;
      case "github":
        return <FaGithub />;
      case "twitter":
        return <FaTwitter />;
      case "facebook":
        return <FaFacebook />;
      default:
        return <FaGlobe />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Container className="mt-4">
        {feedback.show && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="position-fixed top-0 start-50 translate-middle-x mt-3 z-3"
            style={{ width: "fit-content" }}
          >
            <Alert
              variant={feedback.variant}
              className="shadow-lg"
              onClose={() => setFeedback({ ...feedback, show: false })}
              dismissible
            >
              {feedback.message}
            </Alert>
          </motion.div>
        )}

        {/* Profile Header */}
        <Card className="shadow-lg mb-4 border-0 overflow-hidden">
          {backgroundImage && (
            <div
              className="profile-banner"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                height: "250px",
              }}
            />
          )}
          <Card.Body className="position-relative pt-5">
            <div className="d-flex flex-column flex-md-row align-items-start">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="profile-picture-container mb-3 mb-md-0"
              >
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="rounded-circle border border-4 border-white shadow"
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "cover",
                    position: "absolute",
                    top: "-75px",
                    left: "50px",
                  }}
                />
              </motion.div>

              <div className="ms-md-5 ps-md-5 mt-4 mt-md-0 flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h2 className="mb-1">{name}</h2>
                    <h5 className="text-primary mb-2">{jobTitle}</h5>
                    <div className="d-flex align-items-center text-muted mb-3">
                      <FiBriefcase className="me-2" />
                      <span>{company}</span>
                      <FiMapPin className="ms-3 me-2" />
                      <span>{location}</span>
                    </div>
                  </div>
                  <div className="d-flex gap-2">{getConnectionButton()}</div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  {socialLinks &&
                    Object.entries(socialLinks).map(([platform, url]) => (
                      <motion.a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-dark btn-sm rounded-circle"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {renderSocialIcon(platform)}
                      </motion.a>
                    ))}
                  <motion.a
                    href={`mailto:${email}`}
                    className="btn btn-outline-dark btn-sm rounded-circle"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <FiMail />
                  </motion.a>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Main Content */}
        <Row>
          <Col lg={4}>
            {/* About Card */}
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">About</h5>
                <p className="text-muted">{bio || "No bio provided"}</p>

                <div className="mt-4">
                  <h6 className="text-muted mb-3">Details</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <strong>Occupation:</strong>{" "}
                      {occupation || "Not specified"}
                    </li>
                    {education?.length > 0 && (
                      <li className="mb-2">
                        <strong>Education:</strong> {education.join(", ")}
                      </li>
                    )}
                  </ul>
                </div>
              </Card.Body>
            </Card>

            {/* Skills Card */}
            {skills.length > 0 && (
              <Card className="shadow-sm mb-4">
                <Card.Body>
                  <h5 className="mb-3">Skills</h5>
                  {skills.map((skill) => (
                    <div key={skill.name} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>{skill.name}</span>
                        <span>{skill.level}%</span>
                      </div>
                      <ProgressBar
                        now={skill.level}
                        variant="primary"
                        className="rounded-pill"
                        style={{ height: "8px" }}
                      />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            {/* Interests & Hobbies */}
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">Interests & Hobbies</h5>

                {interests?.length > 0 && (
                  <>
                    <h6 className="text-muted mb-2">Interests</h6>
                    <div className="mb-3">
                      {interests.map((interest, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          className="d-inline-block me-2 mb-2"
                        >
                          <Badge pill bg="info" className="px-3 py-2">
                            {interest}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {hobbies?.length > 0 && (
                  <>
                    <h6 className="text-muted mb-2">Hobbies</h6>
                    <div>
                      {hobbies.map((hobby, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          className="d-inline-block me-2 mb-2"
                        >
                          <Badge pill bg="secondary" className="px-3 py-2">
                            {hobby}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-4"
                  fill
                >
                  <Tab eventKey="about" title="About">
                    <div className="mt-3">
                      <h5 className="mb-3">Professional Summary</h5>
                      <p className="text-muted">
                        {bio || "No professional summary provided"}
                      </p>

                      {achievements?.length > 0 && (
                        <>
                          <h5 className="mt-4 mb-3">Achievements</h5>
                          <ListGroup variant="flush">
                            {achievements.map((ach, idx) => (
                              <ListGroup.Item
                                key={idx}
                                className="d-flex align-items-center"
                              >
                                <FiAward
                                  className="text-warning me-3 flex-shrink-0"
                                  size={20}
                                />
                                <span>{ach}</span>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </>
                      )}
                    </div>
                  </Tab>

                  <Tab eventKey="experience" title="Experience">
                    <div className="mt-3">
                      <h5 className="mb-3">Work Experience</h5>
                      <div className="timeline">
                        <div className="timeline-item">
                          <div className="timeline-point"></div>
                          <div className="timeline-content">
                            <h6>{jobTitle}</h6>
                            <p className="text-muted mb-1">{company}</p>
                            <small className="text-muted">Present</small>
                            <p className="mt-2">
                              Details about the position and responsibilities...
                            </p>
                          </div>
                        </div>
                        {/* Add more timeline items as needed */}
                      </div>
                    </div>
                  </Tab>

                  <Tab eventKey="projects" title="Projects">
                    <div className="mt-3">
                      <h5 className="mb-3">Recent Projects</h5>
                      {projects?.length > 0 ? (
                        <Row>
                          {projects.map((project, idx) => (
                            <Col md={6} key={idx} className="mb-3">
                              <Card className="h-100">
                                <Card.Img
                                  variant="top"
                                  src={
                                    project.image ||
                                    "https://via.placeholder.com/300x200"
                                  }
                                />
                                <Card.Body>
                                  <Card.Title>{project.name}</Card.Title>
                                  <Card.Text>{project.description}</Card.Text>
                                </Card.Body>
                                <Card.Footer className="bg-transparent border-top-0">
                                  <Button variant="outline-primary" size="sm">
                                    View Details
                                  </Button>
                                </Card.Footer>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <Alert variant="info">No projects to display</Alert>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>

            {/* Activity Feed (simulated) */}
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">Recent Activity</h5>
                <div className="activity-item">
                  <div className="activity-avatar">
                    <img
                      src={profilePicture}
                      alt="User"
                      className="rounded-circle"
                      width="40"
                    />
                  </div>
                  <div className="activity-content">
                    <p className="mb-1">
                      <strong>{name}</strong> shared a new project
                    </p>
                    <small className="text-muted">2 hours ago</small>
                    <div className="activity-actions mt-2">
                      <Button variant="link" size="sm" className="text-muted">
                        <FaRegThumbsUp className="me-1" /> Like
                      </Button>
                      <Button variant="link" size="sm" className="text-muted">
                        <FaRegComment className="me-1" /> Comment
                      </Button>
                      <Button variant="link" size="sm" className="text-muted">
                        <FaShare className="me-1" /> Share
                      </Button>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Message Modal */}
        <Modal
          show={showMessageModal}
          onHide={() => setShowMessageModal(false)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Send Message to {name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Write your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowMessageModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!messageContent.trim()}
            >
              Send Message
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </motion.div>
  );
};

export default PeopleProfile;
