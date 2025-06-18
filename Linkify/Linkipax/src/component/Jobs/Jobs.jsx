import React, { useState } from "react";
import { Link } from "react-router-dom";
import HackathonCard from "../Jobs/HackathonCard";
import UploadResumeCard from "../Jobs/UploadResumeCard";
import JobSearchBar from "../Jobs/JobSearchBar";
import PostJobModal from "../Jobs/PostJobModal";
import jobs from "../data/job.json";
import "./Jobs.css";

export default function Jobs() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="jobs-page">
      <JobSearchBar />

      <div className="jobs-actions">
        <button onClick={() => setShowModal(true)} className="post-job-btn">
          Post a Job
        </button>
      </div>

      <div className="jobs-grid">
        {jobs.jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Embedded Components */}
      <div className="preview-section">
        <HackathonCard />
        <UploadResumeCard />
      </div>

      {showModal && <PostJobModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

const JobCard = ({ job }) => (
  <div className="job-card">
    <h3>{job.title}</h3>
    <p>
      {job.company} • {job.location}
    </p>
    <div className="skills">
      {job.skills.map((skill) => (
        <span key={skill}>{skill}</span>
      ))}
    </div>
    <Link to={`/apply/${job.id}`} className="apply-btn">
      Apply
    </Link>
  </div>
);
