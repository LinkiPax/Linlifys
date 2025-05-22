import React, { useEffect, useState } from "react";
import { Card, Spinner, Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiTrendingUp,
  FiHash,
  FiMoreVertical,
  FiExternalLink,
} from "react-icons/fi";
import "./TrendingTopicsCard.css";
import { Button } from "react-bootstrap";

const TrendingTopicsCard = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const navigate = useNavigate();

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:5000/api/trending-topics"
      );
      setTopics(response.data);
    } catch (err) {
      setError("Failed to load trending topics. Please try again later.");
      console.error("Error fetching trending topics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic) => {
    navigate(`/search?topic=${encodeURIComponent(topic.title)}`);
  };

  const toggleExpandTopic = (topicId) => {
    setExpandedTopic(expandedTopic === topicId ? null : topicId);
  };

  const getTrendBadge = (trend) => {
    if (trend > 50) return "danger";
    if (trend > 30) return "warning";
    if (trend > 10) return "primary";
    return "secondary";
  };

  useEffect(() => {
    fetchTrendingTopics();
  }, []);

  return (
    <Card className="trending-topics-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <FiTrendingUp className="trending-icon me-2" />
          <h5 className="mb-0">Trending Now</h5>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={fetchTrendingTopics}
          aria-label="Refresh trends"
        >
          Refresh
        </Button>
      </Card.Header>

      <Card.Body className="p-0">
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading trending topics...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : topics.length > 0 ? (
          <div className="topics-list">
            <AnimatePresence>
              {topics.map((topic) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`topic-item ${
                      expandedTopic === topic.id ? "expanded" : ""
                    }`}
                  >
                    <div
                      className="topic-content"
                      onClick={() => handleTopicClick(topic)}
                    >
                      <div className="topic-info">
                        <div className="topic-rank">
                          <span className="rank-number">{topic.rank}</span>
                          <FiTrendingUp
                            className={`trend-icon ${
                              topic.change > 0 ? "up" : "down"
                            }`}
                          />
                        </div>
                        <div className="topic-main">
                          <div className="topic-title">
                            <FiHash className="hashtag-icon" />
                            {topic.title}
                          </div>
                          <div className="topic-meta">
                            <span className="post-count">
                              {topic.postCount} posts
                            </span>
                            {topic.category && (
                              <Badge
                                bg="light"
                                text="dark"
                                className="category-badge"
                              >
                                {topic.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="topic-trend">
                        <Badge bg={getTrendBadge(topic.trend)}>
                          +{topic.trend}%
                        </Badge>
                      </div>
                    </div>

                    <div className="topic-actions">
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>More options</Tooltip>}
                      >
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => toggleExpandTopic(topic.id)}
                          className="more-button"
                        >
                          <FiMoreVertical />
                        </Button>
                      </OverlayTrigger>
                    </div>

                    {expandedTopic === topic.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="expanded-options"
                      >
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => navigate(`/topic/${topic.id}`)}
                        >
                          <FiExternalLink className="me-1" /> View Topic
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-2"
                          onClick={() =>
                            navigate(
                              `/search?q=${encodeURIComponent(
                                topic.title
                              )}&type=posts`
                            )
                          }
                        >
                          View Posts
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-4 no-topics">
            <FiTrendingUp size={48} className="text-muted mb-3" />
            <h5>No trending topics</h5>
            <p className="text-muted">
              Check back later for trending discussions
            </p>
          </div>
        )}
      </Card.Body>

      {topics.length > 0 && (
        <Card.Footer className="text-center">
          <Button
            variant="link"
            size="sm"
            onClick={() => navigate("/trending")}
          >
            View All Trending Topics
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
};

export default TrendingTopicsCard;
