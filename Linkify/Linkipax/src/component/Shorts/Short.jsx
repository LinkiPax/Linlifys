import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShare,
  FaEllipsisH,
  FaMusic,
  FaTimes,
} from "react-icons/fa";
import { BiSolidDislike, BiDislike } from "react-icons/bi";
import "./Shorts.css";
import NavbarComponent from "../navbar/Navbar";

const Short = () => {
  // State management
  const [shorts, setShorts] = useState([]);
  const [activeShort, setActiveShort] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [quality, setQuality] = useState("720p");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const commentInputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
 // Handle scroll to load more shorts
  const handleScroll = useCallback(() => {
    if (!containerRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - (scrollTop + clientHeight) < 50) {
      setPage((prev) => prev + 1);
    }
  }, [loading, hasMore]);

  // Fetch initial shorts
  useEffect(() => {
    fetchShorts();
  }, []);

  // Load more shorts when page changes
  useEffect(() => {
    if (page > 1) {
      fetchShorts();
    }
  }, [page]);

  // Set up scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        navigateShort("next");
      } else if (e.key === "ArrowUp") {
        navigateShort("prev");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeShort, shorts.length]);

  // API functions
  const fetchShorts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/short/shorts?page=${page}&limit=5`
      );
      setShorts((prev) => [...prev, ...res.data]);
      setHasMore(res.data.length > 0);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching shorts:", err);
      setLoading(false);
    }
  };

  const refreshShorts = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/short/shorts?page=1&limit=${
        shorts.length
      }`
    );
    setShorts(res.data);
  };

  const handleLike = async (shortId) => {
    const userId = "123";
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/short/shorts/${shortId}/like`,
      { userId }
    );
    refreshShorts();
  };

  const handleDislike = async (shortId) => {
    const userId = "123";
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/short/shorts/${shortId}/dislike`,
      { userId }
    );
    refreshShorts();
  };

  const handleShare = async (shortId) => {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/short/shorts/${shortId}/share`
    );
    refreshShorts();
  };

  const handleComment = async (shortId) => {
    const userId = "123";
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/short/shorts/${shortId}/comment`,
      {
        userId,
        text: newComment,
      }
    );
    setNewComment("");
    refreshShorts();
  };

  // Helper functions
  const getVideoQualityUrl = (url) => {
    if (quality === "240p") return url.replace(".mp4", "_240p.mp4");
    if (quality === "480p") return url.replace(".mp4", "_480p.mp4");
    return url;
  };

 
  // Navigation functions
  const navigateShort = (direction) => {
    if (direction === "next" && activeShort < shorts.length - 1) {
      setActiveShort(activeShort + 1);
    } else if (direction === "prev" && activeShort > 0) {
      setActiveShort(activeShort - 1);
    }
    setIsPlaying(false);
    setShowComments(false);
    setShowDropdown(false);
  };

  // UI interaction functions
  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleComments = () => {
    setShowComments(!showComments);
    setShowDropdown(false);
    if (!showComments && commentInputRef.current) {
      setTimeout(() => commentInputRef.current.focus(), 300);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    setShowComments(false);
  };

  // Render functions
  const renderComments = () => {
    if (!shorts[activeShort]?.comments?.length) {
      return <div className="no-comments">No comments yet</div>;
    }

    return shorts[activeShort].comments.map((comment, index) => (
      <div key={index} className="comment">
        <img
          src={comment.user?.avatar || "https://i.pravatar.cc/150?img=3"}
          alt={comment.user?.username || "User"}
          className="comment-avatar"
        />
        <div className="comment-content">
          <span className="comment-username">
            @{comment.user?.username || "user" + index}
          </span>
          <p className="comment-text">{comment.text}</p>
        </div>
      </div>
    ));
  };

  const renderActionButtons = () => (
    <div className="action-buttons-left">
      <div
        className="action-button"
        onClick={() => handleLike(shorts[activeShort]._id)}
      >
        {shorts[activeShort].likes?.includes("123") ? (
          <FaHeart className="liked" />
        ) : (
          <FaRegHeart />
        )}
        <span>{shorts[activeShort].likes?.length || 0}</span>
        <div className="action-label">Like</div>
      </div>

      <div
        className="action-button"
        onClick={() => handleDislike(shorts[activeShort]._id)}
      >
        {shorts[activeShort].dislikes?.includes("123") ? (
          <BiSolidDislike className="disliked" />
        ) : (
          <BiDislike />
        )}
        <span>{shorts[activeShort].dislikes?.length || 0}</span>
        <div className="action-label">Dislike</div>
      </div>

      <div className="action-button" onClick={toggleComments}>
        <FaComment />
        <span>{shorts[activeShort].comments?.length || 0}</span>
        <div className="action-label">Comment</div>
      </div>

      <div
        className="action-button"
        onClick={() => handleShare(shorts[activeShort]._id)}
      >
        <FaShare />
        <span>{shorts[activeShort].shareCount || 0}</span>
        <div className="action-label">Share</div>
      </div>

      <div
        className="action-button"
        onClick={toggleDropdown}
        ref={dropdownRef}
      >
        <FaEllipsisH />
        <div className="action-label">Settings</div>
        {showDropdown && (
          <div className="dropdown-menu">
            <div className="dropdown-header">Playback Speed</div>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <div
                key={rate}
                className={`dropdown-item ${
                  playbackRate === rate ? "active" : ""
                }`}
                onClick={() => handlePlaybackRateChange(rate)}
              >
                {rate}x
              </div>
            ))}
            <div className="dropdown-divider"></div>
            <div className="dropdown-item">Report</div>
            <div className="dropdown-item">Save to favorites</div>
            <div className="dropdown-item">Not interested</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderVideoPlayer = () => (
    <div className="short-player">
      <div className="video-container" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={getVideoQualityUrl(shorts[activeShort].videoUrl)}
        loop
        className="short-video"
        autoPlay
      />
        {!isPlaying && <div className="play-overlay">▶</div>}
      </div>

      <div className="video-info">
        <div className="user-info">
          <img
            src={
              shorts[activeShort].user?.avatar || "https://i.pravatar.cc/300"
            }
            alt={shorts[activeShort].user?.username || "User"}
            className="user-avatar"
          />
          <span className="username">
            @{shorts[activeShort].user?.username || "user123"}
          </span>
        </div>
        <p className="caption">{shorts[activeShort].caption}</p>
        <div className="music-tag">
          <FaMusic /> {shorts[activeShort].music || "Original Sound"}
        </div>
      </div>

      <div className={`comment-section ${showComments ? "visible" : ""}`}>
        <div className="comment-header">
          <h3>Comments ({shorts[activeShort].comments?.length || 0})</h3>
          <button className="close-comments" onClick={toggleComments}>
            <FaTimes />
          </button>
        </div>
        <div className="comment-list">
          {renderComments()}
        </div>
        <div className="comment-input-container">
          <input
            ref={commentInputRef}
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && handleComment(shorts[activeShort]._id)
            }
          />
          <button
            className="comment-submit"
            onClick={() => handleComment(shorts[activeShort]._id)}
            disabled={!newComment.trim()}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );

  // Main render
  if (shorts.length === 0 && !loading) {
    return <div className="shorts-loader">Loading shorts...</div>;
  }

  return (
    <>
      <NavbarComponent />
      <div className="shorts-container" ref={containerRef}>
        {shorts.length > 0 && renderVideoPlayer()}
        {loading && <div className="loading-more">Loading more shorts...</div>}
      </div>
      {shorts.length > 0 && renderActionButtons()}
    </>
  );
};

export default Short;