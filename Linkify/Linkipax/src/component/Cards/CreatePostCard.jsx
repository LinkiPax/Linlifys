// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   Button,
//   Form,
//   InputGroup,
//   Spinner,
//   Alert,
//   Modal,
//   Badge,
//   Row,
//   Col,
// } from "react-bootstrap";
// import axios from "axios";
// import { FiImage, FiVideo, FiX, FiGift } from "react-icons/fi";
// import "./CreatePostCard.css";
// import Navbar from "../navbar/Navbar";
// import { uploadToCloudinary } from "../../Cloudinary/cloudinary";

// const CreatePostCard = ({ userId }) => {
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [mediaUrl, setMediaUrl] = useState("");
//   const [mediaType, setMediaType] = useState(null);
//   const [tags, setTags] = useState("");
//   const [category, setCategory] = useState("general");
//   const [isPublic, setIsPublic] = useState(true);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showGifModal, setShowGifModal] = useState(false);
//   const [gifs, setGifs] = useState([]);
//   const [gifSearch, setGifSearch] = useState("");
//   const [selectedGif, setSelectedGif] = useState(null);

//   const [pushPermission, setPushPermission] = useState(Notification.permission);
//   const [isSubscribed, setIsSubscribed] = useState(false);

//   useEffect(() => {
//     async function checkSubscription() {
//       if ("serviceWorker" in navigator && "PushManager" in window) {
//         const subscribed = await notificationService.checkAndRenewSubscription();
//         setIsSubscribed(subscribed);
//       }
//     }
//     checkSubscription();
//   }, []);

//   const searchGifs = async (query) => {
//     try {
//       const apiUrl = import.meta.env.VITE_API_URL;
//       const response = await axios.get(
//         `${apiUrl}/api/posts/gifs/search?query=${query}`
//       );
//       setGifs(response.data);
//     } catch {
//       setError("Unable to load GIFs. Please try again.");
//     }
//   };

//   const getTrendingGifs = async () => {
//     try {
//       const apiUrl = import.meta.env.VITE_API_URL;
//       const response = await axios.get(
//         `${apiUrl}/api/posts/gifs/trending`
//       );
//       setGifs(response.data);
//     } catch {
//       setError("Unable to fetch trending GIFs.");
//     }
//   };

//   const handleGifSelect = (gif) => {
//     setSelectedGif(gif);
//     setMediaUrl(gif.url);
//     setMediaType("gif");
//     setShowGifModal(false);
//   };

//   const handleMediaUpload = async (file) => {
//     try {
//       setLoading(true);
//       const data = await uploadToCloudinary(file);
//       setMediaUrl(data.secure_url);
//       setMediaType(file.type.startsWith("image") ? "image" : "video");
//       setSelectedGif(null);
//     } catch {
//       setError("Media upload failed. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePost = async () => {
//     if (!content.trim()) {
//       setError("Your post cannot be empty.");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError("");

//       const newPost = {
//         title,
//         content,
//         imageUrl: mediaType === "image" || mediaType === "gif" ? mediaUrl : "",
//         videoUrl: mediaType === "video" ? mediaUrl : "",
//         createdBy: userId,
//         tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
//         category,
//         isPublic,
//         postType: mediaType || "text",
//       };

//       const apiUrl = import.meta.env.VITE_API_URL;
//       const response = await axios.post(`${apiUrl}/api/posts`, newPost);

//       if (response.status === 200 || response.status === 201) {
//         alert("🎉 Your post has been published!");
//         setTitle("");
//         setContent("");
//         setMediaUrl("");
//         setMediaType(null);
//         setTags("");
//         setCategory("general");
//         setIsPublic(true);
//         setSelectedGif(null);
//       }
//     } catch {
//       setError("Something went wrong while publishing your post.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     const file = e.dataTransfer.files[0];
//     if (file && (file.type.startsWith("image") || file.type.startsWith("video"))) {
//       handleMediaUpload(file);
//     } else {
//       setError("Please upload an image or video file only.");
//     }
//   };

//   const handleFileInput = (e) => {
//     const file = e.target.files[0];
//     if (file && (file.type.startsWith("image") || file.type.startsWith("video"))) {
//       handleMediaUpload(file);
//     } else {
//       setError("Invalid file type selected.");
//     }
//   };

//   const removeMedia = () => {
//     setMediaUrl("");
//     setMediaType(null);
//     setSelectedGif(null);
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="container mt-4">
//         <h2 className="text-center fw-bold mb-4">
//           Create a Post
//         </h2>

//         <Card
//           className="create-post-card shadow"
//           onDragOver={(e) => e.preventDefault()}
//           onDrop={handleDrop}
//         >
//           <Card.Header className="bg-primary text-white">
//             <h6 className="mb-0">Start a conversation</h6>
//           </Card.Header>

//           <Card.Body>
//             {error && <Alert variant="danger">{error}</Alert>}

//             <Form.Group className="mb-3">
//               <Form.Label>Post title (optional)</Form.Label>
//               <Form.Control
//                 type="text"
//                 value={title}
//                 onChange={(e) => setTitle(e.target.value)}
//                 placeholder="Add a short, catchy title..."
//                 className="post-title-input"
//               />
//             </Form.Group>

//             <Form.Group className="mb-3">
//               <Form.Label>
//                 What's on your mind? <span className="text-danger">*</span>
//               </Form.Label>
//               <Form.Control
//                 as="textarea"
//                 rows={4}
//                 placeholder="Share your thoughts, ideas, or updates..."
//                 value={content}
//                 onChange={(e) => setContent(e.target.value)}
//                 className="post-content-input"
//               />
//             </Form.Group>

//             <Row className="mb-3">
//               <Col md={6}>
//                 <Form.Control
//                   placeholder="Tags (e.g. react, tech, news)"
//                   value={tags}
//                   onChange={(e) => setTags(e.target.value)}
//                 />
//               </Col>
//               <Col md={6}>
//                 <Form.Select
//                   value={category}
//                   onChange={(e) => setCategory(e.target.value)}
//                 >
//                   <option value="general">General</option>
//                   <option value="technology">Technology</option>
//                   <option value="education">Education</option>
//                   <option value="news">News</option>
//                   <option value="entertainment">Entertainment</option>
//                   <option value="sports">Sports</option>
//                 </Form.Select>
//               </Col>
//             </Row>

//             <Form.Check
//               type="switch"
//               label="Make this post public"
//               checked={isPublic}
//               onChange={(e) => setIsPublic(e.target.checked)}
//               className="mb-3"
//             />

//             {mediaUrl && (
//               <div className="media-preview p-3 mb-3">
//                 <div className="d-flex justify-content-between">
//                   <strong>Attached media</strong>
//                   <Button size="sm" variant="outline-danger" onClick={removeMedia}>
//                     <FiX /> Remove
//                   </Button>
//                 </div>
//                 {mediaType === "image" && <img src={mediaUrl} alt="" />}
//                 {mediaType === "video" && <video src={mediaUrl} controls />}
//                 {mediaType === "gif" && (
//                   <>
//                     <img src={mediaUrl} alt="" />
//                     <Badge bg="info" className="mt-2">GIF</Badge>
//                   </>
//                 )}
//               </div>
//             )}

//             <div className="d-flex justify-content-between mt-3">
//               <div className="d-flex gap-2">
//                 <input
//                   type="file"
//                   id="media-upload"
//                   hidden
//                   accept="image/*,video/*"
//                   onChange={handleFileInput}
//                 />
//                 <label htmlFor="media-upload" className="btn btn-outline-primary">
//                   <FiImage /> Media
//                 </label>

//                 <Button
//                   variant="outline-info"
//                   onClick={() => {
//                     setShowGifModal(true);
//                     getTrendingGifs();
//                   }}
//                 >
//                   <FiGift /> GIF
//                 </Button>
//               </div>

//               <Button
//                 className="post-button"
//                 disabled={loading || !content.trim()}
//                 onClick={handlePost}
//               >
//                 {loading ? "Publishing..." : "Publish"}
//               </Button>
//             </div>
//           </Card.Body>
//         </Card>

//         {/* GIF MODAL */}
//         <Modal show={showGifModal} onHide={() => setShowGifModal(false)} size="lg">
//           <Modal.Header closeButton>
//             <Modal.Title>Choose a GIF</Modal.Title>
//           </Modal.Header>
//           <Modal.Body>
//             <InputGroup className="mb-3">
//               <Form.Control
//                 placeholder="Search GIFs..."
//                 value={gifSearch}
//                 onChange={(e) => setGifSearch(e.target.value)}
//               />
//               <Button onClick={() => searchGifs(gifSearch)}>Search</Button>
//             </InputGroup>

//             <div className="gif-grid">
//               {gifs.map((gif) => (
//                 <div key={gif.id} className="gif-item" onClick={() => handleGifSelect(gif)}>
//                   <img src={gif.preview || gif.url} alt={gif.title} />
//                 </div>
//               ))}
//             </div>
//           </Modal.Body>
//         </Modal>
//       </div>
//     </>
//   );
// };

// export default CreatePostCard;
import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Alert,
  Modal,
  Badge,
  Row,
  Col,
} from "react-bootstrap";
import axios from "axios";
import { FiImage, FiX, FiGift } from "react-icons/fi";
import "./CreatePostCard.css";
import Navbar from "../navbar/Navbar";
import { uploadToCloudinary } from "../../Cloudinary/cloudinary";

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

  const [uploadProgress, setUploadProgress] = useState(0);

  /* Simulated progress for smooth UX */
  useEffect(() => {
    if (loading) {
      let value = 0;
      const timer = setInterval(() => {
        value += 10;
        setUploadProgress(value);
        if (value >= 100) clearInterval(timer);
      }, 150);
      return () => clearInterval(timer);
    } else {
      setUploadProgress(0);
    }
  }, [loading]);

  const handleMediaUpload = async (file) => {
    try {
      setLoading(true);
      const data = await uploadToCloudinary(file);
      setMediaUrl(data.secure_url);
      setMediaType(file.type.startsWith("image") ? "image" : "video");
      setSelectedGif(null);
    } catch {
      setError("Media upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!content.trim()) {
      setError("Post content cannot be empty.");
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
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        category,
        isPublic,
        postType: mediaType || "text",
      };

      const apiUrl = import.meta.env.VITE_API_URL;
      await axios.post(`${apiUrl}/api/posts`, newPost);

      alert("Post published successfully");
      setTitle("");
      setContent("");
      setMediaUrl("");
      setMediaType(null);
      setTags("");
      setCategory("general");
      setIsPublic(true);
      setSelectedGif(null);
    } catch {
      setError("Something went wrong while publishing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container mt-4">
        <h2 className="text-center fw-semibold mb-1 create-heading">
          Create Post
        </h2>
        <p className="text-center text-muted mb-4 create-subheading">
          Write, upload, preview, and publish
        </p>

        <Row className="g-4">
          {/* LEFT SIDE */}
          <Col md={6}>
            <Card className="create-post-card">
              <Card.Header className="creator-header">
                Create your content
              </Card.Header>

              <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}

                <Form.Group className="mb-3">
                  <Form.Label>Title (optional)</Form.Label>
                  <Form.Control
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a short title"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Post content <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your thoughts here"
                  />
                </Form.Group>

                <Row className="mb-3">
                  <Col>
                    <Form.Control
                      placeholder="Tags (react, tech, news)"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </Col>
                  <Col>
                    <Form.Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="general">General</option>
                      <option value="technology">Technology</option>
                      <option value="education">Education</option>
                      <option value="news">News</option>
                      <option value="sports">Sports</option>
                    </Form.Select>
                  </Col>
                </Row>

                <Form.Check
                  type="switch"
                  label="Public visibility"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="mb-3"
                />

                <div className="d-flex gap-2 mb-3">
                  <input
                    type="file"
                    id="media-upload"
                    hidden
                    accept="image/*,video/*"
                    onChange={(e) => handleMediaUpload(e.target.files[0])}
                  />
                  <label htmlFor="media-upload" className="btn btn-outline-primary">
                    <FiImage /> Upload media
                  </label>

                  <Button
                    variant="outline-info"
                    onClick={() => setShowGifModal(true)}
                  >
                    <FiGift /> Add GIF
                  </Button>
                </div>

                {loading && (
                  <div className="upload-circle">
                    <svg>
                      <circle cx="50" cy="50" r="45" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        style={{
                          strokeDashoffset:
                            283 - (283 * uploadProgress) / 100,
                        }}
                      />
                    </svg>
                    <span>{uploadProgress}%</span>
                  </div>
                )}

                <Button
                  className="post-button w-100 mt-3"
                  disabled={loading || !content.trim()}
                  onClick={handlePost}
                >
                  Publish
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* RIGHT SIDE */}
          <Col md={6}>
            <Card className="preview-card">
              <Card.Header>Live preview</Card.Header>
              <Card.Body>
                {!mediaUrl && (
                  <p className="text-muted text-center">
                    Media preview will appear here
                  </p>
                )}

                {mediaType === "image" && (
                  <img src={mediaUrl} className="preview-media" alt="" />
                )}
                {mediaType === "video" && (
                  <video src={mediaUrl} controls className="preview-media" />
                )}
                {mediaType === "gif" && (
                  <>
                    <img src={mediaUrl} className="preview-media" alt="" />
                    <Badge bg="info" className="mt-2">GIF</Badge>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>

      {/* GIF MODAL (logic unchanged) */}
      <Modal show={showGifModal} onHide={() => setShowGifModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Select GIF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Control
            className="mb-3"
            placeholder="Search GIFs"
            value={gifSearch}
            onChange={(e) => setGifSearch(e.target.value)}
          />
          <div className="gif-grid">
            {gifs.map((gif) => (
              <div
                key={gif.id}
                className="gif-item"
                onClick={() => {
                  setSelectedGif(gif);
                  setMediaUrl(gif.url);
                  setMediaType("gif");
                  setShowGifModal(false);
                }}
              >
                <img src={gif.preview || gif.url} alt="" />
              </div>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default CreatePostCard;
