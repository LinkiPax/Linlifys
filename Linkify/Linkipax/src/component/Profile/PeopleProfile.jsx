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
  FaBuilding,
  FaGraduationCap,
  FaLink,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { FiAward, FiBriefcase, FiMapPin, FiMail, FiUsers } from "react-icons/fi";
import { RiSuitcaseLine, RiUserStarLine } from "react-icons/ri";
import { IoMdNotificationsOutline } from "react-icons/io";
import { BsThreeDotsVertical, BsBookmark } from "react-icons/bs";
import "./PeopleProfile.css";

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
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const showAlert = (message, variant = "info") => {
    setFeedback({ show: true, message, variant });
    setTimeout(() => setFeedback({ ...feedback, show: false }), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, connectionRes, skillsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/profile/merged-user-details/${userId}`),
          axios.get(`${import.meta.env.VITE_API_URL}/connections/status/${loggedInUserId}/${userId}`),
          axios.get(`${import.meta.env.VITE_API_URL}/skill/${userId}`),
        ]);
        
        setProfile(profileRes.data);
        setConnectionStatus(connectionRes.data.status);
        setSkills(skillsRes.data.skills || []);
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
    socialLinks = {},
    interests = [],
    location,
    occupation,
    achievements = [],
    hobbies = [],
    education = [],
    projects = [],
    connections = [],
    experience = []
  } = profile;

  const connectionsCount = connections?.length || 0;

  const getConnectionButton = () => {
    switch (connectionStatus) {
      case "none":
        return (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              onClick={() => handleConnectionAction("send")}
              className="rounded-pill px-4 d-flex align-items-center"
            >
              <FaUserPlus className="me-2" /> Connect
            </Button>
          </motion.div>
        );
      case "pending":
        return (
          <OverlayTrigger overlay={<Tooltip>Request already sent</Tooltip>}>
            <Button variant="outline-primary" disabled className="rounded-pill px-4 d-flex align-items-center">
              <FaUserClock className="me-2" /> Pending
            </Button>
          </OverlayTrigger>
        );
      case "received":
        return (
          <div className="d-flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="primary"
                onClick={() => handleConnectionAction("accept")}
                className="rounded-pill px-4 d-flex align-items-center"
              >
                <FaUserCheck className="me-2" /> Accept
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline-danger"
                onClick={() => handleConnectionAction("block")}
                className="rounded-pill px-4 d-flex align-items-center"
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
                variant="primary"
                onClick={() => setShowMessageModal(true)}
                className="rounded-pill px-4 d-flex align-items-center"
              >
                <FaEnvelope className="me-2" /> Message
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline-secondary"
                onClick={() => handleConnectionAction("withdraw")}
                className="rounded-pill px-4 d-flex align-items-center"
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
       <Card className="profile-header-card shadow-sm mb-4 border-0 overflow-hidden">
  {backgroundImage?.secure_url && (
    <div
      className="profile-banner"
      style={{
        backgroundImage: `url(${backgroundImage.secure_url})`,
      }}
    />
  )}
          <Card.Body className="position-relative pt-5 pb-4">
    <div className="d-flex flex-column flex-md-row align-items-start">
      {/* Profile Image Container - Fixed Positioning */}
      <div className="profile-picture-container mb-3 mb-md-0 mx-auto mx-md-0">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="position-relative"
          style={{
            width: "150px",
            height: "150px",
          }}
        >
          <img
            src={profilePicture}
            alt="Profile"
            className="rounded-circle border border-4 border-white shadow profile-image"
          />
        </motion.div>
      </div>

              <div className="ms-md-5 ps-md-5 mt-4 mt-md-0 flex-grow-1">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h2 className="mb-1 fw-bold">{name}</h2>
                    <h5 className="text-primary mb-2">{jobTitle}</h5>
                    <div className="d-flex align-items-center text-muted mb-3 flex-wrap">
                      <span className="d-flex align-items-center me-3">
                        <FaBuilding className="me-2" />
                        <span>{company || "No company specified"}</span>
                      </span>
                      <span className="d-flex align-items-center me-3">
                        <FiMapPin className="me-2" />
                        <span>{location || "No location specified"}</span>
                      </span>
                      <span className="d-flex align-items-center">
                        <FiUsers className="me-2" />
                        <span>{connectionsCount} connections</span>
                      </span>
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    {getConnectionButton()}
                    <div className="position-relative">
                      <Button 
                        variant="outline-secondary" 
                        className="rounded-circle p-2" 
                        onClick={() => setShowMoreOptions(!showMoreOptions)}
                      >
                        <BsThreeDotsVertical />
                      </Button>
                      
                      <AnimatePresence>
                        {showMoreOptions && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="more-options-menu shadow"
                          >
                            <Button variant="link" className="d-flex align-items-center w-100 text-start">
                              <IoMdNotificationsOutline className="me-2" /> Notifications
                            </Button>
                            <Button variant="link" className="d-flex align-items-center w-100 text-start">
                              <BsBookmark className="me-2" /> Save profile
                            </Button>
                            <Button variant="link" className="d-flex align-items-center w-100 text-start">
                              <RiUserStarLine className="me-2" /> Recommend
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <motion.a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-dark btn-sm rounded-circle social-icon"
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {renderSocialIcon(platform)}
                    </motion.a>
                  ))}
                  <motion.a
                    href={`mailto:${email}`}
                    className="btn btn-outline-dark btn-sm rounded-circle social-icon"
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
        <Row className="g-4">
          <Col lg={4}>
            {/* About Card */}
            <Card className="shadow-sm h-100">
              <Card.Body>
                <h5 className="mb-3 fw-bold">About</h5>
                <p className="text-muted">{bio || "No bio provided"}</p>

                <div className="mt-4">
                  <h6 className="text-muted mb-3 fw-bold">Details</h6>
                  <ul className="list-unstyled">
                    <li className="mb-2 d-flex align-items-start">
                      <RiSuitcaseLine className="me-2 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Occupation:</strong> {occupation || "Not specified"}
                      </div>
                    </li>
                    {education.length > 0 && (
                      <li className="mb-2 d-flex align-items-start">
                        <FaGraduationCap className="me-2 mt-1 flex-shrink-0" />
                        <div>
                          <strong>Education:</strong> {education.join(", ")}
                        </div>
                      </li>
                    )}
                    <li className="mb-2 d-flex align-items-start">
                      <FiMail className="me-2 mt-1 flex-shrink-0" />
                      <div>
                        <strong>Email:</strong> {email}
                      </div>
                    </li>
                  </ul>
                </div>
              </Card.Body>
            </Card>

            {/* Skills Card */}
            {skills.length > 0 && (
              <Card className="shadow-sm mt-4">
                <Card.Body>
                  <h5 className="mb-3 fw-bold">Skills</h5>
                  {skills.map((skill) => (
                    <div key={skill.name} className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <span>{skill.name}</span>
                        <span>{skill.level}%</span>
                      </div>
                      <ProgressBar
                        now={skill.level}
                        variant="primary"
                        className="rounded-pill skill-progress"
                      />
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            {/* Interests & Hobbies */}
            {(interests.length > 0 || hobbies.length > 0) && (
              <Card className="shadow-sm mt-4">
                <Card.Body>
                  <h5 className="mb-3 fw-bold">Interests & Hobbies</h5>

                  {interests.length > 0 && (
                    <>
                      <h6 className="text-muted mb-2">Interests</h6>
                      <div className="mb-3">
                        {interests.map((interest, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            className="d-inline-block me-2 mb-2"
                          >
                            <Badge pill bg="info" className="interest-badge">
                              {interest}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}

                  {hobbies.length > 0 && (
                    <>
                      <h6 className="text-muted mb-2">Hobbies</h6>
                      <div>
                        {hobbies.map((hobby, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ scale: 1.05 }}
                            className="d-inline-block me-2 mb-2"
                          >
                            <Badge pill bg="secondary" className="hobby-badge">
                              {hobby}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-4 profile-tabs"
                  fill
                >
                  <Tab eventKey="about" title={
                    <span className="d-flex align-items-center">
                      <FiBriefcase className="me-1" /> About
                    </span>
                  }>
                    <div className="mt-3">
                      <h5 className="mb-3 fw-bold">Professional Summary</h5>
                      <p className="text-muted">
                        {bio || "No professional summary provided"}
                      </p>

                      {achievements.length > 0 && (
                        <>
                          <h5 className="mt-4 mb-3 fw-bold">Achievements</h5>
                          <ListGroup variant="flush" className="achievement-list">
                            {achievements.map((ach, idx) => (
                              <ListGroup.Item
                                key={idx}
                                className="d-flex align-items-center achievement-item"
                              >
                                <FiAward
                                  className="text-warning me-3 flex-shrink-0 achievement-icon"
                                />
                                <span>{ach}</span>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        </>
                      )}
                    </div>
                  </Tab>

                  <Tab eventKey="experience" title={
                    <span className="d-flex align-items-center">
                      <RiSuitcaseLine className="me-1" /> Experience
                    </span>
                  }>
                    <div className="mt-3">
                      <h5 className="mb-3 fw-bold">Work Experience</h5>
                      <div className="timeline">
                        {experience.length > 0 ? (
                          experience.map((exp, idx) => (
                            <div className="timeline-item" key={idx}>
                              <div className="timeline-point"></div>
                              <div className="timeline-content">
                                <h6 className="fw-bold">{exp.position || "Position"}</h6>
                                <p className="text-muted mb-1">{exp.company || "Company"}</p>
                                <small className="text-muted">
                                  {exp.startDate} - {exp.endDate || "Present"}
                                </small>
                                <p className="mt-2">
                                  {exp.description || "Details about the position and responsibilities..."}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="timeline-item">
                            <div className="timeline-point"></div>
                            <div className="timeline-content">
                              <h6 className="fw-bold">{jobTitle || "Current Position"}</h6>
                              <p className="text-muted mb-1">{company || "Current Company"}</p>
                              <small className="text-muted">Present</small>
                              <p className="mt-2">
                                {bio || "Details about the position and responsibilities..."}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab>

                  <Tab eventKey="projects" title={
                    <span className="d-flex align-items-center">
                      <FaLink className="me-1" /> Projects
                    </span>
                  }>
                    <div className="mt-3">
                      <h5 className="mb-3 fw-bold">Recent Projects</h5>
                      {projects.length > 0 ? (
                        <Row className="g-4">
                          {projects.map((project, idx) => (
                            <Col md={6} key={idx}>
                              <motion.div whileHover={{ y: -5 }}>
                                <Card className="h-100 project-card">
                                  <div className="project-image-container">
                                    <Card.Img
                                      variant="top"
                                      src={
                                        project.image ||
                                        "https://via.placeholder.com/300x200"
                                      }
                                      className="project-image"
                                    />
                                  </div>
                                  <Card.Body>
                                    <Card.Title className="fw-bold">{project.name}</Card.Title>
                                    <Card.Text className="text-muted">{project.description}</Card.Text>
                                  </Card.Body>
                                  <Card.Footer className="bg-transparent border-top-0">
                                    <Button variant="outline-primary" size="sm">
                                      View Details
                                    </Button>
                                  </Card.Footer>
                                </Card>
                              </motion.div>
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

            {/* Activity Feed */}
            <Card className="shadow-sm mt-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold">Recent Activity</h5>
                  <Button variant="link" className="text-primary p-0">See all</Button>
                </div>
                <div className="activity-item">
                  <div className="activity-avatar">
                    <img
                      src={profilePicture}
                      alt="User"
                      className="rounded-circle"
                      width="48"
                    />
                  </div>
                  <div className="activity-content">
                    <div className="d-flex justify-content-between">
                      <p className="mb-1 fw-bold">{name} <span className="fw-normal">updated their profile</span></p>
                      <small className="text-muted">Recently</small>
                    </div>
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
          className="message-modal"
        >
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="fw-bold">Send Message to {name}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0">
            <textarea
              className="form-control message-textarea"
              rows="5"
              placeholder="Write your message here..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
            />
          </Modal.Body>
          <Modal.Footer className="border-0">
            <Button
              variant="outline-secondary"
              onClick={() => setShowMessageModal(false)}
              className="rounded-pill px-4"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!messageContent.trim()}
              className="rounded-pill px-4"
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