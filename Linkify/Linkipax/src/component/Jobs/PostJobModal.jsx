import React, { useState } from "react";
import { Modal, Form, Button, Row, Col, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const PostJobModal = ({ onClose, onJobPosted }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
    salary: "",
    experience: "",
    skills: "",
    email: "",
    phone: "",
    website: "",
    jobType: "fulltime",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Simple client-side validation
    if (
      !formData.title.trim() ||
      !formData.company.trim() ||
      !formData.location.trim() ||
      !formData.description.trim() ||
      !formData.salary.trim() ||
      !formData.experience.trim() ||
      !formData.skills.trim() ||
      !formData.email.trim()
    ) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      // Split skills by comma
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const payload = {
        ...formData,
        skills: skillsArray,
      };

      const response = await axios.post("/jobs/JobsPost", payload);
      setSuccess("Job posted successfully!");
      if (onJobPosted) {
        onJobPosted();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error posting job:", err);
      setError(
        err.response?.data?.message ||
          "Failed to post job. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={true} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton style={{ background: "var(--card-bg)", color: "var(--text-primary)" }}>
        <Modal.Title>Post a New Job Opportunity</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ background: "var(--card-bg)", color: "var(--text-primary)" }}>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="title">
                <Form.Label>Job Title *</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  placeholder="e.g. Senior Software Engineer"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="company">
                <Form.Label>Company Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="company"
                  placeholder="e.g. Google"
                  value={formData.company}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="location">
                <Form.Label>Location *</Form.Label>
                <Form.Control
                  type="text"
                  name="location"
                  placeholder="e.g. Mountain View, CA (or Remote)"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="jobType">
                <Form.Label>Job Type *</Form.Label>
                <Form.Select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  required
                >
                  <option value="fulltime">Full-time</option>
                  <option value="parttime">Part-time</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="salary">
                <Form.Label>Salary Range *</Form.Label>
                <Form.Control
                  type="text"
                  name="salary"
                  placeholder="e.g. $120k - $150k"
                  value={formData.salary}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="experience">
                <Form.Label>Experience Required *</Form.Label>
                <Form.Control
                  type="text"
                  name="experience"
                  placeholder="e.g. 3+ years"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="skills">
            <Form.Label>Skills (Comma-separated) *</Form.Label>
            <Form.Control
              type="text"
              name="skills"
              placeholder="e.g. React, Node.js, TypeScript, MongoDB"
              value={formData.skills}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Job Description *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="description"
              placeholder="Provide a detailed description of the role, responsibilities, and qualifications..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <h5 className="mt-4 mb-3 border-bottom pb-2">Contact details</h5>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>Contact Email *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  placeholder="careers@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="phone">
                <Form.Label>Contact Phone</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="website">
            <Form.Label>Company Website</Form.Label>
            <Form.Control
              type="url"
              name="website"
              placeholder="https://company.com"
              value={formData.website}
              onChange={handleChange}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Posting...
                </>
              ) : (
                "Post Job"
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default PostJobModal;