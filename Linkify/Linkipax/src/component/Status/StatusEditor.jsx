import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Modal,
} from "react-bootstrap";
import axios from "axios";
import {
  FiUpload,
  FiMusic,
  FiImage,
  FiEdit2,
  FiSmile,
  FiFilter,
  FiCheck,
} from "react-icons/fi";
import UploadMedia from "../Status/UploadMedia";
import TextEditor from "../Status/TextEdit";
import StickerEditor from "../Status/StickerEditor";
import FilterEditor from "../Status/Filter";
import MusicEditor from "../Status/MusicEdit";
import "./StatusEditorPage.css";

const StatusEditorPage = () => {
  const [media, setMedia] = useState([]);
  const [text, setText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [userData, setUserData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState("media");
  const [musicPlaying, setMusicPlaying] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("Please login to create status");
          return;
        }

        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/${userId}`
        );
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError(error.response?.data?.message || "Failed to load user data");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handlePost = async () => {
    if (!userData) {
      setError("User details are required");
      return;
    }

    if (media.length === 0 && text.trim() === "") {
      setError("Please add media or text to your status");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("userId", userData._id);
      formData.append("name", userData.username);
      formData.append("userProfilePic", userData.profilePicture || "");

      media.forEach((file) => formData.append("media", file));
      formData.append("text", text);
      formData.append("filter", JSON.stringify(selectedFilter));
      formData.append("music", selectedMusic?.id || "");

      stickers.forEach((sticker, index) => {
        formData.append(`stickers[${index}]`, sticker);
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/status/create`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setShowSuccessModal(true);
      resetForm();
    } catch (error) {
      console.error("Error posting status:", error);
      setError(
        error.response?.data?.message ||
          "Failed to post status. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMedia([]);
    setText("");
    setSelectedFilter("");
    setSelectedMusic(null);
    setStickers([]);
    setPreviewUrls([]);
  };

  const handleMusicToggle = () => {
    setMusicPlaying(!musicPlaying);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <Container fluid className="status-editor-container">
      <Row className="g-0">
        <Col md={8} className="editor-main-column">
          {/* Preview Section */}
          <div className="preview-section">
            {previewUrls.length > 0 ? (
              previewUrls.map((url, index) => (
                <div key={index} className="preview-media-container">
                  <div
                    className="preview-media"
                    style={{ filter: selectedFilter }}
                  >
                    <img src={url} alt="Preview" className="preview-image" />
                    {stickers.map((sticker, stickerIndex) => (
                      <img
                        key={stickerIndex}
                        src={sticker}
                        alt="Sticker"
                        className="preview-sticker"
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-preview">
                <FiImage size={48} />
                <p>Upload media or add text to preview your status</p>
              </div>
            )}

            {text && (
              <div className="preview-text-container">
                <div className="preview-text">{text}</div>
              </div>
            )}
          </div>

          {/* Editor Tabs */}
          <div className="editor-tabs">
            <Button
              variant={activeTab === "media" ? "primary" : "outline-secondary"}
              onClick={() => handleTabChange("media")}
            >
              <FiUpload /> Media
            </Button>
            <Button
              variant={activeTab === "text" ? "primary" : "outline-secondary"}
              onClick={() => handleTabChange("text")}
            >
              <FiEdit2 /> Text
            </Button>
            <Button
              variant={
                activeTab === "stickers" ? "primary" : "outline-secondary"
              }
              onClick={() => handleTabChange("stickers")}
            >
              <FiSmile /> Stickers
            </Button>
            <Button
              variant={
                activeTab === "filters" ? "primary" : "outline-secondary"
              }
              onClick={() => handleTabChange("filters")}
            >
              <FiFilter /> Filters
            </Button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "media" && (
              <UploadMedia
                setMedia={setMedia}
                setPreviewUrls={setPreviewUrls}
                currentMedia={media}
              />
            )}
            {activeTab === "text" && (
              <TextEditor text={text} setText={setText} />
            )}
            {activeTab === "stickers" && (
              <StickerEditor
                setStickers={setStickers}
                currentStickers={stickers}
              />
            )}
            {activeTab === "filters" && (
              <FilterEditor
                setSelectedFilter={setSelectedFilter}
                currentFilter={selectedFilter}
              />
            )}
          </div>
        </Col>

        <Col md={4} className="editor-side-column">
          <div className="music-section">
            <h5>
              <FiMusic /> Music
            </h5>
            <MusicEditor
              setSelectedMusic={setSelectedMusic}
              currentMusic={selectedMusic}
              isPlaying={musicPlaying}
              onTogglePlay={handleMusicToggle}
            />
          </div>

          <div className="status-info">
            <h5>Status Info</h5>
            <div className="info-item">
              <strong>Media:</strong> {media.length}{" "}
              {media.length === 1 ? "item" : "items"}
            </div>
            <div className="info-item">
              <strong>Text:</strong>{" "}
              {text
                ? `${text.substring(0, 20)}${text.length > 20 ? "..." : ""}`
                : "None"}
            </div>
            <div className="info-item">
              <strong>Stickers:</strong> {stickers.length}
            </div>
            <div className="info-item">
              <strong>Filter:</strong> {selectedFilter ? "Applied" : "None"}
            </div>
            <div className="info-item">
              <strong>Music:</strong>{" "}
              {selectedMusic ? selectedMusic.name : "None"}
            </div>
          </div>

          <div className="action-buttons">
            <Button
              variant="primary"
              onClick={handlePost}
              disabled={loading || (media.length === 0 && text.trim() === "")}
              className="post-button"
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                  />
                  <span className="ms-2">Posting...</span>
                </>
              ) : (
                <>
                  <FiCheck /> Post Status
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert
              variant="danger"
              className="mt-3"
              dismissible
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
        </Col>
      </Row>

      {/* Success Modal */}
      <Modal
        show={showSuccessModal}
        onHide={() => setShowSuccessModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Success!</Modal.Title>
        </Modal.Header>
        <Modal.Body>Your status has been posted successfully.</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowSuccessModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default StatusEditorPage;
