import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
  Modal,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";
import { FiImage, FiVideo, FiFile, FiX, FiGift } from "react-icons/fi";
import "./CreatePostCard.css";
import Navbar from '../navbar/Navbar';

const CreatePostCard = ({ userId }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState(null);
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("general");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGifModal, setShowGifModal] = useState(false);
  const [gifs, setGifs] = useState([]);
  const [gifSearch, setGifSearch] = useState("");
  const [selectedGif, setSelectedGif] = useState(null);

  // Push notification states
  const [pushPermission, setPushPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // On mount, check existing subscription
  useEffect(() => {
    async function checkSubscription() {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const subscribed = await notificationService.checkAndRenewSubscription();
        setIsSubscribed(subscribed);
      }
    }
    checkSubscription();
  }, []);

  // Search for GIFs
  const searchGifs = async (query) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${apiUrl}/api/posts/gifs/search?query=${query}`);
      setGifs(response.data);
    } catch (error) {
      console.error("Error searching GIFs:", error);
      setError("Failed to search GIFs");
    }
  };

  // Get trending GIFs
  const getTrendingGifs = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${apiUrl}/api/posts/gifs/trending`);
      setGifs(response.data);
    } catch (error) {
      console.error("Error fetching trending GIFs:", error);
      setError("Failed to fetch trending GIFs");
    }
  };

  // Handle GIF selection
  const handleGifSelect = (gif) => {
    setSelectedGif(gif);
    setMediaUrl(gif.url);
    setMediaType("gif");
    setShowGifModal(false);
  };

  // Request permission and subscribe to push notifications
  const subscribeToPush = async () => {
    try {
      if (!("serviceWorker" in navigator && "PushManager" in window)) {
        alert("Push notifications are not supported in this browser.");
        return false;
      }

      if (pushPermission !== "granted") {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        if (permission !== "granted") {
          alert("Push notification permission denied.");
          return false;
        }
      }

      // This would be your actual subscription logic
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      setError("Failed to subscribe to push notifications.");
      return false;
    }
  };

  // Function to send notification
  const sendPostNotification = async (postId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;

      const notificationTitle = title
        ? `New Post: ${title}`
        : "New Post Created";
      const notificationMessage = content
        ? `You created: "${content.substring(0, 30)}${
            content.length > 30 ? "..." : ""
          }"`
        : "You created a new post";

      await axios.post(`${apiUrl}/api/notifications`, {
        userId,
        title: notificationTitle,
        message: notificationMessage,
        type: "post",
        status: "unread",
        actionUrl: `/posts/${postId}`,
        createdBy: userId,
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  // const handleMediaUpload = async (file) => {
  //   try {
  //     setLoading(true);
  //     setError("");

  //     const formData = new FormData();
  //     formData.append("file", file);
  //     formData.append(
  //       "upload_preset",
  //       import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  //     );

  //     const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  //     if (!cloudName) {
  //       throw new Error(
  //         "Cloudinary cloud name not defined in environment variables"
  //       );
  //     }

  //     const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

  //     const response = await axios.post(cloudinaryUrl, formData);

  //     setMediaUrl(response.data.secure_url);
  //     setMediaType(file.type.startsWith("image") ? "image" : "video");
  //     setSelectedGif(null); // Clear any selected GIF
  //   } catch (error) {
  //     console.error("Cloudinary upload error:", error);
  //     setError("Failed to upload media. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
const handleMediaUpload = async (file) => {
  try {
    setLoading(true);
    setError("");

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Missing Cloudinary configuration in environment variables.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset); // 🔥 Required for unsigned uploads

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

    const response = await axios.post(cloudinaryUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      withCredentials: false, // 🔥 VERY IMPORTANT for Cloudinary
    });

    setMediaUrl(response.data.secure_url);
    setMediaType(file.type.startsWith("image") ? "image" : "video");
    setSelectedGif(null); // Clear any selected GIF
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    setError("Failed to upload media. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const handlePost = async () => {
    if (!content.trim()) {
      setError("Post content cannot be empty!");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const newPost = {
        title,
        content,
        imageUrl: mediaType === "image" || mediaType === "gif" ? mediaUrl : "",
        videoUrl: mediaType === "video" ? mediaUrl : "",
        createdBy: userId,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        category,
        isPublic,
        postType: mediaType || "text",
      };

      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl)
        throw new Error("API URL not defined in environment variables");

      const response = await axios.post(`${apiUrl}/api/posts`, newPost);

      if (response.status === 200 || response.status === 201) {
        // After post creation, send notification in app
        await sendPostNotification(response.data._id);

        // Try to subscribe to push notifications (only if not subscribed)
        if (!isSubscribed) {
          await subscribeToPush();
        }

        alert("Post created successfully!");
        setTitle("");
        setContent("");
        setMediaUrl("");
        setMediaType(null);
        setTags("");
        setCategory("general");
        setIsPublic(true);
        setSelectedGif(null);
      } else {
        throw new Error("Failed to create post: " + response.statusText);
      }
    } catch (error) {
      console.error(
        "Post error:",
        error.response ? error.response.data : error.message
      );
      setError(
        "Something went wrong while creating the post. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (
      file &&
      (file.type.startsWith("image") || file.type.startsWith("video"))
    ) {
      handleMediaUpload(file);
    } else {
      setError("Please upload a valid image or video file.");
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type.startsWith("image") || file.type.startsWith("video"))
    ) {
      handleMediaUpload(file);
    } else {
      setError("Please upload a valid image or video file.");
    }
  };

  const removeMedia = () => {
    setMediaUrl("");
    setMediaType(null);
    setSelectedGif(null);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h1 className="text-center text-primary mb-4">Create a New Post</h1>
        
        <Card className="create-post-card shadow">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">Share Your Thoughts</h5>
          </Card.Header>
          
          <Card.Body onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            {error && (
              <Alert variant="danger" className="mt-3">
                {error}
              </Alert>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Title (Optional)</Form.Label>
              <Form.Control
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title to your post..."
                className="post-title-input"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Content <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="post-content-input"
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tags</Form.Label>
                  <Form.Control
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., news, coding, tech (comma separated)"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="general">General</option>
                    <option value="news">News</option>
                    <option value="technology">Technology</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="sports">Sports</option>
                    <option value="education">Education</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="custom-switch"
                label="Make this post public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
            </Form.Group>

            {mediaUrl && (
              <div className="media-preview mb-3 p-3 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6>Media Preview</h6>
                  <Button variant="outline-danger" size="sm" onClick={removeMedia}>
                    <FiX /> Remove
                  </Button>
                </div>
                {mediaType === "image" && (
                  <img
                    src={mediaUrl}
                    alt="Post media"
                    className="img-fluid rounded"
                  />
                )}
                {mediaType === "video" && (
                  <video src={mediaUrl} controls className="w-100 rounded" />
                )}
                {mediaType === "gif" && (
                  <div>
                    <img
                      src={mediaUrl}
                      alt="Selected GIF"
                      className="img-fluid rounded"
                    />
                    <Badge bg="info" className="mt-2">GIF</Badge>
                  </div>
                )}
              </div>
            )}

            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="d-flex gap-2">
                <input
                  type="file"
                  id="media-upload"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleFileInput}
                />
                <label
                  htmlFor="media-upload"
                  className="btn btn-outline-primary d-flex align-items-center"
                >
                  <FiImage className="me-1" /> Image/Video
                </label>
                
                <Button
                  variant="outline-info"
                  className="d-flex align-items-center"
                  onClick={() => {
                    setShowGifModal(true);
                    getTrendingGifs();
                  }}
                >
                  <FiGift className="me-1" /> GIF
                </Button>
              </div>

              <Button
                variant="primary"
                onClick={handlePost}
                disabled={loading || !content.trim()}
                className="d-flex align-items-center"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Posting...
                  </>
                ) : (
                  "Publish Post"
                )}
              </Button>
            </div>
          </Card.Body>
        </Card>

        {/* GIF Modal */}
        <Modal show={showGifModal} onHide={() => setShowGifModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Select a GIF</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <InputGroup className="mb-3">
              <Form.Control
                type="text"
                placeholder="Search for GIFs..."
                value={gifSearch}
                onChange={(e) => setGifSearch(e.target.value)}
              />
              <Button 
                variant="primary" 
                onClick={() => searchGifs(gifSearch)}
              >
                Search
              </Button>
            </InputGroup>
            
            <div className="gif-grid">
              {gifs.map((gif) => (
                <div 
                  key={gif.id} 
                  className="gif-item"
                  onClick={() => handleGifSelect(gif)}
                >
                  <img src={gif.preview || gif.url} alt={gif.title} />
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGifModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default CreatePostCard;