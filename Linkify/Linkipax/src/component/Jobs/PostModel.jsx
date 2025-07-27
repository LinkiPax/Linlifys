// PostJobModal.js
import React, { useState } from "react";
import {
  FiX,
  FiBriefcase,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiMail,
  FiPhone,
  FiGlobe,
} from "react-icons/fi";

const PostJobModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    company: "",
    location: "",
    salary: "",
    experience: "",
    skills: "",
    email: "",
    phone: "",
    website: "",
    jobType: "fulltime",
    requirements: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const jobData = {
      ...formData,
      skills: formData.skills.split(",").map((skill) => skill.trim()),
      requirements: formData.requirements
        .split("\n")
        .filter((req) => req.trim() !== ""),
    };
    onSubmit(jobData);
  };

  return (
    <div className="modal-overlay">
      <div className="post-job-modal">
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
        <h2>Post a New Job</h2>
        <form onSubmit={handleSubmit}>
          {/* Form fields here */}
          <div className="form-group">
            <label>
              <FiBriefcase /> Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          {/* Add all other fields similarly */}
          <button type="submit" className="submit-btn">
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostJobModal;
