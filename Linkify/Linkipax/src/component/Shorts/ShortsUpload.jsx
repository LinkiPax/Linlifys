// import React, { useState, useRef, useEffect } from "react";
// import axios from "axios";
// import "./ShortUpload.css";
// import {
//   FiUpload,
//   FiX,
//   FiMusic,
//   FiHash,
//   FiAtSign,
//   FiCheckCircle,
//   FiEdit2,
// } from "react-icons/fi";
// import { RiMagicLine } from "react-icons/ri";
// import { IoMdAdd } from "react-icons/io";
// import { BsEmojiSmile, BsArrowLeft } from "react-icons/bs";
// import { MdSlowMotionVideo } from "react-icons/md";

// const ShortUpload = () => {
//   const [video, setVideo] = useState(null);
//   const [preview, setPreview] = useState(null);
//   const [caption, setCaption] = useState("");
//   const [uploading, setUploading] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [showAdvanced, setShowAdvanced] = useState(false);
//   const [music, setMusic] = useState("");
//   const [tags, setTags] = useState("");
//   const [mentions, setMentions] = useState("");
//   const [uploadSuccess, setUploadSuccess] = useState(false);
//   const [isMobileView, setIsMobileView] = useState(false);
//   const formSectionRef = useRef(null);
//   const fileInputRef = useRef(null);

//   // Check mobile view on resize
//   useEffect(() => {
//     const checkMobile = () => setIsMobileView(window.innerWidth < 768);
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   // Auto-scroll form section into view on mobile when video is selected
//   useEffect(() => {
//     if (isMobileView && preview && formSectionRef.current) {
//       formSectionRef.current.scrollIntoView({
//         behavior: "smooth",
//         block: "nearest",
//       });
//     }
//   }, [preview, isMobileView]);

//   const handleVideoSelect = (e) => {
//     const file = e.target.files[0];
//     if (file && file.type.startsWith("video/")) {
//       setVideo(file);
//       setPreview(URL.createObjectURL(file));
//     } else {
//       alert("Please select a valid video file (MP4, MOV, etc.)");
//     }
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     const file = e.dataTransfer.files[0];
//     if (file && file.type.startsWith("video/")) {
//       setVideo(file);
//       setPreview(URL.createObjectURL(file));
//     }
//   };

//   const handleUpload = async () => {
//     if (!video) {
//       alert("Please select a video to upload");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("video", video);
//     formData.append("caption", caption);
//     formData.append("music", music);
//     formData.append("tags", tags);
//     formData.append("mentions", mentions);
//     formData.append("userId", localStorage.getItem("userId"));

//     try {
//       setUploading(true);
//       const res = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/short/shorts`,
//         formData,
//         {
//           onUploadProgress: (e) => {
//             const percent = Math.round((e.loaded * 100) / e.total);
//             setProgress(percent);
//           },
//           headers: {
//             "Content-Type": "multipart/form-data",
//             Authorization: `Bearer ${localStorage.getItem("token")}`, // Add if using auth
//           },
//         }
//       );

//       if (res.data.message) {
//         setUploadSuccess(true);
//         setTimeout(() => {
//           resetForm();
//         }, 2000);
//       } else {
//         throw new Error("Unexpected response format");
//       }
//     } catch (err) {
//       console.error("Upload failed", err);
//       const errorMessage =
//         err.response?.data?.error ||
//         err.response?.data?.message ||
//         "Upload failed. Please try again.";
//       alert(errorMessage);
//       setUploading(false);
//       setProgress(0);
//     }
//   };
//   const resetForm = () => {
//     setCaption("");
//     setVideo(null);
//     setPreview(null);
//     setUploading(false);
//     setProgress(0);
//     setMusic("");
//     setTags("");
//     setMentions("");
//     setShowAdvanced(false);
//     setUploadSuccess(false);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   const removeVideo = () => {
//     setVideo(null);
//     setPreview(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   };

//   return (
//     <div
//       className={`short-upload-container ${
//         isMobileView ? "mobile" : "desktop"
//       }`}
//     >
//       {/* Mobile Header */}
//       {isMobileView && preview && (
//         <div className="mobile-header">
//           <button onClick={removeVideo} className="back-button">
//             <BsArrowLeft size={24} />
//           </button>
//           <h2>New Reel</h2>
//           <button
//             onClick={handleUpload}
//             disabled={!video || uploading}
//             className={`upload-button ${uploadSuccess ? "success" : ""}`}
//           >
//             {uploadSuccess ? "Posted" : "Share"}
//           </button>
//         </div>
//       )}

//       {/* Main Content Container with Scroll */}
//       <div className="content-wrapper">
//         {/* Upload Area */}
//         {!preview && (
//           <div
//             className="upload-area"
//             onDragOver={handleDragOver}
//             onDrop={handleDrop}
//           >
//             <label htmlFor="videoInput" className="upload-label">
//               <div className="upload-icon">
//                 <MdSlowMotionVideo size={48} />
//               </div>
//               <h3>Upload Short Video</h3>
//               <p>Drag and drop your video here or click to browse</p>
//               <div className="upload-button">Select Video</div>
//               <input
//                 type="file"
//                 accept="video/*"
//                 id="videoInput"
//                 onChange={handleVideoSelect}
//                 ref={fileInputRef}
//               />
//             </label>
//             <p className="format-info">MP4, MOV or AVI • 60MB max</p>
//           </div>
//         )}

//         {/* Video Preview */}
//         {preview && (
//           <div className="video-preview-container">
//             <video src={preview} controls className="video-preview" />
//             {!isMobileView && (
//               <button onClick={removeVideo} className="remove-video">
//                 <FiX />
//               </button>
//             )}
//           </div>
//         )}

//         {/* Form Section */}
//         {preview && (
//           <div className="form-section" ref={formSectionRef}>
//             {/* Caption */}
//             <div className="caption-input">
//               <div className="input-header">
//                 <FiEdit2 />
//                 <span>Caption</span>
//                 <span className="char-count">{caption.length}/150</span>
//               </div>
//               <textarea
//                 placeholder="Write a captivating caption..."
//                 value={caption}
//                 onChange={(e) => setCaption(e.target.value)}
//                 maxLength="150"
//               />
//               <button className="emoji-button">
//                 <BsEmojiSmile />
//               </button>
//             </div>

//             {/* Advanced Options */}
//             <div className="advanced-options">
//               <button
//                 onClick={() => setShowAdvanced(!showAdvanced)}
//                 className="toggle-advanced"
//               >
//                 <IoMdAdd className={`icon ${showAdvanced ? "open" : ""}`} />
//                 {showAdvanced ? "Hide Options" : "More Options"}
//               </button>

//               {showAdvanced && (
//                 <div className="advanced-fields">
//                   <div className="advanced-field">
//                     <FiMusic className="field-icon" />
//                     <input
//                       type="text"
//                       placeholder="Add music"
//                       value={music}
//                       onChange={(e) => setMusic(e.target.value)}
//                     />
//                   </div>

//                   <div className="advanced-field">
//                     <FiHash className="field-icon" />
//                     <input
//                       type="text"
//                       placeholder="Add tags (comma separated)"
//                       value={tags}
//                       onChange={(e) => setTags(e.target.value)}
//                     />
//                   </div>

//                   <div className="advanced-field">
//                     <FiAtSign className="field-icon" />
//                     <input
//                       type="text"
//                       placeholder="Mention people"
//                       value={mentions}
//                       onChange={(e) => setMentions(e.target.value)}
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Enhance Button - Desktop Only */}
//             {!isMobileView && (
//               <button className="enhance-button">
//                 <RiMagicLine />
//                 <span>Enhance Video</span>
//               </button>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Bottom Action Area - Mobile Only */}
//       {isMobileView && preview && (
//         <div className="mobile-actions">
//           {/* Upload Progress */}
//           {uploading && (
//             <div className="upload-progress">
//               <div className="progress-text">
//                 <span>Uploading...</span>
//                 <span>{progress}%</span>
//               </div>
//               <div className="progress-bar">
//                 <div
//                   className="progress-fill"
//                   style={{ width: `${progress}%` }}
//                 ></div>
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Upload Button - Desktop Only */}
//       {!isMobileView && preview && (
//         <div className="desktop-actions">
//           {/* Upload Progress */}
//           {uploading && (
//             <div className="upload-progress">
//               <div className="progress-text">
//                 <span>Uploading...</span>
//                 <span>{progress}%</span>
//               </div>
//               <div className="progress-bar">
//                 <div
//                   className="progress-fill"
//                   style={{ width: `${progress}%` }}
//                 ></div>
//               </div>
//             </div>
//           )}

//           <button
//             onClick={handleUpload}
//             disabled={!video || uploading}
//             className={`upload-submit ${uploadSuccess ? "success" : ""}`}
//           >
//             {uploadSuccess ? (
//               <>
//                 <FiCheckCircle />
//                 <span>Uploaded Successfully!</span>
//               </>
//             ) : uploading ? (
//               "Uploading..."
//             ) : (
//               "Post Reel"
//             )}
//           </button>

//           {/* Privacy Notice */}
//           <p className="privacy-notice">
//             By posting, you agree to our Terms and acknowledge our Privacy
//             Policy.
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ShortUpload;
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ShortUpload.css";
import {
  FiUpload,
  FiX,
  FiMusic,
  FiHash,
  FiAtSign,
  FiCheckCircle,
  FiEdit2,
  FiLock,
  FiGlobe,
} from "react-icons/fi";
import { RiMagicLine, RiEmotionHappyLine } from "react-icons/ri";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { BsEmojiSmile, BsArrowLeft, BsThreeDotsVertical } from "react-icons/bs";
import { MdSlowMotionVideo, MdOutlineAudiotrack } from "react-icons/md";
import { TbLocation } from "react-icons/tb";

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [privacy, setPrivacy] = useState("public"); // public, private, friends
  const [location, setLocation] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const videoRef = useRef(null);
  const formSectionRef = useRef(null);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Check mobile view on resize
  useEffect(() => {
    const checkMobile = () => setIsMobileView(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-scroll form section into view on mobile when video is selected
  useEffect(() => {
    if (isMobileView && preview && formSectionRef.current) {
      formSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [preview, isMobileView]);

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideo(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Create a video element to get duration
      const videoElement = document.createElement('video');
      videoElement.src = previewUrl;
      videoElement.addEventListener('loadedmetadata', () => {
        setVideoDuration(videoElement.duration);
      });
    } else {
      alert("Please select a valid video file (MP4, MOV, etc.)");
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setThumbnail(file);
      setCoverPreview(URL.createObjectURL(file));
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
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
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
    formData.append("privacy", privacy);
    formData.append("location", location);
    if (thumbnail) {
      formData.append("thumbnail", thumbnail);
    }
    formData.append("userId", localStorage.getItem("userId"));

    try {
      setUploading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/short/shorts`,
        formData,
        {
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setProgress(percent);
          },
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

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
      const errorMessage =
        err.response?.data?.error ||
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
    setPrivacy("public");
    setLocation("");
    setThumbnail(null);
    setCoverPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const removeVideo = () => {
    setVideo(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeCover = () => {
    setThumbnail(null);
    setCoverPreview(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleVideoSeek = (e) => {
    if (!videoRef.current) return;
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * videoDuration;
    setCurrentVideoTime(time);
    videoRef.current.currentTime = time;
  };

  const addEmoji = (emoji) => {
    setCaption(caption + emoji);
    setShowEmojiPicker(false);
  };

  // Simple emoji list - in a real app you'd use a proper emoji picker library
  const emojis = ["😊", "😂", "❤️", "🔥", "👍", "🎉", "😍", "🤩", "😎", "👏"];

  return (
    <div
      className={`short-upload-container ${
        isMobileView ? "mobile" : "desktop"
      }`}
    >
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
            className={`upload-button ${uploadSuccess ? "success" : ""}`}
          >
            {uploadSuccess ? "Posted" : "Share"}
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
              <div className="upload-button">Select Video</div>
              <input
                type="file"
                accept="video/*"
                id="videoInput"
                onChange={handleVideoSelect}
                ref={fileInputRef}
              />
            </label>
            <p className="format-info">MP4, MOV or AVI • Up to 5 minutes</p>
          </div>
        )}

        {/* Video Preview */}
        {preview && (
          <div className="video-preview-container">
            <video 
              src={preview} 
              controls 
              className="video-preview" 
              ref={videoRef}
              onTimeUpdate={(e) => setCurrentVideoTime(e.target.currentTime)}
            />
            
            {/* Video timeline scrubber for cover selection */}
            {showCoverSelector && videoDuration > 0 && (
              <div className="timeline-scrubber">
                <div className="timeline" onClick={handleVideoSeek}>
                  <div 
                    className="timeline-progress" 
                    style={{width: `${(currentVideoTime / videoDuration) * 100}%`}}
                  ></div>
                  <div 
                    className="timeline-thumb" 
                    style={{left: `${(currentVideoTime / videoDuration) * 100}%`}}
                  ></div>
                </div>
                <p>Scroll through to select a cover frame</p>
              </div>
            )}
            
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
            {/* Cover Selection */}
            <div className="cover-selector">
              <div className="selector-header">
                <span>Cover</span>
                <button 
                  onClick={() => setShowCoverSelector(!showCoverSelector)}
                  className="toggle-selector"
                >
                  {showCoverSelector ? "Cancel" : "Choose Cover"}
                </button>
              </div>
              
              {coverPreview ? (
                <div className="cover-preview">
                  <img src={coverPreview} alt="Video cover" />
                  <button onClick={removeCover} className="remove-cover">
                    <IoMdClose />
                  </button>
                </div>
              ) : (
                <div className="cover-placeholder">
                  <div className="cover-upload">
                    <label htmlFor="coverInput" className="cover-label">
                      <MdOutlineAudiotrack size={24} />
                      <span>Upload custom thumbnail</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      id="coverInput"
                      onChange={handleCoverSelect}
                      ref={coverInputRef}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="caption-input">
              <div className="input-header">
                <FiEdit2 />
                <span>Caption</span>
                <span className="char-count">{caption.length}/150</span>
              </div>
              <div className="textarea-container">
                <textarea
                  placeholder="Write a captivating caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength="150"
                />
                <button 
                  className="emoji-button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <RiEmotionHappyLine />
                </button>
                
                {showEmojiPicker && (
                  <div className="emoji-picker">
                    {emojis.map((emoji, i) => (
                      <button key={i} onClick={() => addEmoji(emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="privacy-settings">
              <div className="settings-header">
                <FiLock />
                <span>Privacy Settings</span>
              </div>
              <div className="privacy-options">
                <button 
                  className={privacy === "public" ? "active" : ""}
                  onClick={() => setPrivacy("public")}
                >
                  <FiGlobe />
                  <span>Public</span>
                </button>
                <button 
                  className={privacy === "friends" ? "active" : ""}
                  onClick={() => setPrivacy("friends")}
                >
                  <FiLock />
                  <span>Friends</span>
                </button>
                <button 
                  className={privacy === "private" ? "active" : ""}
                  onClick={() => setPrivacy("private")}
                >
                  <FiLock />
                  <span>Private</span>
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="location-input">
              <div className="input-header">
                <TbLocation />
                <span>Add Location</span>
              </div>
              <input
                type="text"
                placeholder="Where was this taken?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Advanced Options */}
            <div className="advanced-options">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="toggle-advanced"
              >
                <IoMdAdd className={`icon ${showAdvanced ? "open" : ""}`} />
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
            className={`upload-submit ${uploadSuccess ? "success" : ""}`}
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
            By posting, you agree to our Terms and acknowledge our Privacy
            Policy.
          </p>
        </div>
      )}
    </div>
  );
};

export default ShortUpload;