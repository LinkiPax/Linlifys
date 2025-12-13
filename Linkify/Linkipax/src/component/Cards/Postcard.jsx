import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Card,
  Button,
  Row,
  Col,
  Form,
  InputGroup,
  Modal,
  Badge,
  Spinner,
  Dropdown,
  Overlay,
  Tooltip,
  Alert,
  Container
} from "react-bootstrap";
import {
  FaComment,
  FaShare,
  FaPaperPlane,
  FaHeart,
  FaEllipsisH,
  FaBookmark,
  FaRegBookmark,
  FaRegHeart,
  FaSmile,
  FaImage,
  FaRetweet,
  FaLink,
  FaCopy,
  FaExternalLinkAlt,
  FaGift,
  FaUser,
  FaGlobe,
  FaSync,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import Picker from "emoji-picker-react";
import "./Postcard.css";

const Postcard = ({ post, onDelete, onUpdate, onRefresh }) => {
  const navigate = useNavigate();
  const { content, imageUrl, videoUrl, createdBy, likes = [], _id: postId, createdAt, repostedFrom, repostedPost, repostComment, postType } = post;
  const { _id: userId, name, profilePicture, designation } = createdBy || {};
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [likeCount, setLikeCount] = useState(likes.length);
  const [liked, setLiked] = useState(
    likes.includes(localStorage.getItem("userId"))
  );
  const [bookmarked, setBookmarked] = useState(false);
  const [comments, setComments] = useState([]);
  const [currentUser] = useState(localStorage.getItem("userId"));
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [gifSearch, setGifSearch] = useState("");
  const [repostCount, setRepostCount] = useState(post.reposts || 0);
  const [reposted, setReposted] = useState(post.repostedByUser || false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostCommentText, setRepostCommentText] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLinkTooltip, setShowLinkTooltip] = useState(false);
  const linkRef = useRef(null);
  const [poll, setPoll] = useState(post.poll || null);
  const [selectedPollOption, setSelectedPollOption] = useState(null);
  const [voted, setVoted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [gifUrl, setGifUrl] = useState("");
  const [videoError, setVideoError] = useState(false);
  const [repostUserDetails, setRepostUserDetails] = useState(null);
  const [originalPostUserDetails, setOriginalPostUserDetails] = useState(null);
  const [originalPostDetails, setOriginalPostDetails] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [isTextOverflow, setIsTextOverflow] = useState(false);
  const textRef = useRef(null);
  const postCardRef = useRef(null);
  
  console.log("posts", post);

  // Check if this is a repost
  const isRepost = postType === "repost" || repostedFrom;
  
  // Text overflow detection
  useEffect(() => {
    const checkTextOverflow = () => {
      if (textRef.current) {
        const lineHeight = parseInt(getComputedStyle(textRef.current).lineHeight);
        const maxHeight = lineHeight * 4; // 4 lines max
        const isOverflowing = textRef.current.scrollHeight > maxHeight;
        setIsTextOverflow(isOverflowing);
      }
    };

    checkTextOverflow();
    window.addEventListener('resize', checkTextOverflow);
    
    return () => {
      window.removeEventListener('resize', checkTextOverflow);
    };
  }, [content, showFullText]);

  // Auto-refresh setup
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(refreshInterval);
  }, [onRefresh]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/profile/merged-user-details/${userId}`
        );
        console.log("fetchuserDetail", response.data);
        setUserDetails(response.data);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  // Fetch repost user details if this is a repost
  useEffect(() => {
    const fetchRepostUserDetails = async () => {
      if (postType == "repost") {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/profile/merged-user-details/${createdBy._id}`
          );
          console.log("fetchrepostuserdetail", response.data);
          setRepostUserDetails(response.data);
        } catch (error) {
          console.error("Error fetching repost user details:", error);
        }
      }
    };

    fetchRepostUserDetails();
  }, [repostedFrom]);

  // Fetch original post user details if this is a repost
  useEffect(() => {
    const fetchOriginalPostUserDetails = async () => {
      if (postType == "repost") {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/profile/merged-user-details/${repostedFrom.createdBy}`
          );
          console.log("fetchOriginalPostUserDetails", response.data)
          setOriginalPostUserDetails(response.data);
        } catch (error) {
          console.error("Error fetching original post user details:", error);
        }
      }
    };

    fetchOriginalPostUserDetails();
  }, [repostedPost]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return date.toLocaleDateString();
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/posts/get/${postId}/comments`
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
    if (comment.trim() || gifUrl) {
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment`,
          {
            content: comment,
            createdBy: currentUser,
            gifUrl: gifUrl
          }
        );
        setComments((prev) => [...prev, response.data]);
        setComment("");
        setGifUrl("");
      } catch (error) {
        console.error("Error posting comment:", error);
        alert("Failed to post comment. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Please enter a comment or select a GIF");
    }
  };

  const handleCommentUpdate = async (commentId, newContent) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment/${commentId}`,
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
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment/${commentId}`
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
      setSaving(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/like/${postId}`,
        { userId: currentUser }
      );
      setLikeCount(response.data.likes);
      setLiked(response.data.liked);
    } catch (error) {
      console.error("Error liking post:", error);
      alert("An error occurred while processing your request.");
    } finally {
      setSaving(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      setSaving(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/bookmark/${postId}`,
        { userId: currentUser }
      );
      setBookmarked(response.data.bookmarked);
    } catch (error) {
      console.error("Error bookmarking post:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleRepost = async (withComment = false) => {
    try {
      if (!currentUser) {
        alert("Please log in to repost");
        return;
      }
      
      setSaving(true);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/repost/${postId}`,
        { 
          userId: currentUser,
          comment: withComment ? repostCommentText : null
        }
      );
      
      setReposted(true);
      setRepostCount(response.data.reposts);
      setShowRepostModal(false);
      setRepostCommentText("");
      
      alert("Post reposted successfully!");
    } catch (error) {
      console.error("Error reposting:", error);
      alert("Failed to repost. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyLinkToClipboard = () => {
    const postLink = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(postLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const fetchGifs = async (query = "") => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const endpoint = query 
        ? `${apiUrl}/api/posts/gifs/search?query=${query}`
        : `${apiUrl}/api/posts/gifs/trending`;
      
      const response = await axios.get(endpoint);
      setGifs(response.data);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
    }
  };

  const addGifToComment = (gif) => {
    setGifUrl(gif.url);
    setComment(comment + ` ![GIF](${gif.url}) `);
    setShowGifPicker(false);
  };

  const handleProfileClick = (userId) => {
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
    const mentionRegex = /@(\w+)/g;
    const gifRegex = /!\[GIF\]\((.*?)\)/g;

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
            {part} <FaExternalLinkAlt size={10} />
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

      if (mentionRegex.test(part)) {
        const username = part.match(mentionRegex)[0].substring(1);
        return (
          <a key={index} href={`/profile/${username}`} className="text-primary">
            {part}
          </a>
        );
      }

      if (gifRegex.test(part)) {
        const gifUrl = part.match(/!\[GIF\]\((.*?)\)/)[1];
        return (
          <img key={index} src={gifUrl} alt="GIF" className="comment-gif" />
        );
      }

      return part;
    });
  };

  const onEmojiClick = (event, emojiObject) => {
    setComment(comment + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  const handlePollVote = async (optionId) => {
    if (!currentUser) {
      alert("Please log in to vote");
      return;
    }
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/posts/poll/${postId}/vote`,
        { 
          userId: currentUser,
          optionId: optionId
        }
      );
      
      setPoll(response.data.poll);
      setVoted(true);
      setSelectedPollOption(optionId);
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to vote. Please try again.");
    }
  };

  const handlePostDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}`
      );
      if (onDelete) onDelete(postId);
      setShowDeleteConfirm(false);
      alert("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  const handlePostEdit = async () => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/posts/${postId}`,
        { content: editContent }
      );
      
      if (onUpdate) onUpdate(postId, response.data);
      setEditing(false);
      alert("Post updated successfully");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      if (onRefresh) onRefresh();
      setRefreshing(false);
    }, 1000);
  };

  const toggleShowFullText = () => {
    setShowFullText(!showFullText);
  };
 
  const isOwner = currentUser === userId;

  return (
    <>
      <div ref={postCardRef} className="post-card-wrapper">
        {/* Refresh loader */}
        <div className={`post-refresh-loader ${refreshing ? 'active' : ''}`}>
          <FaSync className="spinning" />
          <span>Refreshing posts...</span>
        </div>
        
        <Card className="post-card-modern">
          {/* Repost Header - Shows reposter info */}
          {isRepost && (
            <div className="post-repost-header p-3 bg-gradient-light border-start border-4 border-success">
              <div className="d-flex align-items-start">
                {/* Repost Content */}
                <div className="post-repost-content flex-grow-1">
                  {/* Repost Info */}
                  <div className="d-flex align-items-center flex-wrap mb-2">
                    <Card.Body className="post-header-section">
                      <Row className="align-items-center">
                        <Col xs="auto">
                          <div className="post-profile-picture-wrapper">
                            <img
                              src={
                                isRepost && repostUserDetails 
                                  ? repostUserDetails.profilePicture || `https://ui-avatars.com/api/?name=${repostUserDetails.name || "User"}&size=50&background=random`
                                  : profilePicture || `https://ui-avatars.com/api/?name=${name || "User"}&size=50&background=random`
                              }
                              alt="Profile"
                              className="post-profile-picture"
                              onClick={() => handleProfileClick(isRepost ? repostUserDetails?.createdBy?._id : userId)}
                            />
                            <div className="post-online-indicator"></div>
                          </div>
                        </Col>
                        <Col className="ps-0">
                          <div className="d-flex align-items-center">
                            <h6 
                              className="mb-0 post-user-name post-user-link" 
                              onClick={() => handleProfileClick(isRepost ? repostUserDetails?.createdBy?._id : userId)}
                            >
                              {isRepost && repostUserDetails 
                                ? repostUserDetails.name || "Unknown User" 
                                : name || "Unknown User"
                              }
                            </h6>
                            {((isRepost && repostUserDetails?.verified) || (!isRepost && userDetails?.verified)) && (
                              <Badge bg="primary" className="post-verified-badge ms-1">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <div className="post-user-details">
                            <span className="text-muted post-user-designation">
                              {isRepost && repostUserDetails 
                                ? repostUserDetails.jobTitle || repostUserDetails.designation || "No designation available"
                                : userDetails?.jobTitle || designation || "No designation available"
                              }
                            </span>
                            {console.log("repostUserDetails:", repostUserDetails?.userId)}
                            <span className="text-muted post-time-ago ms-2">
                              • {formatDate(
                                  isRepost && 
                                  repostUserDetails?.userId === post?.createdBy?._id 
                                    ? post.createdAt 
                                    : createdAt
                                )}
                            </span>
                            <span className="text-muted mx-1">reposted</span>
                            <FaGlobe size={12} className="text-muted" />
                          </div>
                        </Col>
                        <Col xs="auto">
                          <Dropdown>
                            <Dropdown.Toggle variant="light" id="dropdown-post-options" className="post-options-button">
                              <FaEllipsisH />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={toggleBookmark}>
                                {bookmarked ? "Remove from Bookmarks" : "Save to Bookmarks"}
                              </Dropdown.Item>
                              <Dropdown.Item 
                                ref={linkRef}
                                onClick={copyLinkToClipboard}
                              >
                                <FaLink className="me-2" /> Copy Link
                              </Dropdown.Item>
                              {isOwner && (
                                <>
                                  <Dropdown.Item onClick={() => setEditing(true)}>
                                    Edit Post
                                  </Dropdown.Item>
                                  <Dropdown.Item 
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="text-danger"
                                  >
                                    Delete Post
                                  </Dropdown.Item>
                                </>
                              )}
                              <Dropdown.Item>Report</Dropdown.Item>
                              <Dropdown.Item onClick={handleRefresh}>
                                <FaSync className="me-2" /> Refresh
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                          
                          <Overlay target={linkRef.current} show={copied} placement="top">
                            {(props) => (
                              <Tooltip id="copied-tooltip" {...props}>
                                Link copied to clipboard!
                              </Tooltip>
                            )}
                          </Overlay>
                        </Col>
                      </Row>
                    </Card.Body>
                  </div>
                  
                  {/* Repost Comment */}
                  {repostComment && (
                    <div className="post-repost-comment mt-2 p-2 bg-white rounded border">
                      <p className="mb-0 text-dark small">{repostComment}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Card.Body className="post-header-section">
            <Row className="align-items-center">
              <Col xs="auto">
                <div className="post-profile-picture-wrapper">
                  <img
                    src={
                      isRepost && originalPostUserDetails 
                        ? originalPostUserDetails.profilePicture || `https://ui-avatars.com/api/?name=${originalPostUserDetails.name || "User"}&size=50&background=random`
                        : profilePicture || `https://ui-avatars.com/api/?name=${name || "User"}&size=50&background=random`
                    }
                    alt="Profile"
                    className="post-profile-picture"
                    onClick={() => handleProfileClick(isRepost ? originalPostDetails?.createdBy?._id : userId)}
                  />
                  <div className="post-online-indicator"></div>
                </div>
              </Col>
              <Col className="ps-0">
                <div className="d-flex align-items-center">
                  <h6 
                    className="mb-0 post-user-name post-user-link" 
                    onClick={() => handleProfileClick(isRepost ? originalPostDetails?.createdBy?._id : userId)}
                  >
                    {isRepost && originalPostUserDetails 
                      ? originalPostUserDetails.name || "Unknown User" 
                      : name || "Unknown User"
                    }
                  </h6>
                  {((isRepost && originalPostUserDetails?.verified) || (!isRepost && userDetails?.verified)) && (
                    <Badge bg="primary" className="post-verified-badge ms-1">
                      ✓
                    </Badge>
                  )}
                </div>
                <div className="post-user-details">
                  <span className="text-muted post-user-designation">
                    {isRepost && originalPostUserDetails 
                      ? originalPostUserDetails.jobTitle || originalPostUserDetails.designation || "No designation available"
                      : userDetails?.jobTitle || designation || "No designation available"
                    }
                  </span>
                  <span className="text-muted post-time-ago ms-2">
                    • {formatDate(isRepost && originalPostDetails ? originalPostDetails.createdAt : createdAt)}
                  </span>
                </div>
              </Col>
              <Col xs="auto">
                <Dropdown>
                  <Dropdown.Toggle variant="light" id="dropdown-post-options" className="post-options-button">
                    <FaEllipsisH />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={toggleBookmark}>
                      {bookmarked ? "Remove from Bookmarks" : "Save to Bookmarks"}
                    </Dropdown.Item>
                    <Dropdown.Item 
                      ref={linkRef}
                      onClick={copyLinkToClipboard}
                    >
                      <FaLink className="me-2" /> Copy Link
                    </Dropdown.Item>
                    {isOwner && (
                      <>
                        <Dropdown.Item onClick={() => setEditing(true)}>
                          Edit Post
                        </Dropdown.Item>
                        <Dropdown.Item 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-danger"
                        >
                          Delete Post
                        </Dropdown.Item>
                      </>
                    )}
                    <Dropdown.Item>Report</Dropdown.Item>
                    <Dropdown.Item onClick={handleRefresh}>
                      <FaSync className="me-2" /> Refresh
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                
                <Overlay target={linkRef.current} show={copied} placement="top">
                  {(props) => (
                    <Tooltip id="copied-tooltip" {...props}>
                      Link copied to clipboard!
                    </Tooltip>
                  )}
                </Overlay>
              </Col>
            </Row>
          </Card.Body>

          <Card.Body className="post-content-section">
            {editing ? (
              <div className="post-edit-container">
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="mb-2"
                />
                <div className="d-flex justify-content-end">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={() => setEditing(false)}
                    className="me-2"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handlePostEdit}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="post-text-container">
                <div 
                  ref={textRef}
                  className={`post-text-content ${showFullText ? 'expanded' : 'collapsed'} ${isTextOverflow ? 'overflow' : ''}`}
                >
                  {parseContent(isRepost && originalPostDetails ? originalPostDetails.content : content)}
                </div>
                {isTextOverflow && (
                  <Button 
                    variant="link" 
                    className="post-read-more-btn p-0 mt-1"
                    onClick={toggleShowFullText}
                  >
                    {showFullText ? (
                      <>
                        Show less <FaChevronUp size={12} className="ms-1" />
                      </>
                    ) : (
                      <>
                        Read more <FaChevronDown size={12} className="ms-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
            
            {(imageUrl || (isRepost && originalPostDetails?.imageUrl)) && !(videoUrl || (isRepost && originalPostDetails?.videoUrl)) && (
              <div className="post-image-wrapper">
                <img 
                  src={isRepost && originalPostDetails?.imageUrl ? originalPostDetails.imageUrl : imageUrl} 
                  alt="Post Content" 
                  className="post-content-image" 
                />
              </div>
            )}
            
            {videoUrl && !videoError && (
  <div className="post-video-wrapper">
    <ReactPlayer
      url={videoUrl}
      controls
      width="100%"
      height="360px"
      playsinline
    />
  </div>
)}

            
            {videoError && (
              <Alert variant="warning" className="mt-3">
                <FaImage className="me-2" />
                Video failed to load. The file may be corrupted or in an unsupported format.
              </Alert>
            )}
          </Card.Body>

          <Card.Footer className="post-footer-section">
            <div className="post-stats-section">
              {likeCount > 0 && (
                <span className="post-likes-count">
                  <FaHeart className="text-danger me-1" />
                  {likeCount}
                </span>
              )}
              {repostCount > 0 && (
                <span className="post-reposts-count ms-3">
                  <FaRetweet className="text-success me-1" />
                  {repostCount}
                </span>
              )}
              {comments.length > 0 && (
                <span className="post-comments-count ms-3">
                  <FaComment className="text-primary me-1" />
                  {comments.length}
                </span>
              )}
            </div>
            
            <div className="post-actions-section">
              <Button
                variant="light"
                className={`post-action-btn post-like-btn ${liked ? "liked" : ""}`}
                onClick={toggleLike}
                disabled={saving}
              >
                {saving ? (
                  <Spinner animation="border" size="sm" />
                ) : liked ? (
                  <FaHeart className="post-action-icon text-danger" />
                ) : (
                  <FaRegHeart className="post-action-icon" />
                )}
                <span className="post-action-text ms-1">Like</span>
              </Button>

              <Button
                variant="light"
                className="post-action-btn post-comment-btn"
                onClick={() => setShowCommentModal(true)}
              >
                <FaComment className="post-action-icon" />
                <span className="post-action-text ms-1">Comment</span>
              </Button>

              <Button 
                variant="light" 
                className={`post-action-btn post-repost-btn ${reposted ? "reposted" : ""}`}
                onClick={() => setShowRepostModal(true)}
              >
                <FaRetweet className="post-action-icon" />
                <span className="post-action-text">Repost</span>
              </Button>
              
              <Button 
                variant="light" 
                className="post-action-btn post-share-btn"
                ref={linkRef}
                onClick={copyLinkToClipboard}
              >
                <FaShare className="post-action-icon" />
                <span className="post-action-text">Share</span>
              </Button>
              
              <Button 
                variant="light" 
                className="post-action-btn post-bookmark-btn ms-auto"
                onClick={toggleBookmark}
              >
                {bookmarked ? (
                  <FaBookmark className="post-action-icon text-warning" />
                ) : (
                  <FaRegBookmark className="post-action-icon" />
                )}
              </Button>
            </div>
          </Card.Footer>
        </Card>
      </div>

      {/* Comment Modal */}
      <Modal
        show={showCommentModal}
        onHide={() => {
          setShowCommentModal(false);
          setShowEmojiPicker(false);
          setShowGifPicker(false);
          setGifUrl("");
        }}
        centered
        size="lg"
        className="post-comment-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <FaComment className="me-2" />
              Comments
              {comments.length > 0 && (
                <Badge bg="secondary" className="ms-2">
                  {comments.length}
                </Badge>
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <div className="post-comment-input-container">
            <div className="d-flex">
              <img
                src={
                  localStorage.getItem("profilePicture") ||
                  `https://ui-avatars.com/api/?name=${localStorage.getItem("name") || "User"}&size=40`
                }
                alt="Your profile"
                className="post-comment-user-picture me-2"
              />
              <div className="post-comment-input-wrapper flex-grow-1">
                <Form onSubmit={handleCommentSubmit}>
                  <InputGroup>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Write a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={loading}
                      className="post-comment-textarea"
                    />
                  </InputGroup>
                  {gifUrl && (
                    <div className="post-selected-gif-preview mt-2">
                      <img src={gifUrl} alt="Selected GIF" className="post-comment-gif-preview" />
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        onClick={() => setGifUrl("")}
                        className="post-remove-gif-btn"
                      >
                        Remove GIF
                      </Button>
                    </div>
                  )}
                  <div className="post-comment-actions d-flex justify-content-between align-items-center mt-2">
                    <div className="d-flex align-items-center">
                      <Button
                        variant="light"
                        size="sm"
                        onClick={() => {
                          setShowEmojiPicker(!showEmojiPicker);
                          setShowGifPicker(false);
                        }}
                        type="button"
                      >
                        <FaSmile />
                      </Button>
                      <Button 
                        variant="light" 
                        size="sm" 
                        type="button" 
                        className="ms-2"
                        onClick={() => {
                          setShowGifPicker(!showGifPicker);
                          setShowEmojiPicker(false);
                          if (!showGifPicker) fetchGifs();
                        }}
                      >
                        <FaGift /> GIF
                      </Button>
                    </div>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading || (!comment.trim() && !gifUrl)}
                      size="sm"
                    >
                      {loading ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </Form>
                
                {showEmojiPicker && (
                  <div className="post-emoji-picker-container">
                    <Picker onEmojiClick={onEmojiClick} />
                  </div>
                )}
                
                {showGifPicker && (
                  <div className="post-gif-picker-container">
                    <InputGroup size="sm" className="mb-2">
                      <Form.Control
                        placeholder="Search GIFs..."
                        value={gifSearch}
                        onChange={(e) => setGifSearch(e.target.value)}
                      />
                      <Button 
                        variant="primary"
                        onClick={() => fetchGifs(gifSearch)}
                      >
                        Search
                      </Button>
                    </InputGroup>
                    <div className="post-gif-grid">
                      {gifs.map((gif) => (
                        <img
                          key={gif.id}
                          src={gif.preview || gif.url}
                          alt={gif.title}
                          className="post-gif-option"
                          onClick={() => addGifToComment(gif)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="post-comments-list mt-3">
            {comments.length === 0 && (
              <div className="text-center py-4 text-muted">
                <FaComment size={24} className="mb-2" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
            {comments.map((comment) => (
              <div key={comment._id} className="post-comment-item mb-3">
                <div className="d-flex">
                  <img
                    src={
                      comment.createdBy?.profilePicture ||
                      `https://ui-avatars.com/api/?name=${
                        comment.createdBy?.name || "User"
                      }&size=40`
                    }
                    alt="Commenter"
                    className="post-commenter-picture me-2"
                  />
                  <div className="post-comment-content flex-grow-1">
                    <div className="post-comment-header d-flex justify-content-between align-items-start mb-1">
                      <div>
                        <strong 
                          className="post-commenter-name post-user-link"
                          onClick={() => handleProfileClick(comment.createdBy?._id)}
                        >
                          {comment.createdBy?.name || "Unknown User"}
                        </strong>
                        <small className="text-muted ms-2">
                          {formatDate(comment.createdAt)}
                        </small>
                      </div>
                      {comment.createdBy?._id === currentUser && (
                        <Dropdown>
                          <Dropdown.Toggle variant="light" size="sm" id="dropdown-comment-options" className="post-comment-options-button">
                            <FaEllipsisH />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item 
                              onClick={() => {
                                const newContent = prompt(
                                  "Edit your comment:",
                                  comment.textContent || comment.content
                                );
                                if (newContent && newContent !== comment.content) {
                                  handleCommentUpdate(comment._id, newContent);
                                }
                              }}
                            >
                              Edit
                            </Dropdown.Item>
                            <Dropdown.Item 
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
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </div>
                    {comment.hasGif && (
                      <div className="post-comment-gif-container mb-2">
                        <img src={comment.gifUrl} alt="Comment GIF" className="post-comment-gif" />
                      </div>
                    )}
                    {comment.textContent && (
                      <p className="post-comment-text mb-0">
                        {comment.textContent.split(' ').map((word, i) => {
                          // Check if word is an emoji (using a simple heuristic)
                          const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
                          if (emojiRegex.test(word)) {
                            return <span key={i} className="post-comment-emoji">{word} </span>;
                          }
                          return word + ' ';
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>

      {/* Repost Modal */}
      <Modal
        show={showRepostModal}
        onHide={() => setShowRepostModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Repost</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Add your comment (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={repostCommentText}
              onChange={(e) => setRepostCommentText(e.target.value)}
              placeholder="Add your thoughts..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowRepostModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="outline-primary" 
            onClick={() => handleRepost(false)}
            disabled={saving}
          >
            {saving ? <Spinner size="sm" /> : "Repost"}
          </Button>
          <Button 
            variant="primary" 
            onClick={() => handleRepost(true)}
            disabled={saving}
          >
            {saving ? <Spinner size="sm" /> : "Repost with Comment"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this post? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handlePostDelete}
          >
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <Overlay target={linkRef.current} show={showLinkTooltip} placement="top">
        {(props) => (
          <Tooltip id="link-tooltip" {...props}>
            Link copied to clipboard!
          </Tooltip>
        )}
      </Overlay>
    </>
  );
};

export default Postcard;


// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import {
//   Card,
//   Button,
//   Row,
//   Col,
//   Form,
//   InputGroup,
//   Modal,
//   Badge,
//   Spinner,
//   Dropdown,
//   Overlay,
//   Tooltip,
//   Alert,
//   Container
// } from "react-bootstrap";
// import {
//   FaComment,
//   FaShare,
//   FaPaperPlane,
//   FaHeart,
//   FaEllipsisH,
//   FaBookmark,
//   FaRegBookmark,
//   FaRegHeart,
//   FaSmile,
//   FaImage,
//   FaRetweet,
//   FaLink,
//   FaCopy,
//   FaExternalLinkAlt,
//   FaGift,
//   FaUser,
//   FaGlobe,
//   FaSync
// } from "react-icons/fa";
// import { useNavigate } from "react-router-dom";
// import ReactPlayer from "react-player";
// import Picker from "emoji-picker-react";
// import "./Postcard.css";

// const Postcard = ({ post, onDelete, onUpdate, onRefresh }) => {
//   const navigate = useNavigate();
//   const { content, imageUrl, videoUrl, createdBy, likes = [], _id: postId, createdAt, repostedFrom, repostedPost, repostComment, postType } = post;
//   const { _id: userId, name, profilePicture, designation } = createdBy || {};
//   const [comment, setComment] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [likeCount, setLikeCount] = useState(likes.length);
//   const [liked, setLiked] = useState(
//     likes.includes(localStorage.getItem("userId"))
//   );
//   const [bookmarked, setBookmarked] = useState(false);
//   const [comments, setComments] = useState([]);
//   const [currentUser] = useState(localStorage.getItem("userId"));
//   const [showCommentModal, setShowCommentModal] = useState(false);
//   const [userDetails, setUserDetails] = useState(null);
//   const [saving, setSaving] = useState(false);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [showGifPicker, setShowGifPicker] = useState(false);
//   const [gifs, setGifs] = useState([]);
//   const [gifSearch, setGifSearch] = useState("");
//   const [repostCount, setRepostCount] = useState(post.reposts || 0);
//   const [reposted, setReposted] = useState(post.repostedByUser || false);
//   const [showRepostModal, setShowRepostModal] = useState(false);
//   const [repostCommentText, setRepostCommentText] = useState("");
//   const [copied, setCopied] = useState(false);
//   const [showLinkTooltip, setShowLinkTooltip] = useState(false);
//   const linkRef = useRef(null);
//   const [poll, setPoll] = useState(post.poll || null);
//   const [selectedPollOption, setSelectedPollOption] = useState(null);
//   const [voted, setVoted] = useState(false);
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
//   const [editing, setEditing] = useState(false);
//   const [editContent, setEditContent] = useState(content);
//   const [gifUrl, setGifUrl] = useState("");
//   const [videoError, setVideoError] = useState(false);
//   const [repostUserDetails, setRepostUserDetails] = useState(null);
//   const [originalPostUserDetails, setOriginalPostUserDetails] = useState(null);
//   const [originalPostDetails, setOriginalPostDetails] = useState(null);
//   const [refreshing, setRefreshing] = useState(false);
//   const postCardRef = useRef(null);
//  console.log("posts",post);
//   // Check if this is a repost
//   const isRepost = postType === "repost" || repostedFrom;
//   // Auto-refresh setup
//   useEffect(() => {
//     const refreshInterval = setInterval(() => {
//       if (onRefresh) {
//         onRefresh();
//       }
//     }, 10000); // Refresh every 10 seconds

//     return () => clearInterval(refreshInterval);
//   }, [onRefresh]);

//   // Fetch user details
//   useEffect(() => {
//     const fetchUserDetails = async () => {
//       try {
//         const response = await axios.get(
//           `${import.meta.env.VITE_API_URL}/profile/merged-user-details/${userId}`
//         );
//         console.log("fetchuserDetail",response.data);
//         setUserDetails(response.data);
//       } catch (error) {
//         console.error("Error fetching user details:", error);
//       }
//     };

//     if (userId) {
//       fetchUserDetails();
//     }
//   }, [userId]);

//   // Fetch repost user details if this is a repost
//   useEffect(() => {
//     const fetchRepostUserDetails = async () => {
//       if (postType=="repost") {
//         try {
//           const response = await axios.get(
//             `${import.meta.env.VITE_API_URL}/profile/merged-user-details/${createdBy._id}`
//           );
//           console.log("fetchrepostuserdetail",response.data);
//           setRepostUserDetails(response.data);
//         } catch (error) {
//           console.error("Error fetching repost user details:", error);
//         }
//       }
//     };

//     fetchRepostUserDetails();
//   }, [repostedFrom]);
//   // Fetch original post user details if this is a repost
//   useEffect(() => {
//     const fetchOriginalPostUserDetails = async () => {
//       if (postType=="repost") {
//         try {
//           const response = await axios.get(
//             `${import.meta.env.VITE_API_URL}/profile/merged-user-details/${repostedFrom.createdBy}`
//           );
//           console.log("fetchOriginalPostUserDetails",response.data)
//           setOriginalPostUserDetails(response.data);
//         } catch (error) {
//           console.error("Error fetching original post user details:", error);
//         }
//       }
//     };

//     fetchOriginalPostUserDetails();
//   }, [repostedPost]);
//   // Format date
//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
//     if (diffInHours < 1) return "Just now";
//     if (diffInHours < 24) return `${diffInHours}h ago`;
//     if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
//     return date.toLocaleDateString();
//   };

//   const fetchComments = async () => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/posts/get/${postId}/comments`
//       );
//       setComments(response.data);
//     } catch (error) {
//       console.error("Error fetching comments:", error);
//       alert("Failed to fetch comments. Please try again.");
//     }
//   };

//   useEffect(() => {
//     if (showCommentModal) {
//       fetchComments();
//     }
//   }, [showCommentModal]);

//   const handleCommentSubmit = async (e) => {
//     e.preventDefault();
//     if (comment.trim() || gifUrl) {
//       try {
//         setLoading(true);
//         const response = await axios.post(
//           `${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment`,
//           {
//             content: comment,
//             createdBy: currentUser,
//             gifUrl: gifUrl
//           }
//         );
//         setComments((prev) => [...prev, response.data]);
//         setComment("");
//         setGifUrl("");
//       } catch (error) {
//         console.error("Error posting comment:", error);
//         alert("Failed to post comment. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     } else {
//       alert("Please enter a comment or select a GIF");
//     }
//   };

//   const handleCommentUpdate = async (commentId, newContent) => {
//     try {
//       await axios.put(
//         `${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment/${commentId}`,
//         { content: newContent }
//       );
//       fetchComments();
//     } catch (error) {
//       console.error("Error updating comment:", error);
//       alert("Failed to update comment. Please try again.");
//     }
//   };

//   const handleCommentDelete = async (commentId) => {
//     try {
//       await axios.delete(
//         `${import.meta.env.VITE_API_URL}/api/posts/${postId}/comment/${commentId}`
//       );
//       setComments((prev) =>
//         prev.filter((comment) => comment._id !== commentId)
//       );
//     } catch (error) {
//       console.error("Error deleting comment:", error);
//       alert(error.response?.data?.message || "Failed to delete comment");
//     }
//   };

//   const toggleLike = async () => {
//     try {
//       if (!currentUser) {
//         alert("Please log in to like posts");
//         return;
//       }
//       setSaving(true);
//       const response = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/posts/like/${postId}`,
//         { userId: currentUser }
//       );
//       setLikeCount(response.data.likes);
//       setLiked(response.data.liked);
//     } catch (error) {
//       console.error("Error liking post:", error);
//       alert("An error occurred while processing your request.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const toggleBookmark = async () => {
//     try {
//       setSaving(true);
//       const response = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/posts/bookmark/${postId}`,
//         { userId: currentUser }
//       );
//       setBookmarked(response.data.bookmarked);
//     } catch (error) {
//       console.error("Error bookmarking post:", error);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleRepost = async (withComment = false) => {
//     try {
//       if (!currentUser) {
//         alert("Please log in to repost");
//         return;
//       }
      
//       setSaving(true);
//       const response = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/posts/repost/${postId}`,
//         { 
//           userId: currentUser,
//           comment: withComment ? repostCommentText : null
//         }
//       );
      
//       setReposted(true);
//       setRepostCount(response.data.reposts);
//       setShowRepostModal(false);
//       setRepostCommentText("");
      
//       alert("Post reposted successfully!");
//     } catch (error) {
//       console.error("Error reposting:", error);
//       alert("Failed to repost. Please try again.");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const copyLinkToClipboard = () => {
//     const postLink = `${window.location.origin}/post/${postId}`;
//     navigator.clipboard.writeText(postLink).then(() => {
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     });
//   };

//   const fetchGifs = async (query = "") => {
//     try {
//       const apiUrl = import.meta.env.VITE_API_URL;
//       const endpoint = query 
//         ? `${apiUrl}/api/posts/gifs/search?query=${query}`
//         : `${apiUrl}/api/posts/gifs/trending`;
      
//       const response = await axios.get(endpoint);
//       setGifs(response.data);
//     } catch (error) {
//       console.error("Error fetching GIFs:", error);
//     }
//   };

//   const addGifToComment = (gif) => {
//     setGifUrl(gif.url);
//     setComment(comment + ` ![GIF](${gif.url}) `);
//     setShowGifPicker(false);
//   };

//   const handleProfileClick = (userId) => {
//     if (userId) {
//       navigate(`/profile-view/${userId}`);
//     } else {
//       alert("User profile not available.");
//     }
//   };

//   const parseContent = (text) => {
//     if (!text) return "No content available.";

//     const urlRegex = /(https?:\/\/[^\s]+)/g;
//     const hashtagRegex = /#(\w+)/g;
//     const mentionRegex = /@(\w+)/g;
//     const gifRegex = /!\[GIF\]\((.*?)\)/g;

//     return text.split(/(\s+)/).map((part, index) => {
//       if (urlRegex.test(part)) {
//         return (
//           <a
//             key={index}
//             href={part}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="text-primary"
//           >
//             {part} <FaExternalLinkAlt size={10} />
//           </a>
//         );
//       }

//       if (hashtagRegex.test(part)) {
//         const tag = part.match(hashtagRegex)[0].substring(1);
//         return (
//           <a key={index} href={`/tags/${tag}`} className="text-info">
//             {part}
//           </a>
//         );
//       }

//       if (mentionRegex.test(part)) {
//         const username = part.match(mentionRegex)[0].substring(1);
//         return (
//           <a key={index} href={`/profile/${username}`} className="text-primary">
//             {part}
//           </a>
//         );
//       }

//       if (gifRegex.test(part)) {
//         const gifUrl = part.match(/!\[GIF\]\((.*?)\)/)[1];
//         return (
//           <img key={index} src={gifUrl} alt="GIF" className="comment-gif" />
//         );
//       }

//       return part;
//     });
//   };

//   const onEmojiClick = (event, emojiObject) => {
//     setComment(comment + emojiObject.emoji);
//     setShowEmojiPicker(false);
//   };

//   const handlePollVote = async (optionId) => {
//     if (!currentUser) {
//       alert("Please log in to vote");
//       return;
//     }
    
//     try {
//       const response = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/posts/poll/${postId}/vote`,
//         { 
//           userId: currentUser,
//           optionId: optionId
//         }
//       );
      
//       setPoll(response.data.poll);
//       setVoted(true);
//       setSelectedPollOption(optionId);
//     } catch (error) {
//       console.error("Error voting:", error);
//       alert("Failed to vote. Please try again.");
//     }
//   };

//   const handlePostDelete = async () => {
//     try {
//       await axios.delete(
//         `${import.meta.env.VITE_API_URL}/api/posts/${postId}`
//       );
//       if (onDelete) onDelete(postId);
//       setShowDeleteConfirm(false);
//       alert("Post deleted successfully");
//     } catch (error) {
//       console.error("Error deleting post:", error);
//       alert("Failed to delete post");
//     }
//   };

//   const handlePostEdit = async () => {
//     try {
//       const response = await axios.put(
//         `${import.meta.env.VITE_API_URL}/api/posts/${postId}`,
//         { content: editContent }
//       );
      
//       if (onUpdate) onUpdate(postId, response.data);
//       setEditing(false);
//       alert("Post updated successfully");
//     } catch (error) {
//       console.error("Error updating post:", error);
//       alert("Failed to update post");
//     }
//   };

//   const handleVideoError = () => {
//     setVideoError(true);
//   };

//   const handleRefresh = () => {
//     setRefreshing(true);
//     setTimeout(() => {
//       if (onRefresh) onRefresh();
//       setRefreshing(false);
//     }, 1000);
//   };
 
//   const isOwner = currentUser === userId;

//   return (
//     <>
//       <div ref={postCardRef} className="post-card-container">
//         {/* Refresh loader */}
//         <div className={`refresh-loader ${refreshing ? 'active' : ''}`}>
//           <FaSync className="spinning" />
//           <span>Refreshing posts...</span>
//         </div>
        
//         <Card className="post-card modern-card">
//           {/* Repost Header - Shows reposter info */}
// {isRepost && (
//   <div className="repost-header p-3 bg-gradient-light border-start border-4 border-success">
//     <div className="d-flex align-items-start">
//       {/* Repost Content */}
//       <div className="repost-content flex-grow-1">
//         {/* Repost Info */}
//         <div className="d-flex align-items-center flex-wrap mb-2">
//           <Card.Body className="post-header">
//             <Row className="align-items-center">
//               <Col xs="auto">
//                 <div className="profile-picture-container-post">
//                   <img
//                     src={
//                       isRepost && repostUserDetails 
//                         ? repostUserDetails.profilePicture || `https://ui-avatars.com/api/?name=${repostUserDetails.name || "User"}&size=50&background=random`
//                         : profilePicture || `https://ui-avatars.com/api/?name=${name || "User"}&size=50&background=random`
//                     }
//                     alt="Profile"
//                     className="profile-picture"
//                     onClick={() => handleProfileClick(isRepost ? repostUserDetails?.createdBy?._id : userId)}
//                   />
//                   <div className="online-indicator"></div>
//                 </div>
//               </Col>
//               <Col className="ps-0">
//                 <div className="d-flex align-items-center">
//                   <h6 
//                     className="mb-0 user-name user-link" 
//                     onClick={() => handleProfileClick(isRepost ? repostUserDetails?.createdBy?._id : userId)}
//                   >
//                     {isRepost && repostUserDetails 
//                       ? repostUserDetails.name || "Unknown User" 
//                       : name || "Unknown User"
//                     }
//                   </h6>
//                   {((isRepost && repostUserDetails?.verified) || (!isRepost && userDetails?.verified)) && (
//                     <Badge bg="primary" className="verified-badge ms-1">
//                       ✓
//                     </Badge>
//                   )}
//                 </div>
//                 <div className="user-details">
//                   <span className="text-muted designation">
//                     {isRepost && repostUserDetails 
//                       ? repostUserDetails.jobTitle || repostUserDetails.designation || "No designation available"
//                       : userDetails?.jobTitle || designation || "No designation available"
//                     }
//                   </span>
//                   {console.log("repostUserDetails:", repostUserDetails?.userId)}

// <span className="text-muted time-ago ms-2">
//   • {formatDate(
//       isRepost && 
//       repostUserDetails?.userId === post?.createdBy?._id 
//         ? post.createdAt 
//         : createdAt
//     )}
// </span>
//                  <span className="text-muted mx-1">reposted</span>
//                  <FaGlobe size={12} className="text-muted" />
//                 </div>
//               </Col>
//               <Col xs="auto">
//                 <Dropdown>
//                   <Dropdown.Toggle variant="light" id="dropdown-post-options" className="post-options-btn">
//                     <FaEllipsisH />
//                   </Dropdown.Toggle>
//                   <Dropdown.Menu>
//                     <Dropdown.Item onClick={toggleBookmark}>
//                       {bookmarked ? "Remove from Bookmarks" : "Save to Bookmarks"}
//                     </Dropdown.Item>
//                     <Dropdown.Item 
//                       ref={linkRef}
//                       onClick={copyLinkToClipboard}
//                     >
//                       <FaLink className="me-2" /> Copy Link
//                     </Dropdown.Item>
//                     {isOwner && (
//                       <>
//                         <Dropdown.Item onClick={() => setEditing(true)}>
//                           Edit Post
//                         </Dropdown.Item>
//                         <Dropdown.Item 
//                           onClick={() => setShowDeleteConfirm(true)}
//                           className="text-danger"
//                         >
//                           Delete Post
//                         </Dropdown.Item>
//                       </>
//                     )}
//                     <Dropdown.Item>Report</Dropdown.Item>
//                     <Dropdown.Item onClick={handleRefresh}>
//                       <FaSync className="me-2" /> Refresh
//                     </Dropdown.Item>
//                   </Dropdown.Menu>
//                 </Dropdown>
                
//                 <Overlay target={linkRef.current} show={copied} placement="top">
//                   {(props) => (
//                     <Tooltip id="copied-tooltip" {...props}>
//                       Link copied to clipboard!
//                     </Tooltip>
//                   )}
//                 </Overlay>
//               </Col>
//             </Row>
//           </Card.Body>
//         </div>
        
//         {/* Repost Comment */}
//         {repostComment && (
//           <div className="repost-comment mt-2 p-2 bg-white rounded border">
//             <p className="mb-0 text-dark small">{repostComment}</p>
//           </div>
//             )}
//            </div>
//            </div>
//            </div>
//            )}
          
//           <Card.Body className="post-header">
//             <Row className="align-items-center">
//               <Col xs="auto">
//                 <div className="profile-picture-container-post">
//                   <img
//                     src={
//                       isRepost && originalPostUserDetails 
//                         ? originalPostUserDetails.profilePicture || `https://ui-avatars.com/api/?name=${originalPostUserDetails.name || "User"}&size=50&background=random`
//                         : profilePicture || `https://ui-avatars.com/api/?name=${name || "User"}&size=50&background=random`
//                     }
//                     alt="Profile"
//                     className="profile-picture"
//                     onClick={() => handleProfileClick(isRepost ? originalPostDetails?.createdBy?._id : userId)}
//                   />
//                   <div className="online-indicator"></div>
//                 </div>
//               </Col>
//               <Col className="ps-0">
//                 <div className="d-flex align-items-center">
//                   <h6 
//                     className="mb-0 user-name user-link" 
//                     onClick={() => handleProfileClick(isRepost ? originalPostDetails?.createdBy?._id : userId)}
//                   >
//                     {isRepost && originalPostUserDetails 
//                       ? originalPostUserDetails.name || "Unknown User" 
//                       : name || "Unknown User"
//                     }
//                   </h6>
//                   {((isRepost && originalPostUserDetails?.verified) || (!isRepost && userDetails?.verified)) && (
//                     <Badge bg="primary" className="verified-badge ms-1">
//                       ✓
//                     </Badge>
//                   )}
//                 </div>
//                 <div className="user-details">
//                   <span className="text-muted designation">
//                     {isRepost && originalPostUserDetails 
//                       ? originalPostUserDetails.jobTitle || originalPostUserDetails.designation || "No designation available"
//                       : userDetails?.jobTitle || designation || "No designation available"
//                     }
//                   </span>
//                   <span className="text-muted time-ago ms-2">
//                     • {formatDate(isRepost && originalPostDetails ? originalPostDetails.createdAt : createdAt)}
//                   </span>
//                 </div>
//               </Col>
//               <Col xs="auto">
//                 <Dropdown>
//                   <Dropdown.Toggle variant="light" id="dropdown-post-options" className="post-options-btn">
//                     <FaEllipsisH />
//                   </Dropdown.Toggle>
//                   <Dropdown.Menu>
//                     <Dropdown.Item onClick={toggleBookmark}>
//                       {bookmarked ? "Remove from Bookmarks" : "Save to Bookmarks"}
//                     </Dropdown.Item>
//                     <Dropdown.Item 
//                       ref={linkRef}
//                       onClick={copyLinkToClipboard}
//                     >
//                       <FaLink className="me-2" /> Copy Link
//                     </Dropdown.Item>
//                     {isOwner && (
//                       <>
//                         <Dropdown.Item onClick={() => setEditing(true)}>
//                           Edit Post
//                         </Dropdown.Item>
//                         <Dropdown.Item 
//                           onClick={() => setShowDeleteConfirm(true)}
//                           className="text-danger"
//                         >
//                           Delete Post
//                         </Dropdown.Item>
//                       </>
//                     )}
//                     <Dropdown.Item>Report</Dropdown.Item>
//                     <Dropdown.Item onClick={handleRefresh}>
//                       <FaSync className="me-2" /> Refresh
//                     </Dropdown.Item>
//                   </Dropdown.Menu>
//                 </Dropdown>
                
//                 <Overlay target={linkRef.current} show={copied} placement="top">
//                   {(props) => (
//                     <Tooltip id="copied-tooltip" {...props}>
//                       Link copied to clipboard!
//                     </Tooltip>
//                   )}
//                 </Overlay>
//               </Col>
//             </Row>
//           </Card.Body>

//           <Card.Body className="post-content">
//             {editing ? (
//               <div className="edit-post-container">
//                 <Form.Control
//                   as="textarea"
//                   rows={3}
//                   value={editContent}
//                   onChange={(e) => setEditContent(e.target.value)}
//                   className="mb-2"
//                 />
//                 <div className="d-flex justify-content-end">
//                   <Button 
//                     variant="outline-secondary" 
//                     size="sm" 
//                     onClick={() => setEditing(false)}
//                     className="me-2"
//                   >
//                     Cancel
//                   </Button>
//                   <Button 
//                     variant="primary" 
//                     size="sm" 
//                     onClick={handlePostEdit}
//                   >
//                     Save
//                   </Button>
//                 </div>
//               </div>
//             ) : (
//               <p className="post-text">
//                 {parseContent(isRepost && originalPostDetails ? originalPostDetails.content : content)}
//               </p>
//             )}
            
//             {(imageUrl || (isRepost && originalPostDetails?.imageUrl)) && !(videoUrl || (isRepost && originalPostDetails?.videoUrl)) && (
//               <div className="post-image-container">
//                 <img 
//                   src={isRepost && originalPostDetails?.imageUrl ? originalPostDetails.imageUrl : imageUrl} 
//                   alt="Post Content" 
//                   className="post-image" 
//                 />
//               </div>
//             )}
            
//             {(videoUrl || (isRepost && originalPostDetails?.videoUrl)) && !videoError && (
//               <div className="post-video-container">
//                 <ReactPlayer
//                   url={isRepost && originalPostDetails?.videoUrl ? originalPostDetails.videoUrl : videoUrl}
//                   controls
//                   width="100%"
//                   height="100%"
//                   onError={handleVideoError}
//                   config={{
//                     file: {
//                       attributes: {
//                         crossOrigin: "anonymous",
//                       },
//                     },
//                   }}
//                 />
//               </div>
//             )}
            
//             {videoError && (
//               <Alert variant="warning" className="mt-3">
//                 <FaImage className="me-2" />
//                 Video failed to load. The file may be corrupted or in an unsupported format.
//               </Alert>
//             )}
            
//             {poll && (
//               <div className="post-poll mt-3">
//                 <h6>{poll.question}</h6>
//                 {poll.options.map((option) => {
//                   const percentage = voted 
//                     ? option.votes.length > 0 
//                       ? Math.round((option.votes.length / poll.totalVotes) * 100) 
//                       : 0 
//                     : null;
                  
//                   return (
//                     <div 
//                       key={option._id} 
//                       className={`poll-option ${voted ? 'voted' : ''} ${selectedPollOption === option._id ? 'selected' : ''}`}
//                       onClick={() => !voted && handlePollVote(option._id)}
//                     >
//                       <div className="poll-option-text">
//                         <span>{option.text}</span>
//                         {voted && <span className="poll-percentage">{percentage}%</span>}
//                       </div>
//                       {voted && (
//                         <div className="poll-progress">
//                           <div 
//                             className="poll-progress-bar" 
//                             style={{ width: `${percentage}%` }}
//                           ></div>
//                         </div>
//                       )}
//                     </div>
//                   );
//                 })}
//                 <div className="poll-footer">
//                   <small className="text-muted">
//                     {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''} • 
//                     {voted ? ' You voted' : ' Not voted yet'} • 
//                     Ends {formatDate(poll.endTime)}
//                   </small>
//                 </div>
//               </div>
//             )}
//           </Card.Body>

//           <Card.Footer className="post-footer">
//             <div className="post-stats">
//               {likeCount > 0 && (
//                 <span className="likes-count">
//                   <FaHeart className="text-danger me-1" />
//                   {likeCount}
//                 </span>
//               )}
//               {repostCount > 0 && (
//                 <span className="reposts-count ms-3">
//                   <FaRetweet className="text-success me-1" />
//                   {repostCount}
//                 </span>
//               )}
//               {comments.length > 0 && (
//                 <span className="comments-count ms-3">
//                   <FaComment className="text-primary me-1" />
//                   {comments.length}
//                 </span>
//               )}
//             </div>
            
//             <div className="post-actions">
//               <Button
//                 variant="light"
//                 className={`action-btn like-btn ${liked ? "liked" : ""}`}
//                 onClick={toggleLike}
//                 disabled={saving}
//               >
//                 {saving ? (
//                   <Spinner animation="border" size="sm" />
//                 ) : liked ? (
//                   <FaHeart className="icon text-danger" />
//                 ) : (
//                   <FaRegHeart className="icon" />
//                 )}
//                 <span className="button-text ms-1">Like</span>
//               </Button>

//               <Button
//                 variant="light"
//                 className="action-btn comment-btn"
//                 onClick={() => setShowCommentModal(true)}
//               >
//                 <FaComment className="icon" />
//                 <span className="button-text ms-1">Comment</span>
//               </Button>

//               <Button 
//                 variant="light" 
//                 className={`action-btn repost-btn ${reposted ? "reposted" : ""}`}
//                 onClick={() => setShowRepostModal(true)}
//               >
//                 <FaRetweet className="icon" />
//                 <span className="button-text">Repost</span>
//               </Button>
              
//               <Button 
//                 variant="light" 
//                 className="action-btn share-btn"
//                 ref={linkRef}
//                 onClick={copyLinkToClipboard}
//               >
//                 <FaShare className="icon" />
//                 <span className="button-text">Share</span>
//               </Button>
              
//               <Button 
//                 variant="light" 
//                 className="action-btn bookmark-btn ms-auto"
//                 onClick={toggleBookmark}
//               >
//                 {bookmarked ? (
//                   <FaBookmark className="icon text-warning" />
//                 ) : (
//                   <FaRegBookmark className="icon" />
//                 )}
//               </Button>
//             </div>
//           </Card.Footer>
//         </Card>
//       </div>

//       {/* Comment Modal */}
//       <Modal
//         show={showCommentModal}
//         onHide={() => {
//           setShowCommentModal(false);
//           setShowEmojiPicker(false);
//           setShowGifPicker(false);
//           setGifUrl("");
//         }}
//         centered
//         size="lg"
//         className="comment-modal"
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>
//             <div className="d-flex align-items-center">
//               <FaComment className="me-2" />
//               Comments
//               {comments.length > 0 && (
//                 <Badge bg="secondary" className="ms-2">
//                   {comments.length}
//                 </Badge>
//               )}
//             </div>
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ maxHeight: "60vh", overflowY: "auto" }}>
//           <div className="comment-input-container">
//             <div className="d-flex">
//               <img
//                 src={
//                   localStorage.getItem("profilePicture") ||
//                   `https://ui-avatars.com/api/?name=${localStorage.getItem("name") || "User"}&size=40`
//                 }
//                 alt="Your profile"
//                 className="comment-user-picture me-2"
//               />
//               <div className="comment-input-wrapper flex-grow-1">
//                 <Form onSubmit={handleCommentSubmit}>
//                   <InputGroup>
//                     <Form.Control
//                       as="textarea"
//                       rows={2}
//                       placeholder="Write a comment..."
//                       value={comment}
//                       onChange={(e) => setComment(e.target.value)}
//                       disabled={loading}
//                       className="comment-textarea"
//                     />
//                   </InputGroup>
//                   {gifUrl && (
//                     <div className="selected-gif-preview mt-2">
//                       <img src={gifUrl} alt="Selected GIF" className="comment-gif-preview" />
//                       <Button 
//                         variant="outline-danger" 
//                         size="sm" 
//                         onClick={() => setGifUrl("")}
//                         className="remove-gif-btn"
//                       >
//                         Remove GIF
//                       </Button>
//                     </div>
//                   )}
//                   <div className="comment-actions d-flex justify-content-between align-items-center mt-2">
//                     <div className="d-flex align-items-center">
//                       <Button
//                         variant="light"
//                         size="sm"
//                         onClick={() => {
//                           setShowEmojiPicker(!showEmojiPicker);
//                           setShowGifPicker(false);
//                         }}
//                         type="button"
//                       >
//                         <FaSmile />
//                       </Button>
//                       <Button 
//                         variant="light" 
//                         size="sm" 
//                         type="button" 
//                         className="ms-2"
//                         onClick={() => {
//                           setShowGifPicker(!showGifPicker);
//                           setShowEmojiPicker(false);
//                           if (!showGifPicker) fetchGifs();
//                         }}
//                       >
//                         <FaGift /> GIF
//                       </Button>
//                     </div>
//                     <Button
//                       variant="primary"
//                       type="submit"
//                       disabled={loading || (!comment.trim() && !gifUrl)}
//                       size="sm"
//                     >
//                       {loading ? "Posting..." : "Post"}
//                     </Button>
//                   </div>
//                 </Form>
                
//                 {showEmojiPicker && (
//                   <div className="emoji-picker-container">
//                     <Picker onEmojiClick={onEmojiClick} />
//                   </div>
//                 )}
                
//                 {showGifPicker && (
//                   <div className="gif-picker-container">
//                     <InputGroup size="sm" className="mb-2">
//                       <Form.Control
//                         placeholder="Search GIFs..."
//                         value={gifSearch}
//                         onChange={(e) => setGifSearch(e.target.value)}
//                       />
//                       <Button 
//                         variant="primary"
//                         onClick={() => fetchGifs(gifSearch)}
//                       >
//                         Search
//                       </Button>
//                     </InputGroup>
//                     <div className="gif-grid">
//                       {gifs.map((gif) => (
//                         <img
//                           key={gif.id}
//                           src={gif.preview || gif.url}
//                           alt={gif.title}
//                           className="gif-option"
//                           onClick={() => addGifToComment(gif)}
//                         />
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="comments-list mt-3">
//             {comments.length === 0 && (
//               <div className="text-center py-4 text-muted">
//                 <FaComment size={24} className="mb-2" />
//                 <p>No comments yet. Be the first to comment!</p>
//               </div>
//             )}
//             {comments.map((comment) => (
//               <div key={comment._id} className="comment-item mb-3">
//                 <div className="d-flex">
//                   <img
//                     src={
//                       comment.createdBy?.profilePicture ||
//                       `https://ui-avatars.com/api/?name=${
//                         comment.createdBy?.name || "User"
//                       }&size=40`
//                     }
//                     alt="Commenter"
//                     className="commenter-picture me-2"
//                   />
//                   <div className="comment-content flex-grow-1">
//                     <div className="comment-header d-flex justify-content-between align-items-start mb-1">
//                       <div>
//                         <strong 
//                           className="commenter-name user-link"
//                           onClick={() => handleProfileClick(comment.createdBy?._id)}
//                         >
//                           {comment.createdBy?.name || "Unknown User"}
//                         </strong>
//                         <small className="text-muted ms-2">
//                           {formatDate(comment.createdAt)}
//                         </small>
//                       </div>
//                       {comment.createdBy?._id === currentUser && (
//                         <Dropdown>
//                           <Dropdown.Toggle variant="light" size="sm" id="dropdown-comment-options" className="comment-options-btn">
//                             <FaEllipsisH />
//                           </Dropdown.Toggle>
//                           <Dropdown.Menu>
//                             <Dropdown.Item 
//                               onClick={() => {
//                                 const newContent = prompt(
//                                   "Edit your comment:",
//                                   comment.textContent || comment.content
//                                 );
//                                 if (newContent && newContent !== comment.content) {
//                                   handleCommentUpdate(comment._id, newContent);
//                                 }
//                               }}
//                             >
//                               Edit
//                             </Dropdown.Item>
//                             <Dropdown.Item 
//                               onClick={() => {
//                                 if (
//                                   window.confirm(
//                                     "Are you sure you want to delete this comment?"
//                                   )
//                                 ) {
//                                   handleCommentDelete(comment._id);
//                                 }
//                               }}
//                             >
//                               Delete
//                             </Dropdown.Item>
//                           </Dropdown.Menu>
//                         </Dropdown>
//                       )}
//                     </div>
//                     {comment.hasGif && (
//                       <div className="comment-gif-container mb-2">
//                         <img src={comment.gifUrl} alt="Comment GIF" className="comment-gif" />
//                       </div>
//                     )}
//                     {comment.textContent && (
//                       <p className="comment-text mb-0">
//                         {comment.textContent.split(' ').map((word, i) => {
//                           // Check if word is an emoji (using a simple heuristic)
//                           const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
//                           if (emojiRegex.test(word)) {
//                             return <span key={i} className="comment-emoji">{word} </span>;
//                           }
//                           return word + ' ';
//                         })}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </Modal.Body>
//       </Modal>

//       {/* Repost Modal */}
//       <Modal
//         show={showRepostModal}
//         onHide={() => setShowRepostModal(false)}
//         centered
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Repost</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           <Form.Group className="mb-3">
//             <Form.Label>Add your comment (optional)</Form.Label>
//             <Form.Control
//               as="textarea"
//               rows={3}
//               value={repostCommentText}
//               onChange={(e) => setRepostCommentText(e.target.value)}
//               placeholder="Add your thoughts..."
//             />
//           </Form.Group>
//         </Modal.Body>
//         <Modal.Footer>
//           <Button 
//             variant="outline-secondary" 
//             onClick={() => setShowRepostModal(false)}
//           >
//             Cancel
//           </Button>
//           <Button 
//             variant="outline-primary" 
//             onClick={() => handleRepost(false)}
//             disabled={saving}
//           >
//             {saving ? <Spinner size="sm" /> : "Repost"}
//           </Button>
//           <Button 
//             variant="primary" 
//             onClick={() => handleRepost(true)}
//             disabled={saving}
//           >
//             {saving ? <Spinner size="sm" /> : "Repost with Comment"}
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       {/* Delete Confirmation Modal */}
//       <Modal
//         show={showDeleteConfirm}
//         onHide={() => setShowDeleteConfirm(false)}
//         centered
//       >
//         <Modal.Header closeButton>
//           <Modal.Title>Confirm Delete</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           Are you sure you want to delete this post? This action cannot be undone.
//         </Modal.Body>
//         <Modal.Footer>
//           <Button 
//             variant="outline-secondary" 
//             onClick={() => setShowDeleteConfirm(false)}
//           >
//             Cancel
//           </Button>
//           <Button 
//             variant="danger" 
//             onClick={handlePostDelete}
//           >
//             Delete
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       <Overlay target={linkRef.current} show={showLinkTooltip} placement="top">
//         {(props) => (
//           <Tooltip id="link-tooltip" {...props}>
//             Link copied to clipboard!
//           </Tooltip>
//         )}
//       </Overlay>
//     </>
//   );
// };

// export default Postcard;

