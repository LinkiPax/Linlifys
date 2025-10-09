import React, { useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
  Form,
  Button,
  Container,
  Alert,
  ProgressBar,
  Card,
  Image,
  Row,
  Col,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { 
  FiUser, 
  FiUpload, 
  FiCheck, 
  FiAward, 
  FiBriefcase, 
  FiBook,
  FiXCircle,
  FiInfo
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "./PersonalDetails.css";

function PersonalDetails() {
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    jobTitle: "",
    company: "",
  });
  const [profilePicture, setProfilePicture] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  const addToast = (title, message, variant = "info", duration = 5000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, variant }]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      setError("Please select an image file (JPEG, PNG, GIF)");
      addToast("Invalid File", "Please select an image file (JPEG, PNG, GIF)", "danger");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      addToast("File Too Large", "Image size should be less than 5MB", "danger");
      return;
    }

    setError("");
    setPreviewImage(URL.createObjectURL(file));
    uploadImage(file);
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      addToast("Uploading", "Your profile picture is being uploaded", "info");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/upload-profile-pic/${userId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      setProfilePicture(response.data.profilePicture);
      setSuccess("Profile picture uploaded successfully!");
      addToast("Success", "Profile picture uploaded successfully!", "success");
      setIsUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Failed to upload image");
      addToast("Upload Failed", err.response?.data?.message || "Failed to upload image", "danger");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userId) {
      setError("User ID is missing! Redirecting to home...");
      addToast("Error", "User ID is missing! Redirecting to home...", "danger");
      setTimeout(() => navigate("/home"), 3000);
      return;
    }

    try {
      const payload = {
        ...formData,
        profilePicture,
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/user/update-details/${userId}`,
        payload,
        { withCredentials: true }
      );

      setSuccess("Details updated successfully!");
      addToast("Profile Updated", "Your profile has been updated successfully!", "success");
      
      setTimeout(() => navigate(`/home/${userId}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong!");
      addToast("Update Failed", err.response?.data?.message || "Something went wrong!", "danger");
    }
  };

  return (
    <>
      <div className="Personal-background">
        <Container className="Personal-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="Personal-header text-center mb-4"
          >
            <h1 className="Personal-logo">Linkipax</h1>
            <h2 className="Personal-title">Complete Your Profile</h2>
            <p className="Personal-subtitle">Let's get to know you better and build your professional identity</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="Personal-card">
              <Form onSubmit={handleSubmit}>
                <Form.Group className="Personal-form-group text-center">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="Personal-profile-container mb-3 mx-auto"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewImage ? (
                      <Image
                        src={previewImage}
                        roundedCircle
                        className="Personal-profile-preview"
                      />
                    ) : (
                      <div className="Personal-profile-placeholder d-flex flex-column justify-content-center align-items-center">
                        <FiUser size={60} className="Personal-placeholder-icon mb-2" />
                        <small className="Personal-placeholder-text">Click to upload</small>
                      </div>
                    )}
                    
                    {isUploading && (
                      <div className="Personal-upload-overlay d-flex justify-content-center align-items-center">
                        <div className="spinner-border text-light" role="status">
                          <span className="visually-hidden">Uploading...</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="Personal-profile-shine"></div>
                  </motion.div>

                  <Form.Label
                    htmlFor="profile-upload"
                    className="Personal-upload-btn btn rounded-pill d-inline-flex align-items-center"
                  >
                    <FiUpload className="me-2" />
                    {profilePicture ? "Change Picture" : "Upload Picture"}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    id="profile-upload"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="d-none"
                  />

                  {isUploading && (
                    <div className="Personal-progress-container mt-3">
                      <ProgressBar
                        now={uploadProgress}
                        label={`${uploadProgress}%`}
                        className="Personal-progress-bar mt-2"
                        animated
                      />
                      <small className="Personal-progress-text">Uploading your profile picture...</small>
                    </div>
                  )}
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="Personal-form-group mb-3">
                      <Form.Label className="Personal-form-label d-flex align-items-center">
                        <FiUser className="Personal-input-icon me-2" /> Full Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                        className="Personal-form-control py-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="Personal-form-group mb-3">
                      <Form.Label className="Personal-form-label d-flex align-items-center">
                        <FiBriefcase className="Personal-input-icon me-2" /> Job Title
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="Your current position"
                        required
                        className="Personal-form-control py-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="Personal-form-group mb-3">
                  <Form.Label className="Personal-form-label d-flex align-items-center">
                    <FiAward className="Personal-input-icon me-2" /> Company
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Where you work"
                    required
                    className="Personal-form-control py-2"
                  />
                </Form.Group>

                <Form.Group className="Personal-form-group mb-4">
                  <Form.Label className="Personal-form-label d-flex align-items-center">
                    <FiBook className="Personal-input-icon me-2" /> Bio
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself, your skills, and experience..."
                    required
                    className="Personal-form-control py-2"
                  />
                  <Form.Text className="Personal-form-text">
                    This will be visible on your profile
                  </Form.Text>
                </Form.Group>

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    type="submit"
                    className="Personal-submit-btn w-100 py-3 fw-semibold"
                    disabled={isUploading}
                    size="lg"
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FiCheck className="me-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </motion.div>

                {error && (
                  <Alert variant="danger" className="Personal-alert mt-3 d-flex align-items-center">
                    <FiXCircle className="me-2" />
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" className="Personal-alert mt-3 d-flex align-items-center">
                    <FiCheck className="me-2" />
                    {success}
                  </Alert>
                )}
              </Form>
            </Card>
          </motion.div>
        </Container>

        {/* Toast Notifications */}
        <ToastContainer position="top-end" className="Personal-toast-container p-3 position-fixed">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -50, scale: 0.3 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Toast 
                  bg={toast.variant} 
                  onClose={() => removeToast(toast.id)}
                  show={true}
                  delay={5000}
                  autohide
                  className="Personal-toast border-0 shadow-lg mb-2"
                >
                  <Toast.Header className={`Personal-toast-header text-${toast.variant} border-0`}>
                    <strong className="me-auto d-flex align-items-center">
                      {toast.variant === "success" && <FiCheck className="me-2" />}
                      {toast.variant === "danger" && <FiXCircle className="me-2" />}
                      {toast.variant === "info" && <FiInfo className="me-2" />}
                      {toast.title}
                    </strong>
                  </Toast.Header>
                  <Toast.Body className="Personal-toast-body text-dark">
                    {toast.message}
                  </Toast.Body>
                </Toast>
              </motion.div>
            ))}
          </AnimatePresence>
        </ToastContainer>
      </div>
    </>
  );
}

export default PersonalDetails;