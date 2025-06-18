import React, { useState, useEffect } from "react";
import axios from "axios";
import { Spinner, Alert, Card, Row, Col, Button } from "react-bootstrap";
import "./TrendingSection.css";

const TrendingSection = () => {
  const [googleTrends, setGoogleTrends] = useState([]);
  const [githubTrends, setGithubTrends] = useState([]);
  const [newsTrends, setNewsTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visibleTrends, setVisibleTrends] = useState(5);

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/external/trending`
        );
        setGoogleTrends(response.data.googleTrends || []);
        setGithubTrends(response.data.githubTrends || []);
        setNewsTrends(response.data.newsTrends || []);
      } catch (error) {
        console.error("Error fetching trending data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, []);

  const handleShowMore = () => {
    setVisibleTrends((prev) => prev + 5);
  };

  if (loading) {
    return (
      <div className="trending-section-loading text-center">
        <Spinner animation="border" variant="primary" />
        <p>Loading trending data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="trending-section-error text-center">
        Failed to load trending data. Please try again later.
      </Alert>
    );
  }

  return (
    <div className="trending-section p-4 mt-4">
      <h2 className="mb-5 text-center display-5">🔥 Today's Top Trends</h2>

      {/* Google Trends */}
      <div className="trending-category mb-5">
        <h3 className="mb-4">🔍 Google Trends</h3>
        {googleTrends.length > 0 ? (
          <Row>
            {googleTrends.slice(0, visibleTrends).map((trend, index) => (
              <Col key={index} xs={12} md={6} lg={4} className="mb-4">
                <Card className="trend-card">
                  <Card.Body>
                    <Card.Title>
                      <a
                        href={`https://trends.google.com${trend.exploreLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {trend.query}
                      </a>
                    </Card.Title>
                    <Card.Text>
                      <small className="text-muted">
                        Searches: {trend.traffic || "N/A"}
                      </small>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <p>No Google trends available.</p>
        )}
        {googleTrends.length > visibleTrends && (
          <div className="text-center">
            <Button variant="outline-primary" onClick={handleShowMore}>
              Show More
            </Button>
          </div>
        )}
      </div>

      {/* GitHub Trends */}
      <div className="trending-category mb-5">
        <h3 className="mb-4">🚀 GitHub Trends</h3>
        {githubTrends.length > 0 ? (
          <Row>
            {githubTrends.slice(0, visibleTrends).map((repo, index) => (
              <Col key={index} xs={12} md={6} lg={4} className="mb-4">
                <Card className="trend-card">
                  <Card.Body>
                    <Card.Title>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {repo.name}
                      </a>
                    </Card.Title>
                    <Card.Text>
                      <span className="badge bg-secondary me-2">
                        {repo.language || "Unknown"}
                      </span>
                      <span className="text-muted">⭐ {repo.stars}</span>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <p>No GitHub trends available.</p>
        )}
        {githubTrends.length > visibleTrends && (
          <div className="text-center">
            <Button variant="outline-primary" onClick={handleShowMore}>
              Show More
            </Button>
          </div>
        )}
      </div>

      {/* News Trends */}
      <div className="trending-category mb-5">
        <h3 className="mb-4">📰 News Trends</h3>
        {newsTrends.length > 0 ? (
          <Row>
            {newsTrends.slice(0, visibleTrends).map((article, index) => (
              <Col key={index} xs={12} md={6} lg={4} className="mb-4">
                <Card className="trend-card">
                  <Card.Body>
                    <Card.Title>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {article.title}
                      </a>
                    </Card.Title>
                    <Card.Text>
                      <span className="badge bg-info text-dark">
                        Source: {article.source || "Unknown"}
                      </span>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <p>No news trends available.</p>
        )}
        {newsTrends.length > visibleTrends && (
          <div className="text-center">
            <Button variant="outline-primary" onClick={handleShowMore}>
              Show More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingSection;
