import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Container, Row, Col, Tabs, Tab, Card, Button, Spinner, Alert } from "react-bootstrap";
import { FiUser, FiBriefcase, FiFileText, FiMapPin, FiClock, FiDollarSign } from "react-icons/fi";
import axios from "axios";
import NavbarComponent from "../navbar/Navbar";
import "./SearchPage.css";

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState({ users: [], posts: [], jobs: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResults = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch search results. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [query]);

  return (
    <>
      <NavbarComponent />
      <Container className="search-results-container py-4">
        <Row className="mb-4">
          <Col>
            <h2 className="search-title">
              Search Results for <span className="query-highlight">"{query}"</span>
            </h2>
            <p className="text-muted">
              Found {results.users.length} people, {results.jobs.length} jobs, and {results.posts.length} posts
            </p>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Searching Linkipax...</p>
          </div>
        ) : (
          <Tabs defaultActiveKey="all" id="search-tabs" className="custom-search-tabs mb-4">
            <Tab
              eventKey="all"
              title={`All (${results.users.length + results.jobs.length + results.posts.length})`}
            >
              <Row>
                <Col lg={8}>
                  {results.users.length > 0 && (
                    <div className="search-section-preview mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3>People</h3>
                        {results.users.length > 3 && <span className="text-muted">Showing top 3</span>}
                      </div>
                      <div className="people-list">
                        {results.users.slice(0, 3).map((user) => (
                          <UserResultCard key={user._id} user={user} />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.jobs.length > 0 && (
                    <div className="search-section-preview mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3>Jobs</h3>
                        {results.jobs.length > 3 && <span className="text-muted">Showing top 3</span>}
                      </div>
                      <div className="jobs-list">
                        {results.jobs.slice(0, 3).map((job) => (
                          <JobResultCard key={job._id} job={job} />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.posts.length > 0 && (
                    <div className="search-section-preview mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h3>Posts</h3>
                        {results.posts.length > 3 && <span className="text-muted">Showing top 3</span>}
                      </div>
                      <div className="posts-list">
                        {results.posts.slice(0, 3).map((post) => (
                          <PostResultCard key={post._id} post={post} />
                        ))}
                      </div>
                    </div>
                  )}

                  {results.users.length === 0 &&
                    results.jobs.length === 0 &&
                    results.posts.length === 0 && (
                      <div className="text-center py-5">
                        <h4>No results found for "{query}"</h4>
                        <p className="text-muted">Try checking for typos or using broader keywords.</p>
                      </div>
                    )}
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="people" title={`People (${results.users.length})`}>
              <Row>
                <Col lg={8}>
                  {results.users.length > 0 ? (
                    <div className="people-list">
                      {results.users.map((user) => (
                        <UserResultCard key={user._id} user={user} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <h4>No people found matching "{query}"</h4>
                    </div>
                  )}
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="jobs" title={`Jobs (${results.jobs.length})`}>
              <Row>
                <Col lg={8}>
                  {results.jobs.length > 0 ? (
                    <div className="jobs-list">
                      {results.jobs.map((job) => (
                        <JobResultCard key={job._id} job={job} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <h4>No jobs found matching "{query}"</h4>
                    </div>
                  )}
                </Col>
              </Row>
            </Tab>

            <Tab eventKey="posts" title={`Posts (${results.posts.length})`}>
              <Row>
                <Col lg={8}>
                  {results.posts.length > 0 ? (
                    <div className="posts-list">
                      {results.posts.map((post) => (
                        <PostResultCard key={post._id} post={post} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <h4>No posts found matching "{query}"</h4>
                    </div>
                  )}
                </Col>
              </Row>
            </Tab>
          </Tabs>
        )}
      </Container>
    </>
  );
};

const UserResultCard = ({ user }) => {
  return (
    <Card className="search-result-card mb-3 p-3">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <img
            src={user.profilePicture || "/uploads/default-avatar.png"}
            alt={user.name || user.username}
            className="search-user-avatar"
            onError={(e) => {
              e.target.src = "/uploads/default-avatar.png";
            }}
          />
          <div>
            <h4 className="m-0">
              <Link to={`/profile-view/${user._id}`} className="search-link">
                {user.name || user.username}
              </Link>
            </h4>
            <p className="text-muted m-0 small">@{user.username}</p>
            {user.jobTitle && (
              <p className="m-0 text-secondary small">
                {user.jobTitle} {user.company ? `at ${user.company}` : ""}
              </p>
            )}
            {user.location && (
              <p className="m-0 text-muted small">
                <FiMapPin size={12} className="me-1" />
                {user.location}
              </p>
            )}
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to={`/profile-view/${user._id}`} className="btn btn-outline-primary btn-sm">
            View Profile
          </Link>
        </div>
      </div>
    </Card>
  );
};

const JobResultCard = ({ job }) => {
  return (
    <Card className="search-result-card mb-3 p-3">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <h4 className="m-0">
            <Link to={`/jobs/${job._id}`} className="search-link">
              {job.Title}
            </Link>
          </h4>
          <p className="text-primary m-0 small font-weight-bold">{job.Company}</p>
          <div className="d-flex gap-3 text-muted small mt-2 flex-wrap">
            <span>
              <FiMapPin size={12} className="me-1" />
              {job.Location}
            </span>
            <span>
              <FiBriefcase size={12} className="me-1" />
              {job.Type}
            </span>
            <span>
              <FiDollarSign size={12} className="me-1" />
              {job.Salary}
            </span>
          </div>
          {job.Description && (
            <p className="m-0 mt-2 text-secondary small text-truncate-custom">
              {job.Description.substring(0, 150)}...
            </p>
          )}
        </div>
        <Link to={`/jobs/${job._id}`} className="btn btn-primary btn-sm">
          View details
        </Link>
      </div>
    </Card>
  );
};

const PostResultCard = ({ post }) => {
  const author = post.createdBy || {};
  return (
    <Card className="search-result-card mb-3 p-3">
      <div className="d-flex align-items-center gap-2 mb-2">
        <img
          src={author.profilePicture || "/uploads/default-avatar.png"}
          alt={author.name || author.username}
          className="search-post-avatar"
          onError={(e) => {
            e.target.src = "/uploads/default-avatar.png";
          }}
        />
        <div>
          <h5 className="m-0 small">
            <Link to={`/profile-view/${author._id}`} className="search-link">
              {author.name || author.username}
            </Link>
          </h5>
          <p className="m-0 text-muted extra-small">
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      {post.title && <h4 className="post-search-title mb-1">{post.title}</h4>}
      <p className="post-search-content m-0 small text-secondary">
        {post.content.length > 200 ? post.content.substring(0, 200) + "..." : post.content}
      </p>
      {post.tags && post.tags.length > 0 && (
        <div className="post-tags mt-2">
          {post.tags.map((tag) => (
            <span key={tag} className="tag-badge me-1 small text-primary">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
};

export default SearchPage;
