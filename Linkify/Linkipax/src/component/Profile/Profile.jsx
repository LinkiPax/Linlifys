import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

import {
  Container,
  Card,
  Button,
  Form,
  Modal,
  Spinner,
  Row,
  Col,
  Alert,
  Image,
  Nav,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import {
  FiEdit,
  FiLink,
  FiMail,
  FiBriefcase,
  FiAward,
  FiBarChart2,
  FiTrendingUp,
} from "react-icons/fi";
import NavbarComponent from "../navbar/Navbar";
import ProfileHeader from "./ProfileHeader";
import Experience from "./Experience";
import Education from "./Education";
import CareerSuggestion from "./CareerSuggestion";
import AnalyticsDashboard from "./AnalyticsDashboard";
import TrendingSection from "./TrendingSection";
import SkillSection from "./Skill";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    bio: "",
    company: "",
    jobTitle: "",
    backgroundImage: "",
    profilePicture: "",
  });
  const [posts, setPosts] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [analytics, setAnalytics] = useState({ views: 0, impressions: 0 });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("experience");

  // Refs for scrolling
  const experienceRef = useRef(null);
  const educationRef = useRef(null);
  const skillsRef = useRef(null);
  const analyticsRef = useRef(null);
  const trendsRef = useRef(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          }
        );

        const data = response.data;
        setUser(data);
        setFormData({
          name: data.name,
          email: data.email,
          bio: data.bio,
          company: data.company,
          jobTitle: data.jobTitle,
          backgroundImage: data.backgroundImage || "default.jpg",
          profilePicture: data.profilePicture || "default-profile.jpg",
        });
        setPosts(data.posts || []);
        setExperiences(data.experiences || []);
        setEducation(data.education || []);
        setSkills(data.skills || []);
        setAnalytics(data.analytics || { views: 0, impressions: 0 });
      } catch (error) {
        setError("Error fetching user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleEditProfile = () => setShowEditModal(true);
  const handleCloseEditModal = () => setShowEditModal(false);

  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const updatedData = {
        name: formData.name,
        profilePicture: formData.profilePicture,
        bio: formData.bio,
        jobTitle: formData.jobTitle,
        company: formData.company,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/user/update-details/${userId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      setUser({ ...user, ...response.data.updatedUser });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error saving user data:", error);
      setError(error.response?.data?.message || "Error saving profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Corrected smooth scroll function
  const scrollToSection = (section) => {
    setActiveTab(section);
    let ref = null;

    switch (section) {
      case "experience":
        ref = experienceRef;
        break;
      case "education":
        ref = educationRef;
        break;
      case "skills":
        ref = skillsRef;
        break;
      case "analytics":
        ref = analyticsRef;
        break;
      case "trends":
        ref = trendsRef;
        break;
      default:
        ref = experienceRef;
    }

    if (ref && ref.current) {
      window.scrollTo({
        top: ref.current.offsetTop - 100,
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <div className="profile-loading text-center py-5">
        <Spinner animation="grow" variant="primary" />
        <p className="mt-3 text-muted">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-not-found text-center py-5">
        <Alert variant="warning">
          <h4>User not found</h4>
          <p>
            The profile you're looking for doesn't exist or may have been
            removed.
          </p>
        </Alert>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <NavbarComponent />

      <ProfileHeader
        user={user}
        formData={formData}
        handleEditProfile={handleEditProfile}
        userId={userId}
      />

      <div className="profile-navigation sticky-top bg-white shadow-sm">
        <Container>
          <Nav variant="tabs" activeKey={activeTab} className="profile-tabs">
            <Nav.Item>
              <Nav.Link
                eventKey="experience"
                onClick={() => scrollToSection("experience")}
              >
                <FiBriefcase className="me-2" /> Experience
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="education"
                onClick={() => scrollToSection("education")}
              >
                <FiAward className="me-2" /> Education
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="skills"
                onClick={() => scrollToSection("skills")}
              >
                <FiAward className="me-2" /> Skills
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="analytics"
                onClick={() => scrollToSection("analytics")}
              >
                <FiBarChart2 className="me-2" /> Analytics
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link
                eventKey="trends"
                onClick={() => scrollToSection("trends")}
              >
                <FiTrendingUp className="me-2" /> Trends
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Container>
      </div>

      <Container className="profile-container py-4">
        <Row>
          <Col lg={8} className="pe-lg-4">
            {/* Scrollable Experience Section */}
            <div ref={experienceRef} className="scrollable-section">
              <Experience experiences={experiences} userId={userId} />
            </div>

            {/* Scrollable Education Section */}
            <div ref={educationRef} className="scrollable-section mt-5">
              <Education education={education} userId={userId} />
            </div>

            {/* Scrollable Skills Section */}
            <div ref={skillsRef} className="scrollable-section mt-5">
              <SkillSection skills={skills} userId={userId} />
            </div>

            <div className="mt-5">
              <CareerSuggestion user={user} userId={userId} />
            </div>

            {/* Scrollable Analytics Section */}
            <div ref={analyticsRef} className="scrollable-section mt-5">
              <AnalyticsDashboard analytics={analytics} profileId={userId} />
            </div>
          </Col>

          <Col lg={4} className="profile-sidebar">
            {/* Scrollable Trends Section */}
            <div ref={trendsRef} className="scrollable-section">
              <TrendingSection posts={posts} userId={userId} />
            </div>

            <Card className="mt-4 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Connections</h5>
                  <Button variant="outline-primary" size="sm">
                    Manage
                  </Button>
                </div>
                <div className="connection-count">
                  <span className="text-muted">
                    {user.connections?.length || 0} connections
                  </span>
                  <Button variant="link" size="sm">
                    Show all
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="mt-4 shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">About</h5>
                  <Button variant="link" size="sm" onClick={handleEditProfile}>
                    <FiEdit size={16} />
                  </Button>
                </div>
                <p className="text-muted">{user.bio || "No bio available"}</p>
                <div className="profile-details">
                  <p>
                    <FiMail className="me-2" /> {user.email}
                  </p>
                  {user.company && (
                    <p>
                      <FiBriefcase className="me-2" /> {user.company}
                    </p>
                  )}
                  {user.website && (
                    <p>
                      <FiLink className="me-2" />
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {user.website}
                      </a>
                    </p>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Edit Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form>
            <Form.Group controlId="name" className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="email" className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled
              />
            </Form.Group>

            <Form.Group controlId="bio" className="mb-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="company" className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="jobTitle" className="mb-3">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                type="text"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group controlId="profilePicture" className="mb-4">
              <Form.Label>Profile Picture</Form.Label>
              <Form.Control
                type="file"
                name="profilePicture"
                onChange={handleFileChange}
                className="mb-2"
              />
              {formData.profilePicture && (
                <Image
                  src={formData.profilePicture}
                  roundedCircle
                  width="100"
                  height="100"
                  className="d-block mx-auto border"
                />
              )}
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={handleCloseEditModal}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveChanges}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2"
                    />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProfilePage;
