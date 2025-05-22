import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Row,
  Col,
  Form,
  InputGroup,
  Modal,
} from "react-bootstrap";
import { FaComment, FaShare, FaPaperPlane, FaHeart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Postcard.css";

const Postcard = ({ post }) => {
  const navigate = useNavigate();
  const { content, imageUrl, createdBy, likes = [], _id: postId } = post;
  const { _id: userId, name, profilePicture, designation } = createdBy || {};
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(likes.length);
  const [liked, setLiked] = useState(
    likes.includes(localStorage.getItem("userId"))
  );
  const [comments, setComments] = useState([]);
  const [currentUser] = useState(localStorage.getItem("userId"));
  const [showCommentModal, setShowCommentModal] = useState(false);

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/posts/get/${postId}/comments`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      setComments(response.data);
    } catch (error) {
      console.error("Error fetching comments:", error);
      alert("Failed to fetch comments. Please try again.");
    }
  };

  useEffect(() => {
    if (showCommentModal) {
      fetchComments();
    }
  }, [showCommentModal]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (comment.trim()) {
      try {
        setLoading(true);
        const response = await axios.post(
          `http://localhost:5000/api/posts/${postId}/comment`,
          {
            content: comment,
            createdBy: currentUser,
          }
        );
        setComments((prev) => [...prev, response.data]);
        setComment("");
      } catch (error) {
        console.error("Error posting comment:", error);
        alert("Failed to post comment. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please enter a comment");
    }
  };

  const handleCommentUpdate = async (commentId, newContent) => {
    try {
      await axios.put(
        `http://localhost:5000/api/posts/${postId}/comment/${commentId}`,
        { content: newContent }
      );
      fetchComments();
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    }
  };

  const handleCommentDelete = async (commentId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/posts/${postId}/comment/${commentId}`
      );
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert(error.response?.data?.message || "Failed to delete comment");
    }
  };

  const toggleLike = async () => {
    try {
      if (!currentUser) {
        alert("Please log in to like posts");
        return;
      }
      const response = await axios.post(
        `http://localhost:5000/api/posts/like/${postId}`,
        { userId: currentUser }
      );
      setLikeCount(response.data.likes);
      setLiked(response.data.liked);
    } catch (error) {
      console.error("Error liking post:", error);
      alert("An error occurred while processing your request.");
    }
  };

  const handleProfileClick = () => {
    if (userId) {
      navigate(`/profile-view/${userId}`);
    } else {
      alert("User profile not available.");
    }
  };

  const parseContent = (text) => {
    if (!text) return "No content available.";

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const hashtagRegex = /#(\w+)/g;

    return text.split(/(\s+)/).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary"
          >
            {part}
          </a>
        );
      }

      if (hashtagRegex.test(part)) {
        const tag = part.match(hashtagRegex)[0].substring(1);
        return (
          <a key={index} href={`/tags/${tag}`} className="text-info">
            {part}
          </a>
        );
      }

      return part;
    });
  };

  return (
    <>
      <Card className="post-card">
        <Card.Body className="post-header">
          <Row className="align-items-center">
            <Col xs="auto">
              <img
                src={
                  profilePicture ||
                  `https://ui-avatars.com/api/?name=${name || "User"}&size=50`
                }
                alt="Profile"
                className="profile-picture"
                onClick={handleProfileClick}
              />
            </Col>
            <Col>
              <h5 className="mb-0" onClick={handleProfileClick}>
                {name || "Unknown User"}
              </h5>
              <small className="text-muted" onClick={handleProfileClick}>
                {designation || "No designation available"}
              </small>
            </Col>
            <Col xs="auto">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleProfileClick}
              >
                View Profile
              </Button>
            </Col>
          </Row>
        </Card.Body>

        <Card.Body className="post-content">
          <p>{parseContent(content)}</p>
          {imageUrl && (
            <img src={imageUrl} alt="Post Content" className="post-image" />
          )}
        </Card.Body>

        <Card.Footer className="post-footer d-flex align-items-center">
          <Button
            variant="light"
            className={`like-button ${liked ? "liked" : ""}`}
            onClick={toggleLike}
          >
            <FaHeart className="icon" />
            <span className="count">{likeCount}</span>
          </Button>

          <Button
            variant="light"
            className="comment-button ms-2"
            onClick={() => setShowCommentModal(true)}
          >
            <FaComment className="icon" />
            <span className="button-text ms-1">Comment</span>
          </Button>

          <Button variant="light" className="share-button ms-2">
            <FaShare className="icon" />
            <span className="button-text">Repost</span>
          </Button>
          <Button variant="light" className="send-button ms-2">
            <FaPaperPlane className="icon" />
            <span className="button-text">Send</span>
          </Button>
        </Card.Footer>
      </Card>

      {/* Comment Modal */}
      <Modal
        show={showCommentModal}
        onHide={() => setShowCommentModal(false)}
        centered
        size="md"
      >
        <Modal.Header closeButton>
          <Modal.Title>Comments</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <Form onSubmit={handleCommentSubmit}>
            <InputGroup className="mb-3">
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={loading}
              />
            </InputGroup>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || !comment.trim()}
              className="w-100 mb-3"
            >
              {loading ? "Posting..." : "Post Comment"}
            </Button>
          </Form>

          <div className="comments-list">
            {comments.length === 0 && (
              <small className="text-muted">No comments yet.</small>
            )}
            {comments.map((comment) => (
              <div key={comment._id} className="comment-item mb-2">
                <div className="comment-header d-flex align-items-center mb-1">
                  <img
                    src={
                      comment.createdBy?.profilePicture ||
                      `https://ui-avatars.com/api/?name=${
                        comment.createdBy?.name || "User"
                      }&size=30`
                    }
                    alt="Commenter"
                    className="commenter-picture me-2 rounded-circle"
                    style={{ width: "30px", height: "30px" }}
                  />
                  <strong>{comment.createdBy?.name || "Unknown User"}</strong>
                </div>
                <div className="comment-content d-flex justify-content-between align-items-start">
                  <span>{comment.content}</span>
                  {comment.createdBy?._id === currentUser && (
                    <div className="comment-actions ms-2">
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          const newContent = prompt(
                            "Edit your comment:",
                            comment.content
                          );
                          if (newContent && newContent !== comment.content) {
                            handleCommentUpdate(comment._id, newContent);
                          }
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this comment?"
                            )
                          ) {
                            handleCommentDelete(comment._id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Postcard;
