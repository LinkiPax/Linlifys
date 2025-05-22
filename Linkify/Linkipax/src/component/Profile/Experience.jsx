import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Form,
  Col,
  Row,
  Alert,
  Spinner,
  Modal,
  Badge,
  Container,
  Accordion,
} from "react-bootstrap";
import {
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi"; 
import { format, parseISO } from "date-fns";
import "./Experience.css"; // Create this CSS file for custom styles

const Experience = ({ userId }) => {
  const [experiences, setExperiences] = useState([]);
  const [newExperience, setNewExperience] = useState({
    company: "",
    jobTitle: "",
    startDate: "",
    endDate: "",
    description: "",
    location: "",
    employmentType: "Full-time",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState({
    page: false,
    action: false,  
  });
  const [editExperience, setEditExperience] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [isCurrent, setIsCurrent] = useState(false);

  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading((prev) => ({ ...prev, page: true }));
      try {
        const { data } = await axios.get(
          `http://localhost:5000/experience/${userId}`
        );
        setExperiences(data);
      } catch (error) {
        console.error("Error fetching experiences:", error);
        setError("Failed to load experiences. Please try again later.");
      } finally {
        setLoading((prev) => ({ ...prev, page: false }));
      }
    };

    fetchExperiences();
  }, [userId]);

  const resetForm = () => {
    setNewExperience({
      company: "",
      jobTitle: "",
      startDate: "",
      endDate: "",
      description: "",
      location: "",
      employmentType: "Full-time",
    });
    setError(null);
  };

  const validateExperience = (exp) => {
    if (!exp.company || !exp.jobTitle || !exp.startDate) {
      setError(
        "Please fill in all required fields (Company, Job Title, Start Date)."
      );
      return false;
    }

    if (exp.endDate && exp.endDate < exp.startDate) {
      setError("End date cannot be before start date.");
      return false;
    }

    return true;
  };

  const handleAddExperience = async () => {
    if (!validateExperience(newExperience)) return;

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      const { data } = await axios.post(
        `http://localhost:5000/experience/${userId}`,
        newExperience
      );
      setExperiences([...experiences, data]);
      setSuccessMessage("Experience added successfully!");
      setError(null);
      setShowAddModal(false);
      resetForm();
      setIsCurrent(false);
    } catch (error) {
      console.error("Error adding experience:", error);
      setError(
        error.response?.data?.message || "Failed to add new experience."
      );
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleEditExperience = (experience) => {
    setEditExperience({
      ...experience,
      startDate: format(parseISO(experience.startDate), "yyyy-MM-dd"),
      endDate: experience.endDate
        ? format(parseISO(experience.endDate), "yyyy-MM-dd")
        : "",
    });
    setShowEditModal(true);
  };

  const handleUpdateExperience = async () => {
    if (!validateExperience(editExperience)) return;

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      const { data } = await axios.put(
        `http://localhost:5000/experience/${userId}/${editExperience._id}`,
        editExperience
      );
      setExperiences(
        experiences.map((exp) => (exp._id === data._id ? data : exp))
      );
      setShowEditModal(false);
      setSuccessMessage("Experience updated successfully!");
      setError(null);
    } catch (error) {
      console.error("Error updating experience:", error);
      setError(error.response?.data?.message || "Failed to update experience.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleDeleteExperience = async (id) => {
    if (!window.confirm("Are you sure you want to delete this experience?"))
      return;

    setLoading((prev) => ({ ...prev, action: true }));
    try {
      await axios.delete(`http://localhost:5000/experience/${userId}/${id}`);
      setExperiences(experiences.filter((exp) => exp._id !== id));
      setSuccessMessage("Experience deleted successfully!");
      setError(null);
    } catch (error) {
      console.error("Error deleting experience:", error);
      setError(error.response?.data?.message || "Failed to delete experience.");
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Present";
    return format(parseISO(dateString), "MMM yyyy");
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <Container className="experience-section cont">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="section-title">
          <span className="highlight">Work</span> Experience
        </h2>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="add-btn"
        >
          <FiPlus className="mr-2" /> Add Experience
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage(null)}
        >
          {successMessage}
        </Alert>
      )}

      {loading.page ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading experiences...</p>
        </div>
      ) : experiences.length > 0 ? (
        <Accordion activeKey={activeAccordion} className="experience-list">
          {experiences.map((exp, index) => (
            <Card key={exp._id} className="mb-3 experience-card">
              <Card.Header
                as="div"
                className="d-flex justify-content-between align-items-center"
                onClick={() => toggleAccordion(index)}
              >
                <div>
                  <h5 className="mb-1">{exp.company}</h5>
                  <div className="d-flex flex-wrap align-items-center">
                    <span className="mr-2">{exp.jobTitle}</span>
                    <Badge variant="info" className="mr-2">
                      {exp.employmentType}
                    </Badge>
                    <small className="text-muted">
                      {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                    </small>
                  </div>
                </div>
                {activeAccordion === index ? (
                  <FiChevronUp />
                ) : (
                  <FiChevronDown />
                )}
              </Card.Header>
              <Accordion.Collapse eventKey={index}>
                <Card.Body>
                  {exp.location && (
                    <div className="mb-2">
                      <strong>Location:</strong> {exp.location}
                    </div>
                  )}
                  {exp.description && (
                    <div className="mb-3">
                      <strong>Description:</strong>
                      <p className="mb-0">{exp.description}</p>
                    </div>
                  )}
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleEditExperience(exp)}
                      className="mr-2"
                    >
                      <FiEdit2 /> Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteExperience(exp._id)}
                    >
                      <FiTrash2 /> Delete
                    </Button>
                  </div>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-4 empty-state">
          <img
            src="/images/empty-experience.svg"
            alt="No experiences"
            className="img-fluid mb-3"
            style={{ maxWidth: "200px" }}
          />
          <h4>No experiences added yet</h4>
          <p>Add your first work experience to get started</p>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <FiPlus className="mr-2" /> Add Experience
          </Button>
        </div>
      )}

      {/* Add Experience Modal */}
      <Modal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          resetForm();
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Experience</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="company" className="mb-3">
              <Form.Label>Company *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Google, Microsoft"
                value={newExperience.company}
                onChange={(e) =>
                  setNewExperience({
                    ...newExperience,
                    company: e.target.value,
                  })
                }
                required
              />
            </Form.Group>

            <Form.Group controlId="jobTitle" className="mb-3">
              <Form.Label>Job Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Software Engineer"
                value={newExperience.jobTitle}
                onChange={(e) =>
                  setNewExperience({
                    ...newExperience,
                    jobTitle: e.target.value,
                  })
                }
                required
              />
            </Form.Group>

            <Form.Group controlId="employmentType" className="mb-3">
              <Form.Label>Employment Type</Form.Label>
              <Form.Control
                as="select"
                value={newExperience.employmentType}
                onChange={(e) =>
                  setNewExperience({
                    ...newExperience,
                    employmentType: e.target.value,
                  })
                }
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </Form.Control>
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="startDate">
                  <Form.Label>Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={newExperience.startDate}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        startDate: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="endDate">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newExperience.endDate}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        endDate: e.target.value,
                      })
                    }
                    disabled={isCurrent}
                  />
                </Form.Group>
                <Form.Check
                  type="checkbox"
                  label="I currently work here"
                  checked={isCurrent}
                  onChange={(e) => {
                    setIsCurrent(e.target.checked);
                    if (e.target.checked) {
                      setNewExperience({ ...newExperience, endDate: "" });
                    }
                  }}
                  className="mb-2"
                />

              </Col>
            </Row>

            <Form.Group controlId="location" className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={newExperience.location}
                onChange={(e) =>
                  setNewExperience({
                    ...newExperience,
                    location: e.target.value,
                  })
                }
              />
            </Form.Group>

            <Form.Group controlId="description" className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="Describe your responsibilities and achievements"
                value={newExperience.description}
                onChange={(e) =>
                  setNewExperience({
                    ...newExperience,
                    description: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAddExperience}
            disabled={loading.action}
          >
            {loading.action ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="mr-2"
                />
                Adding...
              </>
            ) : (
              "Add Experience"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Experience Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Experience</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editExperience && (
            <Form>
              <Form.Group controlId="editCompany" className="mb-3">
                <Form.Label>Company *</Form.Label>
                <Form.Control
                  type="text"
                  value={editExperience.company}
                  onChange={(e) =>
                    setEditExperience({
                      ...editExperience,
                      company: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>

              <Form.Group controlId="editJobTitle" className="mb-3">
                <Form.Label>Job Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={editExperience.jobTitle}
                  onChange={(e) =>
                    setEditExperience({
                      ...editExperience,
                      jobTitle: e.target.value,
                    })
                  }
                  required
                />
              </Form.Group>

              <Form.Group controlId="editEmploymentType" className="mb-3">
                <Form.Label>Employment Type</Form.Label>
                <Form.Control
                  as="select"
                  value={editExperience.employmentType}
                  onChange={(e) =>
                    setEditExperience({
                      ...editExperience,
                      employmentType: e.target.value,
                    })
                  }
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </Form.Control>
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="editStartDate">
                    <Form.Label>Start Date *</Form.Label>
                    <Form.Control
                      type="date"
                      value={editExperience.startDate}
                      onChange={(e) =>
                        setEditExperience({
                          ...editExperience,
                          startDate: e.target.value,
                        })
                      }
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="editEndDate">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={editExperience.endDate}
                      onChange={(e) =>
                        setEditExperience({
                          ...editExperience,
                          endDate: e.target.value,
                        })
                      }
                      disabled={!editExperience.endDate}
                    />
                    <Form.Check
                      type="checkbox"
                      label="I currently work here"
                      checked={!editExperience.endDate}
                      onChange={(e) =>
                        setEditExperience({
                          ...editExperience,
                          endDate: e.target.checked
                            ? ""
                            : new Date().toISOString().split("T")[0],
                        })
                      }
                      className="mt-2"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group controlId="editLocation" className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  value={editExperience.location}
                  onChange={(e) =>
                    setEditExperience({
                      ...editExperience,
                      location: e.target.value,
                    })
                  }
                />
              </Form.Group>

              <Form.Group controlId="editDescription" className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={editExperience.description}
                  onChange={(e) =>
                    setEditExperience({
                      ...editExperience,
                      description: e.target.value,
                    })
                  }
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdateExperience}
            disabled={loading.action}
          >
            {loading.action ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="mr-2"
                />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Experience;
