import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import axios from "axios";
import notificationService from "../../services/notificationService"; // Adjust path as needed
import "./CreatePostCard.css";

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

  // Push notification states
  const [pushPermission, setPushPermission] = useState(Notification.permission);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // On mount, check existing subscription
  useEffect(() => {
    async function checkSubscription() {
      if (notificationService.isSupported) {
        const subscribed = await notificationService.checkAndRenewSubscription();
        setIsSubscribed(subscribed);
      }
    }
    checkSubscription();
  }, []);

  // Request permission and subscribe to push notifications
  const subscribeToPush = async () => {
    try {
      if (!notificationService.isSupported) {
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

      const subscription = await notificationService.subscribe(userId);
      if (subscription) {
        setIsSubscribed(true);
        // Optionally send subscription object to backend here if not done inside subscribe()
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/notifications/push-subscriptions`,
          {
            userId,
            subscription,
          }
        );
        return true;
      }
    } catch (err) {
      console.error("Push subscription error:", err);
      setError("Failed to subscribe to push notifications.");
      return false;
    }
  };

  // Function to send notification (existing backend API)
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

      // Optionally trigger push notification from backend here
      // e.g., your backend might send push notifications to all user subscriptions
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  const handleMediaUpload = async (file) => {
    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error(
          "Cloudinary cloud name not defined in environment variables"
        );
      }

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

      const response = await axios.post(cloudinaryUrl, formData);

      setMediaUrl(response.data.secure_url);
      setMediaType(file.type.startsWith("image") ? "image" : "video");
    } catch (error) {
      console.error("Cloudinary upload error:", error);
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
        imageUrl: mediaUrl,
        mediaType,
        createdBy: userId,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        category,
        isPublic,
        postType:
          mediaType === "video" || mediaType === "image" ? mediaType : "text",
        metadata: {},
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

  return (
    <Card className="create-post-card">
      <Card.Body onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title (optional)"
          />
        </Form.Group>

        <InputGroup>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            aria-label="Post content"
            className="post-input"
          />
        </InputGroup>

        <Form.Group className="mt-3">
          <Form.Label>Tags (comma separated)</Form.Label>
          <Form.Control
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., news, coding, tech"
          />
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label>Category</Form.Label>
          <Form.Control
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., general, events, tips"
          />
        </Form.Group>

        <Form.Group className="form-check mt-3">
          <Form.Check
            type="checkbox"
            label="Make this post public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
        </Form.Group>

        {mediaUrl && (
          <div className="media-preview mt-3">
            {mediaType === "image" ? (
              <img
                src={mediaUrl}
                alt="Post media"
                className="img-fluid rounded"
              />
            ) : (
              <video src={mediaUrl} controls className="w-100 rounded" />
            )}
          </div>
        )}

        {error && (
          <Alert variant="danger" className="mt-3">
            {error}
          </Alert>
        )}

        <div className="mt-3 d-flex justify-content-between align-items-center">
          <div>
            <input
              type="file"
              id="media-upload"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={handleFileInput}
            />
            <label
              htmlFor="media-upload"
              className="btn btn-outline-primary me-2"
            >
              Upload Media
            </label>
            <Button
              variant="link"
              onClick={() => {
                setMediaUrl("");
                setMediaType(null);
              }}
              disabled={!mediaUrl}
              className="text-muted"
            >
              Remove Media
            </Button>
          </div>

          <Button
            variant="primary"
            onClick={handlePost}
            disabled={loading || !content.trim()}
            className="post-button"
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                <span className="ms-2">Posting...</span>
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default CreatePostCard;
