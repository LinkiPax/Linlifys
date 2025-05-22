import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import './ShortUpload.css'
import { 
  FiUpload, 
  FiX, 
  FiMusic, 
  FiHash, 
  FiAtSign,
  FiCheckCircle,
  FiEdit2
} from "react-icons/fi";
import { RiMagicLine } from "react-icons/ri";
import { IoMdAdd } from "react-icons/io";
import { BsEmojiSmile, BsArrowLeft } from "react-icons/bs";
import { MdSlowMotionVideo } from "react-icons/md";

const ShortUpload = () => {
  const [video, setVideo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [music, setMusic] = useState("");
  const [tags, setTags] = useState("");
  const [mentions, setMentions] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const formSectionRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check mobile view on resize
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll form section into view on mobile when video is selected
  useEffect(() => {
    if (isMobileView && preview && formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [preview, isMobileView]);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideo(file);
      setPreview(URL.createObjectURL(file));
    } else {
      alert("Please select a valid video file (MP4, MOV, etc.)");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!video) {
      alert("Please select a video to upload");
      return;
    }
  
    const formData = new FormData();
    formData.append("video", video);
    formData.append("caption", caption);
    formData.append("music", music);
    formData.append("tags", tags);
    formData.append("mentions", mentions);
    formData.append("userId", localStorage.getItem("userId"));
  
    try {
      setUploading(true);
      const res = await axios.post("http://localhost:5000/api/short/shorts", formData, {
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        },
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${localStorage.getItem("token")}` // Add if using auth
        },
      });
  
      if (res.data.message) {
        setUploadSuccess(true);
        setTimeout(() => {
          resetForm();
        }, 2000);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Upload failed", err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          "Upload failed. Please try again.";
      alert(errorMessage);
      setUploading(false);
      setProgress(0);
    }
  };
  const resetForm = () => {
    setCaption("");   
    setVideo(null);
    setPreview(null);
    setUploading(false);
    setProgress(0);
    setMusic("");
    setTags("");
    setMentions("");
    setShowAdvanced(false);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setVideo(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`short-upload-container ${isMobileView ? 'mobile' : 'desktop'}`}>
      {/* Mobile Header */}
      {isMobileView && preview && (
        <div className="mobile-header">
          <button onClick={removeVideo} className="back-button">
            <BsArrowLeft size={24} />
          </button>
          <h2>New Reel</h2>
          <button 
            onClick={handleUpload}
            disabled={!video || uploading}
            className={`upload-button ${uploadSuccess ? 'success' : ''}`}
          >
            {uploadSuccess ? 'Posted' : 'Share'}
          </button>
        </div>
      )}

      {/* Main Content Container with Scroll */}
      <div className="content-wrapper">
        {/* Upload Area */}
        {!preview && (
          <div 
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label htmlFor="videoInput" className="upload-label">
              <div className="upload-icon">
                <MdSlowMotionVideo size={48} />
              </div>
              <h3>Upload Short Video</h3>
              <p>Drag and drop your video here or click to browse</p>
              <div className="upload-button">
                Select Video
              </div>
              <input
                type="file"
                accept="video/*"
                id="videoInput"
                onChange={handleVideoSelect}
                ref={fileInputRef}
              />
            </label>
            <p className="format-info">MP4, MOV or AVI • 60MB max</p>
          </div>
        )}

        {/* Video Preview */}
        {preview && (
          <div className="video-preview-container">
            <video
              src={preview}
              controls
              className="video-preview"
            />
            {!isMobileView && (
              <button onClick={removeVideo} className="remove-video">
                <FiX />
              </button>
            )}
          </div>
        )}

        {/* Form Section */}
        {preview && (
          <div className="form-section" ref={formSectionRef}>
            {/* Caption */}
            <div className="caption-input">
              <div className="input-header">
                <FiEdit2 />
                <span>Caption</span>
                <span className="char-count">{caption.length}/150</span>
              </div>
              <textarea
                placeholder="Write a captivating caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength="150"
              />
              <button className="emoji-button">
                <BsEmojiSmile />
              </button>
            </div>

            {/* Advanced Options */}
            <div className="advanced-options">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="toggle-advanced"
              >
                <IoMdAdd className={`icon ${showAdvanced ? 'open' : ''}`} />
                {showAdvanced ? "Hide Options" : "More Options"}
              </button>

              {showAdvanced && (
                <div className="advanced-fields">
                  <div className="advanced-field">
                    <FiMusic className="field-icon" />
                    <input
                      type="text"
                      placeholder="Add music"
                      value={music}
                      onChange={(e) => setMusic(e.target.value)}
                    />
                  </div>
                  
                  <div className="advanced-field">
                    <FiHash className="field-icon" />
                    <input
                      type="text"
                      placeholder="Add tags (comma separated)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                  
                  <div className="advanced-field">
                    <FiAtSign className="field-icon" />
                    <input
                      type="text"
                      placeholder="Mention people"
                      value={mentions}
                      onChange={(e) => setMentions(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Enhance Button - Desktop Only */}
            {!isMobileView && (
              <button className="enhance-button">
                <RiMagicLine />
                <span>Enhance Video</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Area - Mobile Only */}
      {isMobileView && preview && (
        <div className="mobile-actions">
          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-text">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Button - Desktop Only */}
      {!isMobileView && preview && (
        <div className="desktop-actions">
          {/* Upload Progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-text">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!video || uploading}
            className={`upload-submit ${uploadSuccess ? 'success' : ''}`}
          >
            {uploadSuccess ? (
              <>
                <FiCheckCircle />
                <span>Uploaded Successfully!</span>
              </>
            ) : uploading ? (
              "Uploading..."
            ) : (
              "Post Reel"
            )}
          </button>

          {/* Privacy Notice */}
          <p className="privacy-notice">
            By posting, you agree to our Terms and acknowledge our Privacy Policy.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShortUpload;