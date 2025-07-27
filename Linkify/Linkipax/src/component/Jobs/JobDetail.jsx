// JobDetail.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiBriefcase,
  FiMail,
  FiPhone,
  FiGlobe,
} from "react-icons/fi";

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`/api/getPost/${id}`);
        setJob(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  if (loading) return <div className="loading">Loading job details...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!job) return <div className="not-found">Job not found</div>;

  return (
    <div className="job-detail-container">
      <div className="job-header">
        <h1>{job.Title}</h1>
        <h2>{job.Company}</h2>
        <div className="job-meta">
          <span>
            <FiBriefcase /> {job.Type}
          </span>
          <span>
            <FiMapPin /> {job.Location}
          </span>
          <span>
            <FiDollarSign /> {job.Salary}
          </span>
          <span>
            <FiClock /> {job.Experience}
          </span>
        </div>
      </div>

      <div className="job-content">
        <div className="job-description">
          <h3>Job Description</h3>
          <p>{job.Description}</p>
        </div>

        <div className="job-requirements">
          <h3>Requirements</h3>
          <ul>
            {job.Requirements &&
              job.Requirements.map((req, index) => <li key={index}>{req}</li>)}
          </ul>
        </div>

        <div className="job-skills">
          <h3>Skills</h3>
          <div className="skills-list">
            {job.Skills.map((skill, index) => (
              <span key={index} className="skill-tag">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="job-contact">
          <h3>Contact Information</h3>
          <p>
            <FiMail /> {job.Email}
          </p>
          {job.Phone && (
            <p>
              <FiPhone /> {job.Phone}
            </p>
          )}
          {job.Website && (
            <p>
              <FiGlobe />{" "}
              <a href={job.Website} target="_blank" rel="noopener noreferrer">
                {job.Website}
              </a>
            </p>
          )}
        </div>

        <div className="job-actions">
          <button className="apply-btn">Apply Now</button>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
