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
} from "react-bootstrap";
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
  const fileInputRef = useRef(null);
  const { userId } = useParams();
  const navigate = useNavigate();

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
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
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
      setIsUploading(false);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Failed to upload image");
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
      setTimeout(() => navigate(`/home/${userId}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <Container className="personal-details-container">
      <div className="text-center mb-4">
        <h1 className="logo">Linkipax</h1>
        <h2>Complete Your Profile</h2>
        <p className="text-muted">Let's get to know you better</p>
      </div>

      <Card className="p-4 shadow-sm">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4 text-center">
            <div className="profile-picture-container mb-3">
              {previewImage ? (
                <Image
                  src={previewImage}
                  roundedCircle
                  className="profile-preview"
                />
              ) : (
                <div className="profile-placeholder">
                  <i
                    className="bi bi-person-circle"
                    style={{ fontSize: "100px" }}
                  ></i>
                </div>
              )}
            </div>

            <Form.Label
              htmlFor="profile-upload"
              className="btn btn-outline-primary"
            >
              {profilePicture
                ? "Change Profile Picture"
                : "Upload Profile Picture"}
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
              <ProgressBar
                now={uploadProgress}
                label={`${uploadProgress}%`}
                className="mt-2"
                animated
              />
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Job Title</Form.Label>
            <Form.Control
              type="text"
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleInputChange}
              placeholder="Your current position"
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Company</Form.Label>
            <Form.Control
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Where you work"
              required
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100 py-2"
            disabled={isUploading}
          >
            {isUploading ? "Processing..." : "Save Profile"}
          </Button>

          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="mt-3">
              {success}
            </Alert>
          )}
        </Form>
      </Card>
    </Container>
  );
}

export default PersonalDetails;
