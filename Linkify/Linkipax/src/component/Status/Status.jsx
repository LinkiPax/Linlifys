import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Plus,
  ThreeDots,
  Heart,
  Chat,
  Send,
  Bookmark,
} from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import "./Status.css";

const Status = ({ userProfilePic }) => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [caption, setCaption] = useState("");
  const [reactions, setReactions] = useState({});
  const [viewCount, setViewCount] = useState(0);

  const progressInterval = useRef(null);
  const mediaInterval = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const videoRef = useRef(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchStatuses();
    return () => stopIntervals();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/statuses`,
        {
          params: { userId },
        }
      );

      if (Array.isArray(data.statuses)) {
        setStatuses(data.statuses);
        // Initialize reactions
        const initialReactions = {};
        data.statuses.forEach((status) => {
          initialReactions[status._id] = {
            liked: status.likes?.includes(userId) || false,
            likeCount: status.likes?.length || 0,
          };
        });
        setReactions(initialReactions);
      } else {
        setError("Invalid data format received from the server.");
        setStatuses([]);
      }
    } catch (error) {
      console.error("Error fetching statuses:", error);
      setError("Failed to load statuses. Please try again later.");
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (status) => {
    setSelectedStatus(status);
    setCurrentIndex(0);
    setProgress(0);
    startSlide();
    incrementViewCount(status._id);
  };

  const incrementViewCount = async (statusId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/statuses/${statusId}/view`
      );
      setViewCount((prev) => prev + 1);
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }
  };

  const startSlide = () => {
    stopIntervals();
    if (!isPaused) {
      progressInterval.current = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 100 : prev + 100 / 5)); // 5 seconds per slide
      }, 100);
      mediaInterval.current = setTimeout(goToNext, 5000);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      stopIntervals();
      if (videoRef.current) videoRef.current.pause();
    } else {
      startSlide();
      if (videoRef.current) videoRef.current.play();
    }
  };

  const goToNext = () => {
    if (selectedStatus && currentIndex < selectedStatus.media.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      startSlide();
    } else {
      closeModal();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      startSlide();
    }
  };

  const closeModal = () => {
    setSelectedStatus(null);
    stopIntervals();
    setIsPaused(false);
  };

  const stopIntervals = () => {
    clearInterval(progressInterval.current);
    clearTimeout(mediaInterval.current);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (validFiles.length !== files.length) {
      setError("Only image and video files are allowed.");
    }

    setMediaFiles(validFiles);
  };

  const handlePostStatus = async () => {
    if (mediaFiles.length === 0) {
      setError("Please select at least one media file.");
      return;
    }

    const formData = new FormData();
    mediaFiles.forEach((file) => formData.append("media", file));
    formData.append("userId", userId);
    formData.append("caption", caption);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/statuses`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setShowPostModal(false);
      setMediaFiles([]);
      setCaption("");
      fetchStatuses();
    } catch (error) {
      console.error("Error posting status:", error);
      setError("Failed to post status. Please try again.");
    }
  };

  const handleReaction = async (statusId) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/statuses/${statusId}/like`,
        { userId }
      );
      setReactions((prev) => ({
        ...prev,
        [statusId]: {
          liked: data.liked,
          likeCount: data.likeCount,
        },
      }));
    } catch (error) {
      console.error("Error updating reaction:", error);
    }
  };

  const handleCreateClick = () => {
    navigate("/status-editor");
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      goToNext();
    } else if (touchEndX.current - touchStartX.current > 50) {
      goToPrevious();
    }
    setIsPaused(false);
  };

  return (
    <div className="status-container">
      <div className="status-bar">
        <div className="status-profile my-status" onClick={handleCreateClick}>
          <img
            className="profile-pic"
            src={userProfilePic || "default-profile.png"}
            alt="Your Status"
            onError={(e) => (e.target.src = "default-profile.png")}
          />
          <div className="plus-icon">
            <Plus size={16} />
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          statuses.map((status) => (
            <div
              key={status._id}
              className="status-profile"
              onClick={() => handleStatusClick(status)}
            >
              <img
                className="profile-pic"
                src={status.userProfilePic || "default-profile.png"}
                alt={status.user?.name || "User"}
                onError={(e) => (e.target.src = "default-profile.png")}
              />
              {status.unseen && <div className="unseen-badge"></div>}
            </div>
          ))
        )}
      </div>

      {selectedStatus && (
        <div
          className="status-modal"
          onClick={closeModal}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="status-content" onClick={(e) => e.stopPropagation()}>
            <div className="progress-container">
              {selectedStatus.media.map((_, idx) => (
                <div key={idx} className="progress-track">
                  <div
                    className={`progress-bar ${
                      currentIndex === idx ? "active" : ""
                    }`}
                    style={{
                      width:
                        currentIndex === idx
                          ? `${progress}%`
                          : idx < currentIndex
                          ? "100%"
                          : "0%",
                    }}
                  ></div>
                </div>
              ))}
            </div>

            <div className="status-header">
              <div className="user-info">
                <img
                  className="profile-pic"
                  src={selectedStatus.userProfilePic || "default-profile.png"}
                  alt={selectedStatus.user?.name || "User"}
                  onError={(e) => (e.target.src = "default-profile.png")}
                />
                <span>{selectedStatus.user?.name || "User"}</span>
                <span className="time-ago">2h ago</span>
              </div>
              <button
                className="close-btn"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="media-container"
              onDoubleClick={() => handleReaction(selectedStatus._id)}
            >
              {selectedStatus.media[currentIndex].endsWith(".mp4") ? (
                <video
                  ref={videoRef}
                  src={`${import.meta.env.VITE_API_URL}/${
                    selectedStatus.media[currentIndex]
                  }`}
                  className="status-media"
                  autoPlay
                  loop={false}
                  onClick={togglePause}
                />
              ) : (
                <img
                  src={`${import.meta.env.VITE_API_URL}/${
                    selectedStatus.media[currentIndex]
                  }`}
                  alt="status"
                  className="status-media"
                  loading="lazy"
                />
              )}
            </div>

            <div className="status-footer">
              <div className="action-buttons">
                <button
                  className={`like-btn ${
                    reactions[selectedStatus._id]?.liked ? "active" : ""
                  }`}
                  onClick={() => handleReaction(selectedStatus._id)}
                >
                  <Heart
                    size={24}
                    fill={reactions[selectedStatus._id]?.liked ? "red" : "none"}
                  />
                  <span>{reactions[selectedStatus._id]?.likeCount || 0}</span>
                </button>
                <button className="comment-btn">
                  <Chat size={24} />
                </button>
                <button className="share-btn">
                  <Send size={24} />
                </button>
                <button className="save-btn">
                  <Bookmark size={24} />
                </button>
              </div>

              {selectedStatus.caption && (
                <div className="status-caption">
                  <strong>{selectedStatus.user?.name || "User"}</strong>{" "}
                  {selectedStatus.caption}
                </div>
              )}

              <div className="status-meta">
                <span>{viewCount} views</span>
                <span className="dot-separator">•</span>
                <span>
                  {selectedStatus.createdAt
                    ? new Date(selectedStatus.createdAt).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )
                    : ""}
                </span>
              </div>
            </div>

            <button
              className="nav-btn prev-btn"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              aria-label="Previous"
            >
              <ArrowLeft size={24} />
            </button>
            <button
              className="nav-btn next-btn"
              onClick={goToNext}
              disabled={currentIndex === selectedStatus.media.length - 1}
              aria-label="Next"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {showPostModal && (
        <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
          <div
            className="post-status-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Create Status</h3>
              <button
                className="close-btn"
                onClick={() => setShowPostModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="media-preview">
              {mediaFiles.length > 0 ? (
                mediaFiles.map((file, index) =>
                  file.type.startsWith("video/") ? (
                    <video
                      key={index}
                      controls
                      src={URL.createObjectURL(file)}
                      className="preview-media"
                    />
                  ) : (
                    <img
                      key={index}
                      src={URL.createObjectURL(file)}
                      alt="preview"
                      className="preview-media"
                    />
                  )
                )
              ) : (
                <div className="empty-preview">
                  <Plus size={48} />
                  <p>Add photos or videos</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="caption">Caption</label>
              <textarea
                id="caption"
                placeholder="What's on your mind?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength="2200"
              />
            </div>

            <div className="file-upload">
              <label className="upload-btn">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />
                Add Media
              </label>
              <span className="file-info">
                {mediaFiles.length > 0
                  ? `${mediaFiles.length} file(s) selected`
                  : "No files selected"}
              </span>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setShowPostModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={handlePostStatus}
                disabled={mediaFiles.length === 0}
              >
                Post Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Status;
