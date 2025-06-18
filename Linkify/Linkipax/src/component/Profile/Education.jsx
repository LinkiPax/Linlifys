import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  Card,
  Row,
  Col,
  Image,
  Button,
  Modal,
  Form,
  Badge,
  Spinner,
  Alert,
  CloseButton,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { motion } from "framer-motion";
import {
  FaGraduationCap,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPlus,
  FaSearch,
  FaTimes,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import "./Education.css";

const Education = ({ userId }) => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [skillSearchResults, setSkillSearchResults] = useState([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentEducationId, setCurrentEducationId] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    collegeName: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    gpa: "",
    description: "",
    skills: "",
    logo: "",
  });

  const fetchEducation = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/education/${userId}`
      );
      setEducation(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching education:", error);
      setError("Failed to load education data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);

  // Search for schools with debounce
  const searchSchools = useCallback(async (query) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const { data } = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/education/search/colleges?query=${query}`
      );
      setSearchResults(data);
    } catch (err) {
      console.error("Error searching schools:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search for skills
  const searchSkills = useCallback(async (query) => {
    if (query.length < 2) {
      setSkillSearchResults([]);
      return;
    }

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/education/search/skills?query=${query}`
      );
      setSkillSearchResults(data);
    } catch (err) {
      console.error("Error searching skills:", err);
      setSkillSearchResults([]);
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "collegeName") {
      setSearchQuery(value);
      const timer = setTimeout(() => {
        searchSchools(value);
      }, 500);
      return () => clearTimeout(timer);
    }
  };

  const handleSkillInputChange = (e) => {
    const value = e.target.value;
    setSkillSearchQuery(value);
    const timer = setTimeout(() => {
      searchSkills(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const selectSchool = (school) => {
    setSelectedSchool(school);
    setFormData((prev) => ({
      ...prev,
      collegeName: school.name,
      logo: school.logo,
    }));
    setSearchResults([]);
  };

  const selectSkill = (skill) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setFormData((prev) => ({
        ...prev,
        skills: [...selectedSkills, skill].join(", "),
      }));
    }
    setSkillSearchQuery("");
    setSkillSearchResults([]);
  };

  const removeSkill = (skillToRemove) => {
    const updatedSkills = selectedSkills.filter(
      (skill) => skill !== skillToRemove
    );
    setSelectedSkills(updatedSkills);
    setFormData((prev) => ({
      ...prev,
      skills: updatedSkills.join(", "),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/upload`,
        formData
      );

      setFormData((prev) => ({
        ...prev,
        logo: response.data.secure_url,
      }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      setError("Failed to upload logo. Please try again.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const validateForm = () => {
    if (!formData.collegeName) {
      setError("School name is required");
      return false;
    }
    if (!formData.degree) {
      setError("Degree is required");
      return false;
    }
    if (!formData.startDate) {
      setError("Start date is required");
      return false;
    }
    if (
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      setError("End date cannot be before start date");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        skills: selectedSkills.join(", "),
      };

      let response;
      if (editMode) {
        response = await axios.put(
          `${import.meta.env.VITE_API_URL}/education/${currentEducationId}`,
          payload
        );
        setEducation(
          education.map((edu) =>
            edu._id === currentEducationId ? response.data : edu
          )
        );
        setToastMessage("Education updated successfully");
      } else {
        response = await axios.post(
          `${import.meta.env.VITE_API_URL}/education/${userId}`,
          payload
        );
        setEducation([...education, response.data]);
        setToastMessage("Education added successfully");
      }

      setShowToast(true);
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving education:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save education. Please try again."
      );
    }
  };

  const handleEdit = (edu) => {
    setFormData({
      collegeName: edu.collegeName,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || "",
      startDate: edu.startDate.split("T")[0],
      endDate: edu.endDate ? edu.endDate.split("T")[0] : "",
      gpa: edu.gpa || "",
      description: edu.description || "",
      skills: edu.skills || "",
      logo: edu.logo || "",
    });
    setSelectedSkills(
      edu.skills ? edu.skills.split(",").map((s) => s.trim()) : []
    );
    setSelectedSchool({
      name: edu.collegeName,
      logo: edu.logo,
    });
    setCurrentEducationId(edu._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this education record?")
    ) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/education/${id}`);
        setEducation(education.filter((edu) => edu._id !== id));
        setToastMessage("Education deleted successfully");
        setShowToast(true);
      } catch (err) {
        console.error("Error deleting education:", err);
        setError("Failed to delete education. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      collegeName: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
      skills: "",
      logo: "",
    });
    setSelectedSchool(null);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedSkills([]);
    setSkillSearchQuery("");
    setSkillSearchResults([]);
    setEditMode(false);
    setCurrentEducationId(null);
    setError(null);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  if (loading && education.length === 0) {
    return (
      <div className="education-section">
        <h2 className="section-title">Education</h2>
        <div className="d-flex justify-content-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <section className="education-section py-3">
      <div className="container">
        <ToastContainer position="top-end" className="p-3">
          <Toast
            onClose={() => setShowToast(false)}
            show={showToast}
            delay={3000}
            autohide
            bg="success"
          >
            <Toast.Body className="text-white">{toastMessage}</Toast.Body>
          </Toast>
        </ToastContainer>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="section-title mb-0">
              <FaGraduationCap className="me-2" />
              Education Journey
            </h2>
          </motion.div>
          <Button
            variant="primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="add-button"
          >
            <FaPlus className="me-1" /> Add Education
          </Button>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        {education.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="education-timeline"
          >
            {education.map((edu, index) => (
              <motion.div
                key={edu._id}
                variants={itemVariants}
                className={`timeline-item ${
                  index % 2 === 0 ? "left" : "right"
                }`}
              >
                <Card className="education-card h-100 shadow-sm">
                  <Card.Body>
                    <Row className="g-4 align-items-center">
                      <Col xs={12} md={3} className="text-center">
                        <div className="education-logo-container">
                          <Image
                            src={edu.logo || "https://via.placeholder.com/150"}
                            roundedCircle
                            className="education-logo"
                            alt={edu.collegeName}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/150";
                            }}
                          />
                        </div>
                      </Col>
                      <Col xs={12} md={9}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <Card.Title>{edu.collegeName}</Card.Title>
                            {edu.university && (
                              <Card.Subtitle className="mb-2 text-muted">
                                {edu.university}
                              </Card.Subtitle>
                            )}
                          </div>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEdit(edu)}
                              aria-label="Edit"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(edu._id)}
                              aria-label="Delete"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2 mb-2">
                          <Badge bg="info">{edu.degree}</Badge>
                          {edu.fieldOfStudy && (
                            <Badge bg="secondary">{edu.fieldOfStudy}</Badge>
                          )}
                          {edu.collegeType && (
                            <Badge bg="light" text="dark">
                              {edu.collegeType}
                            </Badge>
                          )}
                        </div>
                        <div className="d-flex align-items-center text-muted mb-2">
                          <FaCalendarAlt className="me-2" />
                          {new Date(edu.startDate).toLocaleDateString()} -{" "}
                          {edu.endDate
                            ? new Date(edu.endDate).toLocaleDateString()
                            : "Present"}
                        </div>
                        {edu.state && (
                          <div className="d-flex align-items-center text-muted mb-2">
                            <FaMapMarkerAlt className="me-2" />
                            {edu.district && `${edu.district}, `}
                            {edu.state}
                          </div>
                        )}
                        {edu.description && (
                          <Card.Text className="mt-2">
                            {edu.description}
                          </Card.Text>
                        )}
                        {edu.skills && (
                          <div className="mt-2">
                            <h6>Skills:</h6>
                            <div className="d-flex flex-wrap gap-1">
                              {edu.skills.split(",").map((skill, i) => (
                                <Badge
                                  key={i}
                                  bg="light"
                                  text="dark"
                                  className="text-nowrap"
                                >
                                  {skill.trim()}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <div className="empty-state">
              <FaGraduationCap size={48} className="mb-3 text-muted" />
              <h4>No education data available</h4>
              <p className="text-muted">
                Add your education history to showcase your academic journey
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="mt-3"
              >
                <FaPlus className="me-1" /> Add Education
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Education Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          resetForm();
        }}
        size="lg"
        aria-labelledby="education-modal-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="education-modal-title">
            {editMode ? "Edit Education" : "Add Education"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {/* Logo Upload */}
            <Form.Group className="mb-3">
              <Form.Label>Institution Logo</Form.Label>
              <div className="d-flex align-items-center">
                {(formData.logo || selectedSchool?.logo) && (
                  <Image
                    src={formData.logo || selectedSchool?.logo}
                    width={80}
                    height={80}
                    roundedCircle
                    className="me-3 border"
                    style={{ objectFit: "cover" }}
                    alt="School logo"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/80";
                    }}
                  />
                )}
                <div>
                  <Button
                    variant="outline-secondary"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingLogo}
                    aria-label="Upload logo"
                  >
                    {uploadingLogo ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Uploading...
                      </>
                    ) : formData.logo ? (
                      "Change Logo"
                    ) : (
                      "Upload Logo"
                    )}
                  </Button>
                  <Form.Text className="d-block">
                    Upload a square logo for best results
                  </Form.Text>
                  <Form.Control
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>School Name</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  name="collegeName"
                  value={formData.collegeName}
                  onChange={handleInputChange}
                  placeholder="Search for your school..."
                  required
                  aria-label="School name"
                />
                <FaSearch className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted" />
                {isSearching && (
                  <div className="position-absolute top-50 end-0 translate-middle-y me-4">
                    <Spinner animation="border" size="sm" />
                  </div>
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="search-results mt-2 border rounded">
                  {searchResults.map((school, index) => (
                    <div
                      key={index}
                      className="search-result-item p-2 border-bottom cursor-pointer hover-bg"
                      onClick={() => selectSchool(school)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && selectSchool(school)
                      }
                      tabIndex={0}
                      role="button"
                      aria-label={`Select ${school.college}`}
                    >
                      <div className="d-flex align-items-center">
                        {school.logo && (
                          <Image
                            src={school.logo}
                            width={30}
                            height={30}
                            className="me-2"
                            roundedCircle
                            alt=""
                          />
                        )}
                        <div>
                          <div className="fw-bold">{school.college}</div>
                          <small className="text-muted">
                            {school.university}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Degree</Form.Label>
                  <Form.Control
                    type="text"
                    name="degree"
                    value={formData.degree}
                    onChange={handleInputChange}
                    placeholder="e.g. Bachelor of Science"
                    required
                    aria-label="Degree"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Field of Study</Form.Label>
                  <Form.Control
                    type="text"
                    name="fieldOfStudy"
                    value={formData.fieldOfStudy}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science"
                    aria-label="Field of study"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    aria-label="Start date"
                    max={formData.endDate || undefined}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date (or expected)</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    aria-label="End date"
                    min={formData.startDate || undefined}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of your studies, achievements, etc."
                aria-label="Description"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Skills Gained</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  value={skillSearchQuery}
                  onChange={handleSkillInputChange}
                  placeholder="Search and add skills..."
                  aria-label="Search skills"
                />
                {skillSearchResults.length > 0 && (
                  <div className="search-results mt-2 border rounded">
                    {skillSearchResults.map((skill, index) => (
                      <div
                        key={index}
                        className="search-result-item p-2 border-bottom cursor-pointer hover-bg"
                        onClick={() => selectSkill(skill)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && selectSkill(skill)
                        }
                        tabIndex={0}
                        role="button"
                        aria-label={`Add skill ${skill}`}
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedSkills.length > 0 && (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {selectedSkills.map((skill, index) => (
                    <Badge
                      key={index}
                      pill
                      bg="light"
                      text="dark"
                      className="d-flex align-items-center skill-badge"
                    >
                      {skill}
                      <CloseButton
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSkill(skill);
                        }}
                        className="ms-2"
                        style={{ fontSize: "0.6rem" }}
                        aria-label={`Remove skill ${skill}`}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </Form.Group>

            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}

            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                aria-label={editMode ? "Save changes" : "Add education"}
              >
                {editMode ? "Save Changes" : "Save Education"}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default Education;
