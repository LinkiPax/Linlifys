import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Spinner,
  Alert,
  ListGroup,
  Button,
  Badge,
  Accordion,
  Tab,
  Tabs,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiExternalLink,
} from "react-icons/fi";
import SkillSection from "./Skill";
import "./CareerSuggestion.css"; // Create this CSS file for custom styles

const CareerSuggestion = ({ userId }) => {
  const [skills, setSkills] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("careers");
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Function to fetch career suggestions based on skills
  const fetchSuggestions = async (updatedSkills) => {
    if (updatedSkills.length === 0) {
      setSuggestions([]);
      setLearningPaths([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const prompt = `Based on these skills: ${updatedSkills.join(
        ", "
      )}, suggest:
      1. 5 potential career paths with short descriptions
      2. For each career, list 3-5 key technologies/tools to learn
      3. For each career, suggest learning resources or certifications
      
      Format the response as JSON with 'careers' and 'learningPaths' arrays.`;

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/openai/`,
        {
          prompt,
        }
      );

      if (data.careers) {
        setSuggestions(data.careers);
      }

      if (data.learningPaths) {
        setLearningPaths(data.learningPaths);
      }

      if (!data.careers && !data.learningPaths) {
        setError("Unexpected response format from the server.");
      }
    } catch (err) {
      console.error("Error fetching career suggestions:", err);
      setError("Failed to fetch career suggestions. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Callback function when skills are updated
  const handleSkillsUpdate = (updatedSkills) => {
    setSkills(updatedSkills);
    fetchSuggestions(updatedSkills);
  };

  const toggleSuggestion = (index) => {
    setExpandedSuggestion(expandedSuggestion === index ? null : index);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setToastMessage("Copied to clipboard!");
    setShowToast(true);
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="career-suggestion-section">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="modern-card-container"
      >
        <SkillSection onSkillsUpdate={handleSkillsUpdate} userId={userId} />

        <div className="career-suggestions mt-4">
          <h2 className="section-title">Career Development Insights</h2>
          <p className="section-subtitle">
            Discover potential career paths based on your skills and interests
          </p>

          {loading && (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" size="lg" />
              <p className="mt-2">
                Analyzing your skills and finding the best matches...
              </p>
            </div>
          )}

          {error && (
            <Alert variant="danger" className="alert-modern">
              <Alert.Heading>Oops!</Alert.Heading>
              <p>{error}</p>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => fetchSuggestions(skills)}
              >
                Retry
              </Button>
            </Alert>
          )}

          {!loading && !error && skills.length > 0 && (
            <Card className="modern-card">
              <Card.Body>
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="modern-tabs mb-4"
                >
                  <Tab eventKey="careers" title="Career Paths">
                    <div className="mt-3">
                      {suggestions.length > 0 ? (
                        <Accordion defaultActiveKey="0" flush>
                          {suggestions.map((suggestion, index) => (
                            <Accordion.Item
                              eventKey={index.toString()}
                              key={index}
                              className="modern-accordion-item"
                            >
                              <Accordion.Header>
                                <div className="d-flex justify-content-between w-100">
                                  <h5 className="mb-0">{suggestion.title}</h5>
                                  {expandedSuggestion === index ? (
                                    <FiChevronUp />
                                  ) : (
                                    <FiChevronDown />
                                  )}
                                </div>
                              </Accordion.Header>
                              <Accordion.Body>
                                <p>{suggestion.description}</p>
                                {suggestion.salaryRange && (
                                  <p className="text-muted">
                                    <strong>Typical Salary Range:</strong>{" "}
                                    {suggestion.salaryRange}
                                  </p>
                                )}
                                <div className="mt-3">
                                  <h6>Key Technologies:</h6>
                                  <div className="d-flex flex-wrap gap-2 mb-3">
                                    {suggestion.technologies?.map((tech, i) => (
                                      <Badge pill bg="primary" key={i}>
                                        {tech}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                {suggestion.resources && (
                                  <div>
                                    <h6>Learning Resources:</h6>
                                    <ListGroup variant="flush">
                                      {suggestion.resources.map(
                                        (resource, i) => (
                                          <ListGroup.Item
                                            key={i}
                                            className="resource-item"
                                          >
                                            <div className="d-flex justify-content-between align-items-center">
                                              <span>{resource}</span>
                                              <Button
                                                variant="link"
                                                size="sm"
                                                onClick={() =>
                                                  copyToClipboard(resource)
                                                }
                                              >
                                                <FiCopy />
                                              </Button>
                                            </div>
                                          </ListGroup.Item>
                                        )
                                      )}
                                    </ListGroup>
                                  </div>
                                )}
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  className="mt-3"
                                  onClick={() =>
                                    window.open(suggestion.searchLink, "_blank")
                                  }
                                >
                                  Explore Jobs <FiExternalLink />
                                </Button>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-center py-4">
                          <p>
                            No career suggestions found for your current skills.
                          </p>
                          <p>
                            Try adding more skills to get better
                            recommendations.
                          </p>
                        </div>
                      )}
                    </div>
                  </Tab>
                  <Tab eventKey="learning" title="Learning Paths">
                    <div className="mt-3">
                      {learningPaths.length > 0 ? (
                        <ListGroup variant="flush">
                          {learningPaths.map((path, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <ListGroup.Item className="learning-path-item">
                                <h5>{path.title}</h5>
                                <p>{path.description}</p>
                                <div className="timeline-container">
                                  {path.steps?.map((step, i) => (
                                    <div key={i} className="timeline-step">
                                      <div className="timeline-bullet"></div>
                                      <div className="timeline-content">
                                        <h6>{step.title}</h6>
                                        <p className="text-muted">
                                          {step.description}
                                        </p>
                                        {step.resources && (
                                          <div className="resource-links">
                                            {step.resources.map(
                                              (resource, j) => (
                                                <a
                                                  key={j}
                                                  href={resource.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="resource-link"
                                                >
                                                  {resource.name}
                                                </a>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ListGroup.Item>
                            </motion.div>
                          ))}
                        </ListGroup>
                      ) : (
                        <div className="text-center py-4">
                          <p>No learning paths generated yet.</p>
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          )}

          {!loading && skills.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-state"
            >
              <Card className="modern-card">
                <Card.Body className="text-center py-5">
                  <img
                    src="/images/career-path.svg"
                    alt="Career path"
                    className="empty-state-img mb-4"
                  />
                  <h4>Start by adding your skills</h4>
                  <p className="text-muted">
                    Add the skills you have or want to develop to get
                    personalized career suggestions.
                  </p>
                </Card.Body>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>

      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          className="modern-toast"
        >
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default CareerSuggestion;
