import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  X,
  Plus,
  Heart,
  Chat,
  Send,
  Bookmark,
  EmojiSmile,
  ThreeDots,
  MusicNote,
  Trash
} from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import "./Status.css";

const Status = ({ userProfilePic }) => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState({});
  const [audio, setAudio] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicError, setMusicError] = useState("");
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  const progressInterval = useRef(null);
  const mediaInterval = useRef(null);
  const videoRef = useRef(null);
  const deleteMenuRef = useRef(null);
  const mediaContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 375, height: 667 });

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    fetchStatuses();
    
    const handleClickOutside = (event) => {
      if (deleteMenuRef.current && !deleteMenuRef.current.contains(event.target)) {
        setShowDeleteMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      stopIntervals();
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedStatus && mediaContainerRef.current) {
      const updateSize = () => {
        const rect = mediaContainerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [selectedStatus]);

  // Group statuses by user
  const groupStatusesByUser = (statusesArray) => {
    const grouped = {};
    
    statusesArray.forEach(status => {
      const userId = status.userId;
      if (!grouped[userId]) {
        grouped[userId] = {
          user: {
            _id: userId,
            name: status.name,
            profilePic: status.userProfilePic
          },
          statuses: []
        };
      }
      grouped[userId].statuses.push(status);
    });
    
    return Object.values(grouped);
  };

  const fetchStatuses = async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/statuses`
      );
      if (Array.isArray(data.statuses)) {
        setStatuses(data.statuses);
      }
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  };

  const fetchComments = async (statusId) => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/statuses/${statusId}/comments`
      );
      setComments(prev => ({ ...prev, [statusId]: data.comments }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleStatusClick = (userStatusGroup, userIndex) => {
    if (userStatusGroup.statuses.length > 0) {
      const firstStatus = userStatusGroup.statuses[0];
      setSelectedStatus(firstStatus);
      setCurrentUserIndex(userIndex);
      setCurrentIndex(0);
      setProgress(0);
      setMusicError("");
      setShowDeleteMenu(false);
      
      if (audio) {
        audio.pause();
        setIsMusicPlaying(false);
      }
      
      if (firstStatus.music && firstStatus.music.path) {
        playMusic(firstStatus.music);
      }
      
      startSlide();
      if (!comments[firstStatus._id]) {
        fetchComments(firstStatus._id);
      }
    }
  };

  const playMusic = async (musicData) => {
    try {
      if (audio) {
        audio.pause();
        setAudio(null);
      }

      const musicUrl = musicData.path;

      console.log('Attempting to play music from frontend path:', musicUrl);
      
      const testAudio = new Audio();
      testAudio.src = musicUrl;
      
      testAudio.addEventListener('canplaythrough', () => {
        console.log('Music can play through - file exists');
        
        const newAudio = new Audio(musicUrl);
        
        newAudio.addEventListener('error', (e) => {
          console.error('Audio element error:', e);
          setMusicError(`Cannot play music: ${musicData.name}`);
          setIsMusicPlaying(false);
        });
        
        newAudio.addEventListener('loadeddata', () => {
          console.log('Music loaded successfully');
        });

        setAudio(newAudio);
        
        newAudio.play().then(() => {
          setIsMusicPlaying(true);
          setMusicError("");
        }).catch(playError => {
          console.error('Play error:', playError);
          setMusicError(`Playback failed: ${musicData.name}`);
        });
        
        newAudio.onended = () => {
          setIsMusicPlaying(false);
        };
      });

      testAudio.addEventListener('error', (e) => {
        console.error('Music file not found:', musicUrl);
        setMusicError(`Music file not found: ${musicData.name}`);
      });

      testAudio.load();

    } catch (error) {
      console.error("Error playing music:", error);
      setMusicError(`Cannot play: ${musicData.name}`);
      setIsMusicPlaying(false);
    }
  };

  const toggleMusic = async () => {
    if (!audio) return;
    
    try {
      if (isMusicPlaying) {
        audio.pause();
        setIsMusicPlaying(false);
      } else {
        await audio.play();
        setIsMusicPlaying(true);
        setMusicError("");
      }
    } catch (error) {
      console.error("Error toggling music:", error);
      setMusicError("Failed to play music");
    }
  };

  const startSlide = () => {
    stopIntervals();
    if (!isPaused && selectedStatus) {
      progressInterval.current = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 100 : prev + 100 / 5));
      }, 100);
      mediaInterval.current = setTimeout(goToNext, 5000);
    }
  };

  const goToNext = () => {
    const groupedStatuses = groupStatusesByUser(statuses);
    
    if (selectedStatus && groupedStatuses[currentUserIndex]) {
      const currentUserGroup = groupedStatuses[currentUserIndex];
      
      // First, try to go to next status of same user
      if (currentIndex < currentUserGroup.statuses.length - 1) {
        const nextStatus = currentUserGroup.statuses[currentIndex + 1];
        setSelectedStatus(nextStatus);
        setCurrentIndex(currentIndex + 1);
        setProgress(0);
        
        if (audio) {
          audio.pause();
          setIsMusicPlaying(false);
        }
        if (nextStatus.music && nextStatus.music.path) {
          playMusic(nextStatus.music);
        }
        
        startSlide();
        if (!comments[nextStatus._id]) {
          fetchComments(nextStatus._id);
        }
      } 
      // If no more statuses for current user, go to next user
      else if (currentUserIndex < groupedStatuses.length - 1) {
        const nextUserGroup = groupedStatuses[currentUserIndex + 1];
        const nextUserFirstStatus = nextUserGroup.statuses[0];
        setSelectedStatus(nextUserFirstStatus);
        setCurrentUserIndex(currentUserIndex + 1);
        setCurrentIndex(0);
        setProgress(0);
        
        if (audio) {
          audio.pause();
          setIsMusicPlaying(false);
        }
        if (nextUserFirstStatus.music && nextUserFirstStatus.music.path) {
          playMusic(nextUserFirstStatus.music);
        }
        
        startSlide();
        if (!comments[nextUserFirstStatus._id]) {
          fetchComments(nextUserFirstStatus._id);
        }
      } 
      // If no more users, close modal
      else {
        closeModal();
      }
    }
  };

  const goToPrevious = () => {
    const groupedStatuses = groupStatusesByUser(statuses);
    
    if (selectedStatus && groupedStatuses[currentUserIndex]) {
      const currentUserGroup = groupedStatuses[currentUserIndex];
      
      // First, try to go to previous status of same user
      if (currentIndex > 0) {
        const prevStatus = currentUserGroup.statuses[currentIndex - 1];
        setSelectedStatus(prevStatus);
        setCurrentIndex(currentIndex - 1);
        setProgress(0);
        
        if (audio) {
          audio.pause();
          setIsMusicPlaying(false);
        }
        if (prevStatus.music && prevStatus.music.path) {
          playMusic(prevStatus.music);
        }
        
        startSlide();
        if (!comments[prevStatus._id]) {
          fetchComments(prevStatus._id);
        }
      } 
      // If no previous status for current user, go to previous user
      else if (currentUserIndex > 0) {
        const prevUserGroup = groupedStatuses[currentUserIndex - 1];
        const prevUserLastStatus = prevUserGroup.statuses[prevUserGroup.statuses.length - 1];
        setSelectedStatus(prevUserLastStatus);
        setCurrentUserIndex(currentUserIndex - 1);
        setCurrentIndex(prevUserGroup.statuses.length - 1);
        setProgress(0);
        
        if (audio) {
          audio.pause();
          setIsMusicPlaying(false);
        }
        if (prevUserLastStatus.music && prevUserLastStatus.music.path) {
          playMusic(prevUserLastStatus.music);
        }
        
        startSlide();
        if (!comments[prevUserLastStatus._id]) {
          fetchComments(prevUserLastStatus._id);
        }
      }
    }
  };

  const closeModal = () => {
    if (audio) {
      audio.pause();
      setIsMusicPlaying(false);
    }
    
    setSelectedStatus(null);
    setShowComments(false);
    setCommentText("");
    setMusicError("");
    setShowDeleteMenu(false);
    stopIntervals();
    setIsPaused(false);
    setCurrentIndex(0);
    setCurrentUserIndex(0);
  };

  const stopIntervals = () => {
    clearInterval(progressInterval.current);
    clearTimeout(mediaInterval.current);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      stopIntervals();
      if (videoRef.current) videoRef.current.pause();
      if (audio && isMusicPlaying) audio.pause();
    } else {
      startSlide();
      if (videoRef.current) videoRef.current.play();
      if (audio && isMusicPlaying) audio.play().catch(e => console.error('Error resuming music:', e));
    }
  };

  const handleLike = async (statusId) => {
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/statuses/${statusId}/like`,
        { 
          userId,
          userName,
          userProfilePic 
        }
      );

      setStatuses(prev => prev.map(status => 
        status._id === statusId 
          ? { ...status, likes: data.likes }
          : status
      ));

      if (selectedStatus && selectedStatus._id === statusId) {
        setSelectedStatus(prev => ({ ...prev, likes: data.likes }));
      }
    } catch (error) {
      console.error("Error liking status:", error);
    }
  };

  const handleComment = async (statusId) => {
    if (!commentText.trim()) return;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/statuses/${statusId}/comment`,
        {
          userId,
          userName,
          userProfilePic,
          text: commentText
        }
      );

      setComments(prev => ({
        ...prev,
        [statusId]: [...(prev[statusId] || []), data.comment]
      }));

      setCommentText("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleDeleteComment = async (statusId, commentId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/statuses/${statusId}/comments/${commentId}`,
        { data: { userId } }
      );

      setComments(prev => ({
        ...prev,
        [statusId]: prev[statusId].filter(comment => comment._id !== commentId)
      }));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm('Are you sure you want to delete this status?')) {
      setShowDeleteMenu(false);
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/statuses/${statusId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setStatuses(prev => prev.filter(status => status._id !== statusId));
      
      if (selectedStatus && selectedStatus._id === statusId) {
        closeModal();
      }

      setShowDeleteMenu(false);
      alert('Status deleted successfully');
    } catch (error) {
      console.error("Error deleting status:", error);
      alert('Failed to delete status');
      setShowDeleteMenu(false);
    }
  };

  const isLiked = (status) => {
    return status.likes?.some(like => like.userId === userId) || false;
  };

  const likeCount = (status) => status.likes?.length || 0;

  const toggleComments = (statusId) => {
    setShowComments(!showComments);
    if (!comments[statusId]) {
      fetchComments(statusId);
    }
  };

  const handleCreateClick = () => {
    navigate("/status-editor");
  };

  // Function to apply filter styles
  const getFilterStyle = (filter) => {
    if (!filter) return {};
    
    const filterStyle = {};
    
    const cssFilters = [];
    if (filter.brightness !== undefined) cssFilters.push(`brightness(${filter.brightness}%)`);
    if (filter.contrast !== undefined) cssFilters.push(`contrast(${filter.contrast}%)`);
    if (filter.saturation !== undefined) cssFilters.push(`saturate(${filter.saturation}%)`);
    if (filter.blur !== undefined) cssFilters.push(`blur(${filter.blur}px)`);
    if (filter.hueRotate !== undefined) cssFilters.push(`hue-rotate(${filter.hueRotate}deg)`);
    
    if (cssFilters.length > 0) {
      filterStyle.filter = cssFilters.join(' ');
    }
    
    if (filter.dropShadow) {
      filterStyle.boxShadow = filter.dropShadow;
    }
    
    return filterStyle;
  };

  // Format music name for display
  const formatMusicName = (name) => {
    return name
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Convert percentage position to absolute pixels for rendering
  const getAbsolutePosition = (percentX, percentY) => {
    return {
      x: (percentX / 100) * containerSize.width,
      y: (percentY / 100) * containerSize.height
    };
  };

  // Get element style with proper positioning
  const getElementStyle = (element) => {
    const absolutePos = getAbsolutePosition(element.position?.x || 50, element.position?.y || 50);
    
    const baseStyle = {
      position: "absolute",
      left: `${absolutePos.x}px`,
      top: `${absolutePos.y}px`,
      transform: 'translate(-50%, -50%)',
      userSelect: 'none',
      pointerEvents: 'none'
    };

    if (element.text) {
      return {
        ...baseStyle,
        ...element.style,
        fontSize: `${element.style?.fontSize || 24}px`
      };
    } else if (element.url || element.type === 'emoji') {
      return {
        ...baseStyle,
        width: `${element.size || 50}px`,
        height: `${element.size || 50}px`
      };
    }
    
    return baseStyle;
  };

  // Get grouped statuses for display
  const groupedStatuses = groupStatusesByUser(statuses);

  // Get current status media - FIXED: Use the current status's media array
  const getCurrentMedia = () => {
    if (!selectedStatus) return null;
    
    // Each status has its own media array
    const mediaArray = selectedStatus.media || [];
    return mediaArray[currentIndex] || mediaArray[0] || null;
  };

  const currentMedia = getCurrentMedia();

  return (
    <div className="status-container">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-profile my-status" onClick={handleCreateClick}>
          <img
            className="profile-pic"
            src={userProfilePic || "/default-profile.png"}
            alt="Your Status"
          />
          <div className="plus-icon">
            <Plus size={16} />
          </div>
        </div>

        {groupedStatuses.map((userStatusGroup, index) => (
          <div
            key={userStatusGroup.user._id}
            className="status-profile"
            onClick={() => handleStatusClick(userStatusGroup, index)}
          >
            <img
              className="profile-pic"
              src={userStatusGroup.user.profilePic || "/default-profile.png"}
              alt={userStatusGroup.user.name}
            />
            {userStatusGroup.statuses.length > 1 && (
              <div className="status-count-badge">
                {userStatusGroup.statuses.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status Modal */}
      {selectedStatus && (
        <div className="status-modal" onClick={closeModal}>
          <div className="status-content" onClick={(e) => e.stopPropagation()}>
            {/* Progress Bars - Show progress for current user's statuses */}
            <div className="progress-container">
              {groupedStatuses[currentUserIndex]?.statuses.map((_, idx) => (
                <div key={idx} className="progress-track">
                  <div
                    className={`progress-bar ${currentIndex === idx ? "active" : ""}`}
                    style={{ 
                      width: currentIndex === idx ? `${progress}%` : 
                             idx < currentIndex ? "100%" : "0%" 
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="status-header">
              <div className="user-info">
                <img
                  className="profile-pic"
                  src={selectedStatus.userProfilePic || "/default-profile.png"}
                  alt={selectedStatus.name}
                />
                <span>{selectedStatus.name}</span>
                <span className="time-ago">
                  {new Date(selectedStatus.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              
              <div className="header-actions">
                {/* Music Indicator */}
                {selectedStatus.music && (
                  <div className="music-indicator">
                    <button 
                      className={`music-btn ${isMusicPlaying ? 'playing' : ''}`}
                      onClick={toggleMusic}
                      title={musicError || `Click to ${isMusicPlaying ? 'pause' : 'play'} music`}
                    >
                      <MusicNote size={16} />
                      <span>{formatMusicName(selectedStatus.music.name)}</span>
                      {musicError && <span className="music-error">⚠️</span>}
                    </button>
                  </div>
                )}
                
                {/* Delete button - only show if current user owns the status */}
                {selectedStatus.userId === userId && (
                  <div className="delete-menu-container" ref={deleteMenuRef}>
                    <button 
                      className="menu-btn"
                      onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                      title="More options"
                    >
                      <ThreeDots size={20} />
                    </button>
                    
                    {showDeleteMenu && (
                      <div className="delete-menu">
                        <button 
                          className="delete-menu-item"
                          onClick={() => handleDeleteStatus(selectedStatus._id)}
                        >
                          <Trash size={16} />
                          Delete Status
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <button className="close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Media Container with Overlays */}
            <div
              className="media-container"
              ref={mediaContainerRef}
              onDoubleClick={() => handleLike(selectedStatus._id)}
            >
              {currentMedia && currentMedia.endsWith(".mp4") ? (
                <video
                  ref={videoRef}
                  src={`${import.meta.env.VITE_API_URL}/${currentMedia}`}
                  className="status-media"
                  autoPlay
                  loop={false}
                  onClick={togglePause}
                  style={getFilterStyle(selectedStatus.filter)}
                />
              ) : currentMedia ? (
                <img
                  src={`${import.meta.env.VITE_API_URL}/${currentMedia}`}
                  alt="status"
                  className="status-media"
                  style={getFilterStyle(selectedStatus.filter)}
                />
              ) : (
                <div className="no-media-placeholder">
                  <p>No media available</p>
                </div>
              )}

              {/* Render Text Elements */}
              {selectedStatus.textElements && selectedStatus.textElements.map((textEl) => (
                <div
                  key={textEl.id}
                  className="status-text-element"
                  style={getElementStyle(textEl)}
                >
                  {textEl.text}
                </div>
              ))}

              {/* Render Sticker Elements */}
              {selectedStatus.stickerElements && selectedStatus.stickerElements.map((stickerEl) => (
                <div
                  key={stickerEl.id}
                  className="status-sticker-element"
                  style={getElementStyle(stickerEl)}
                >
                  <img 
                    src={stickerEl.url}
                    alt="sticker" 
                    className="sticker-img"
                    onError={(e) => {
                      console.error('Error loading sticker:', stickerEl.url);
                      const alternativePaths = [
                        stickerEl.url,
                        `${window.location.origin}${stickerEl.url}`,
                        `${import.meta.env.VITE_API_URL}${stickerEl.url}`
                      ];
                      
                      let currentTry = 0;
                      const tryNextPath = () => {
                        if (currentTry < alternativePaths.length) {
                          e.target.src = alternativePaths[currentTry];
                          currentTry++;
                        } else {
                          e.target.style.display = 'none';
                          console.error('All sticker paths failed:', alternativePaths);
                        }
                      };
                      
                      e.target.onerror = tryNextPath;
                      tryNextPath();
                    }}
                    onLoad={() => console.log('Sticker loaded successfully:', stickerEl.url)}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="status-actions">
              <div className="action-buttons">
                <button
                  className={`action-btn ${isLiked(selectedStatus) ? "liked" : ""}`}
                  onClick={() => handleLike(selectedStatus._id)}
                >
                  <Heart size={24} fill={isLiked(selectedStatus) ? "red" : "none"} />
                  <span>{likeCount(selectedStatus)}</span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => toggleComments(selectedStatus._id)}
                >
                  <Chat size={24} />
                  <span>{comments[selectedStatus._id]?.length || 0}</span>
                </button>
                <button className="action-btn">
                  <Send size={24} />
                </button>
                <button className="action-btn">
                  <Bookmark size={24} />
                </button>
              </div>

              {/* Caption */}
              {(selectedStatus.textElements && selectedStatus.textElements.length > 0) && (
                <div className="status-caption">
                  <strong>{selectedStatus.name}</strong> 
                  {selectedStatus.textElements[0].text}
                </div>
              )}
              
              {(!selectedStatus.textElements || selectedStatus.textElements.length === 0) && selectedStatus.text && (
                <div className="status-caption">
                  <strong>{selectedStatus.name}</strong> {selectedStatus.text}
                </div>
              )}

              {/* Comments Section */}
              {showComments && (
                <div className="comments-section">
                  <div className="comments-list">
                    {(comments[selectedStatus._id] || []).map((comment) => (
                      <div key={comment._id} className="comment">
                        <img
                          src={comment.userProfilePic || "/default-profile.png"}
                          alt={comment.userName}
                          className="comment-avatar"
                        />
                        <div className="comment-content">
                          <div className="comment-header">
                            <strong>{comment.userName}</strong>
                            {comment.userId === userId && (
                              <button
                                className="delete-comment"
                                onClick={() => handleDeleteComment(selectedStatus._id, comment._id)}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                          <p>{comment.text}</p>
                          <span className="comment-time">
                            {new Date(comment.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div className="comment-input">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleComment(selectedStatus._id)}
                    />
                    <button
                      onClick={() => handleComment(selectedStatus._id)}
                      disabled={!commentText.trim()}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <button
              className="nav-btn prev-btn"
              onClick={goToPrevious}
              disabled={currentUserIndex === 0 && currentIndex === 0}
            >
              <ArrowLeft size={24} />
            </button>
            <button
              className="nav-btn next-btn"
              onClick={goToNext}
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Status;