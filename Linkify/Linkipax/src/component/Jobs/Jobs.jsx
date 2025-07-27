import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiBookmark,
  FiStar,
  FiClock,
  FiMapPin,
  FiDollarSign,
  FiBriefcase,
} from "react-icons/fi";
import { jobs } from "../../component/data/job";
import "./Jobs.css";
import PostJobModal from "./PostJobModal";
export default function Jobs() {
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hackathons, setHackathons] = useState([]);
  const [startups, setStartups] = useState([]);
  const [resources, setResources] = useState([]);

  // Mock data loading
  useEffect(() => {
    // Simulate API calls
    setHackathons([
      {
        id: 1,
        title: "AI Innovation Challenge",
        deadline: "2023-12-15",
        prize: "$50,000",
        participants: 1200,
        tech: ["AI", "ML", "NLP"],
      },
      {
        id: 2,
        title: "Blockchain Hackathon",
        deadline: "2023-11-30",
        prize: "5 ETH",
        participants: 850,
        tech: ["Blockchain", "Smart Contracts"],
      },
      {
        id: 3,
        title: "Climate Tech Solutions",
        deadline: "2024-01-20",
        prize: "$30,000",
        participants: 650,
        tech: ["Sustainability", "Clean Energy"],
      },
    ]);

    setStartups([
      {
        id: 1,
        name: "Neuralink",
        funding: "Series D",
        hiring: true,
        tech: ["AI", "Neuroscience"],
      },
      {
        id: 2,
        name: "QuantumScape",
        funding: "Series C",
        hiring: true,
        tech: ["Batteries", "Energy"],
      },
      {
        id: 3,
        name: "Astra",
        funding: "Series B",
        hiring: false,
        tech: ["Space", "Aerospace"],
      },
    ]);

    setResources([
      {
        id: 1,
        title: "Cracking the Coding Interview",
        type: "Book",
        rating: 4.8,
        reviews: 1245,
        likes: 3200,
      },
      {
        id: 2,
        title: "System Design Primer",
        type: "GitHub Repo",
        rating: 4.9,
        reviews: 890,
        likes: 4500,
      },
      {
        id: 3,
        title: "Frontend Interview Handbook",
        type: "Online Course",
        rating: 4.7,
        reviews: 760,
        likes: 2800,
      },
    ]);
  }, []);

  const filteredJobs = jobs.jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = activeFilter === "all" || 
                         job.type === activeFilter;
    
    return matchesSearch && matchesFilter;
  });


  return (
    <div className="jobs-container">
      {/* Left Sidebar */}
      <div className="jobs-sidebar">
        <div className="search-section">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search jobs, companies, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="advanced-filters">
            <h3>
              <FiFilter /> Filters
            </h3>

            <div className="filter-group">
              <h4>Job Type</h4>
              <div className="filter-options">
                <button
                  className={activeFilter === "all" ? "active" : ""}
                  onClick={() => setActiveFilter("all")}
                >
                  All Jobs
                </button>
                <button
                  className={activeFilter === "fulltime" ? "active" : ""}
                  onClick={() => setActiveFilter("fulltime")}
                >
                  Full-time
                </button>
                <button
                  className={activeFilter === "parttime" ? "active" : ""}
                  onClick={() => setActiveFilter("parttime")}
                >
                  Part-time
                </button>
                <button
                  className={activeFilter === "internship" ? "active" : ""}
                  onClick={() => setActiveFilter("internship")}
                >
                  Internship
                </button>
                <button
                  className={activeFilter === "remote" ? "active" : ""}
                  onClick={() => setActiveFilter("remote")}
                >
                  Remote
                </button>
              </div>
            </div>

            <div className="filter-group">
              <h4>Experience Level</h4>
              <div className="filter-options">
                <button>Entry Level</button>
                <button>Mid Level</button>
                <button>Senior Level</button>
              </div>
            </div>

            <div className="filter-group">
              <h4>Salary Range</h4>
              <div className="filter-options">
                <button>$50k+</button>
                <button>$100k+</button>
                <button>$150k+</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="jobs-main">
        <div className="jobs-header">
          <h2>Latest Job Openings</h2>
          <button onClick={() => setShowModal(true)} className="post-job-btn">
            Post a Job
          </button>
        </div>

        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="jobs-right-sidebar">
        {/* Hackathon Section */}
        <div className="hackathon-section">
          <h3>
            <FiStar /> Featured Hackathons
          </h3>
          <div className="hackathon-carousel">
            {hackathons.map((hackathon) => (
              <div key={hackathon.id} className="hackathon-card">
                <h4>{hackathon.title}</h4>
                <div className="hackathon-details">
                  <span>
                    <FiClock /> Deadline: {hackathon.deadline}
                  </span>
                  <span>
                    <FiDollarSign /> Prize: {hackathon.prize}
                  </span>
                  <span>Participants: {hackathon.participants}</span>
                </div>
                <div className="hackathon-tech">
                  {hackathon.tech.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
                <button className="register-btn">Register Now</button>
              </div>
            ))}
          </div>
        </div>

        {/* Startups Section */}
        <div className="startups-section">
          <h3>
            <FiBriefcase /> Hiring Startups
          </h3>
          <div className="startups-list">
            {startups.map((startup) => (
              <div key={startup.id} className="startup-card">
                <h4>{startup.name}</h4>
                <div className="startup-details">
                  <span>{startup.funding}</span>
                  <span className={startup.hiring ? "hiring" : "not-hiring"}>
                    {startup.hiring ? "Actively Hiring" : "Not Hiring"}
                  </span>
                </div>
                <div className="startup-tech">
                  {startup.tech.map((tech) => (
                    <span key={tech}>{tech}</span>
                  ))}
                </div>
                {startup.hiring && (
                  <button className="view-roles-btn">View Open Roles</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources Section */}
        <div className="resources-section">
          <h3>
            <FiBookmark /> Top Resources
          </h3>
          <div className="resources-list">
            {resources
              .sort((a, b) => b.likes - a.likes)
              .map((resource) => (
                <div key={resource.id} className="resource-card">
                  <h4>{resource.title}</h4>
                  <div className="resource-meta">
                    <span>{resource.type}</span>
                    <div className="resource-rating">
                      <FiStar className="star-icon" />
                      <span>{resource.rating}</span>
                      <span>({resource.reviews} reviews)</span>
                    </div>
                    <div className="resource-likes">
                      ♡ {resource.likes} likes
                    </div>
                  </div>
                  <button className="view-resource-btn">View Resource</button>
                </div>
              ))}
          </div>
        </div>
      </div>

      {showModal && <PostJobModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

const JobCard = ({ job }) => (
  <div className="job-card">
    <div className="job-card-header">
      <div className="job-title">
        <h3>{job.title}</h3>
        <span className="job-type">{job.type}</span>
      </div>
      <button className="save-btn">
        <FiBookmark />
      </button>
    </div>

    <div className="job-company">
      <span className="company-name">{job.company}</span>
      <span className="company-rating">
        <FiStar /> {job.rating}
      </span>
    </div>

    <div className="job-location">
      <FiMapPin /> {job.location}{" "}
      {job.remote && <span className="remote-badge">Remote</span>}
    </div>

    <div className="job-details">
      <span>
        <FiClock /> {job.experience}
      </span>
      <span>
        <FiDollarSign /> {job.salary}
      </span>
      <span>Posted {job.posted}</span>
    </div>

    <div className="job-skills">
      {job.skills.map((skill) => (
        <span key={skill}>{skill}</span>
      ))}
    </div>

    <div className="job-actions">
      <Link to={`/apply/${job.id}`} className="apply-btn">
        Apply Now
      </Link>
      <button className="quick-apply-btn">Quick Apply</button>
    </div>
  </div>
);
