import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Form,
  Badge,
  Spinner,
  Alert,
  ListGroup,
  Row,
  Col,
  Toast,
  ToastContainer,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import axios from "axios";
import {
  FiPlus,
  FiX,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiCheck,
  FiAward,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "./SkillSection.css"; // Custom CSS for additional styling

const SkillSection = ({ userId, updateSkills }) => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [editSkillValue, setEditSkillValue] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [skillLevels, setSkillLevels] = useState({});
  const inputRef = useRef(null);

  // Fetch skills and skill levels on component mount
  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/skill/${userId}`);
        setSkills(data.skills || []);

        // Fetch skill levels if they exist
        if (data.skillLevels) {
          setSkillLevels(data.skillLevels);
        }
      } catch (error) {
        setError("Error fetching skills. Please try again later.");
        console.error("Error fetching skills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [userId]);

  // Debounced skill suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newSkill.trim()) {
        fetchSuggestions();
      } else {
        setSkillSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newSkill]);

  const fetchSuggestions = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/skill/suggestions?query=${newSkill}`
      );
      setSkillSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching skill suggestions:", error);
    }
  };

  // Add a new skill
  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      setError("Please enter a skill name");
      return;
    }
    if (skills.includes(newSkill.trim())) {
      setError("You've already added this skill");
      return;
    }

    setIsAddingSkill(true);
    try {
      const updatedSkills = [...skills, newSkill.trim()];
      await axios.post(`${import.meta.env.VITE_API_URL}/skill/${userId}`, {
        skills: updatedSkills,
        skillLevels: { ...skillLevels, [newSkill.trim()]: 1 }, // Default level 1
      });

      setSkills(updatedSkills);
      setSkillLevels((prev) => ({ ...prev, [newSkill.trim()]: 1 }));
      setNewSkill("");
      setSuccess("Skill added successfully!");
      updateSkills(updatedSkills);
      setError(null);

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to add skill. Please try again.");
      console.error("Error adding skill:", error);
    } finally {
      setIsAddingSkill(false);
    }
  };

  // Remove a skill
  const handleRemoveSkill = async (skillToRemove) => {
    try {
      const updatedSkills = skills.filter((skill) => skill !== skillToRemove);
      const updatedSkillLevels = { ...skillLevels };
      delete updatedSkillLevels[skillToRemove];

      await axios.post(`${import.meta.env.VITE_API_URL}/skill/${userId}`, {
        skills: updatedSkills,
        skillLevels: updatedSkillLevels,
      });

      setSkills(updatedSkills);
      setSkillLevels(updatedSkillLevels);
      updateSkills(updatedSkills);
      setSuccess("Skill removed successfully!");
      setShowDeleteModal(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to remove skill. Please try again.");
      console.error("Error removing skill:", error);
    }
  };

  // Start editing a skill
  const startEditingSkill = (skill) => {
    setEditingSkill(skill);
    setEditSkillValue(skill);
    inputRef.current?.focus();
  };

  // Save edited skill
  const saveEditedSkill = async () => {
    if (!editSkillValue.trim()) {
      setError("Skill name cannot be empty");
      return;
    }

    if (
      editSkillValue !== editingSkill &&
      skills.includes(editSkillValue.trim())
    ) {
      setError("This skill already exists");
      return;
    }

    try {
      const updatedSkills = skills.map((skill) =>
        skill === editingSkill ? editSkillValue.trim() : skill
      );

      // Handle skill level mapping if the name changed
      const updatedSkillLevels = { ...skillLevels };
      if (editingSkill !== editSkillValue.trim()) {
        updatedSkillLevels[editSkillValue.trim()] =
          updatedSkillLevels[editingSkill];
        delete updatedSkillLevels[editingSkill];
      }

      await axios.post(`/skill/${userId}`, {
        skills: updatedSkills,
        skillLevels: updatedSkillLevels,
      });

      setSkills(updatedSkills);
      setSkillLevels(updatedSkillLevels);
      setEditingSkill(null);
      setEditSkillValue("");
      setSuccess("Skill updated successfully!");
      updateSkills(updatedSkills);

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to update skill. Please try again.");
      console.error("Error updating skill:", error);
    }
  };

  // Update skill level
  const updateSkillLevel = async (skill, level) => {
    try {
      const updatedSkillLevels = { ...skillLevels, [skill]: level };
      await axios.post(`${import.meta.env.VITE_API_URL}/skill/${userId}`, {
        skills,
        skillLevels: updatedSkillLevels,
      });
      setSkillLevels(updatedSkillLevels);
      setSuccess("Skill level updated!");

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError("Failed to update skill level");
      console.error("Error updating skill level:", error);
    }
  };

  // Handle skill suggestion click
  const handleSuggestionClick = (suggestion) => {
    setNewSkill(suggestion);
    setSkillSuggestions([]);
  };

  // Handle key press for quick submission
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && newSkill.trim()) {
      handleAddSkill();
    }
  };

  // Skill level indicators
  const renderSkillLevel = (skill) => {
    const level = skillLevels[skill] || 1;
    return (
      <div className="skill-level-indicator">
        {[1, 2, 3, 4, 5].map((lvl) => (
          <span
            key={lvl}
            className={`level-dot ${level >= lvl ? "active" : ""}`}
            onClick={() => updateSkillLevel(skill, lvl)}
          />
        ))}
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{getSkillLevelDescription(level)}</Tooltip>}
        >
          <span className="level-text ms-2">{level}/5</span>
        </OverlayTrigger>
      </div>
    );
  };

  const getSkillLevelDescription = (level) => {
    const descriptions = {
      1: "Novice - Basic understanding",
      2: "Beginner - Limited experience",
      3: "Competent - Can work independently",
      4: "Proficient - Can teach others",
      5: "Expert - Recognized authority",
    };
    return descriptions[level] || "No level set";
  };

  return (
    <motion.div
      className="skill-section p-4 rounded-3 shadow-sm bg-white"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">
          <FiAward className="me-2" />
          My Skills
        </h3>
        <Badge bg="light" text="dark" pill>
          {skills.length} skills
        </Badge>
      </div>

      {/* Success/Error Toasts */}
      <ToastContainer position="top-end" className="p-3">
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Toast
                onClose={() => setSuccess(null)}
                show={!!success}
                delay={3000}
                autohide
                bg="success"
              >
                <Toast.Body className="text-white">{success}</Toast.Body>
              </Toast>
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Toast
                onClose={() => setError(null)}
                show={!!error}
                delay={5000}
                autohide
                bg="danger"
              >
                <Toast.Body className="text-white">{error}</Toast.Body>
              </Toast>
            </motion.div>
          )}
        </AnimatePresence>
      </ToastContainer>

      {loading ? (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading your skills...</p>
        </div>
      ) : (
        <>
          {/* Skills List */}
          <div className="mb-4">
            {skills.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">You haven't added any skills yet.</p>
                <p className="text-muted">
                  Start by adding your first skill below!
                </p>
              </div>
            ) : (
              <Row className="g-3">
                {skills.map((skill, index) => (
                  <Col key={index} xs={12} sm={6} lg={4}>
                    <motion.div
                      className="skill-card p-3 border rounded-3 h-100"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        {editingSkill === skill ? (
                          <Form.Control
                            ref={inputRef}
                            type="text"
                            value={editSkillValue}
                            onChange={(e) => setEditSkillValue(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && saveEditedSkill()
                            }
                            className="me-2"
                          />
                        ) : (
                          <h5 className="mb-0">{skill}</h5>
                        )}
                        <div className="skill-actions">
                          {editingSkill === skill ? (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={saveEditedSkill}
                                className="me-1"
                              >
                                <FiCheck />
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => setEditingSkill(null)}
                              >
                                <FiX />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => startEditingSkill(skill)}
                                className="me-1"
                              >
                                <FiEdit2 />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setSkillToDelete(skill);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <FiTrash2 />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {renderSkillLevel(skill)}
                    </motion.div>
                  </Col>
                ))}
              </Row>
            )}
          </div>

          {/* Add Skill Section */}
          <div className="add-skill-section mt-4 pt-3 border-top">
            <h5 className="mb-3">
              <FiPlus className="me-2" />
              Add New Skill
            </h5>

            <div className="position-relative">
              <Form.Group>
                <div className="input-group">
                  <span className="input-group-text">
                    <FiSearch />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Search for skills to add..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    variant="primary"
                    onClick={handleAddSkill}
                    disabled={isAddingSkill || !newSkill.trim()}
                  >
                    {isAddingSkill ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </Form.Group>

              {/* Skill Suggestions */}
              {skillSuggestions.length > 0 && (
                <motion.div
                  className="suggestions-dropdown shadow-sm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <ListGroup>
                    {skillSuggestions.map((suggestion, index) => (
                      <ListGroup.Item
                        key={index}
                        action
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="d-flex justify-content-between align-items-center"
                      >
                        {suggestion}
                        <Badge bg="light" text="dark" pill>
                          Popular
                        </Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </motion.div>
              )}
            </div>

            <p className="text-muted mt-2 small">
              Start typing to see suggestions. Add skills that represent your
              expertise.
            </p>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to remove the skill "{skillToDelete}"? This
          action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => handleRemoveSkill(skillToDelete)}
          >
            Remove Skill
          </Button>
        </Modal.Footer>
      </Modal>
    </motion.div>
  );
};

export default SkillSection;
