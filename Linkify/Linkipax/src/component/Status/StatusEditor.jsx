import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Modal,
  Tabs,
  Tab,
  Card
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
  FiX,
  FiMove
} from "react-icons/fi";
import UploadMedia from "./UploadMedia";
import TextEditor from "./TextEdit";
import StickerEditor from "./StickerEditor";
import FilterEditor from "./Filter";
import MusicEditor from "./MusicEdit";
import "./StatusEditorPage.css";

const StatusEditorPage = () => {
  const [media, setMedia] = useState(null);
  const [textElements, setTextElements] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState({});
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [stickerElements, setStickerElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [activeTab, setActiveTab] = useState("media");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, fontSize: 0 });
  const previewRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 375, height: 667 }); // Standard status dimensions

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

  // Update container size when preview loads
  useEffect(() => {
    if (previewRef.current) {
      const updateSize = () => {
        const rect = previewRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height
        });
      };

      updateSize();
      window.addEventListener('resize', updateSize);
      
      return () => window.removeEventListener('resize', updateSize);
    }
  }, [previewUrl]);

  // Convert absolute pixels to percentage
  const absoluteToPercentage = (absoluteX, absoluteY) => {
    return {
      x: (absoluteX / containerSize.width) * 100,
      y: (absoluteY / containerSize.height) * 100
    };
  };

  // Convert percentage to absolute pixels
  const percentageToAbsolute = (percentX, percentY) => {
    return {
      x: (percentX / 100) * containerSize.width,
      y: (percentY / 100) * containerSize.height
    };
  };

  const handlePost = async () => {
    if (!userData) {
      setError("User details are required");
      return;
    }

    if (!media && textElements.length === 0) {
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

      // Append media file if exists
      if (media) {
        formData.append("media", media);
      }

      // Append all the editor data with percentage positions
      formData.append("textElements", JSON.stringify(textElements));
      formData.append("stickerElements", JSON.stringify(stickerElements));
      formData.append("filter", JSON.stringify(selectedFilter));
      
      // Append music data if selected
      if (selectedMusic) {
        formData.append("music", selectedMusic.id || "");
        formData.append("musicName", selectedMusic.name || "");
        formData.append("musicPath", selectedMusic.path || "");
      }

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
        error.response?.data?.error ||
        "Failed to post status. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMedia(null);
    setTextElements([]);
    setSelectedFilter({});
    setSelectedMusic(null);
    setStickerElements([]);
    setPreviewUrl(null);
    setSelectedElement(null);
  };

  const handleMusicToggle = () => {
    setMusicPlaying(!musicPlaying);
  };

  const handleAddText = (text, style) => {
    const newTextElement = {
      id: Date.now(),
      text,
      style: {
        ...style,
        fontSize: parseInt(style.fontSize) || 24
      },
      position: { x: 50, y: 50 }, // Center position in percentage
      positionType: 'percentage' // Mark as percentage positioning
    };
    setTextElements([...textElements, newTextElement]);
    setSelectedElement(newTextElement);
  };

  const handleAddSticker = (stickerUrl, type = 'sticker', emoji = null) => {
    const newStickerElement = {
      id: Date.now(),
      url: stickerUrl,
      type: type,
      emoji: emoji,
      position: { x: 50, y: 50 }, // Center position in percentage
      size: type === 'emoji' ? 40 : 50,
      positionType: 'percentage' // Mark as percentage positioning
    };
    setStickerElements([...stickerElements, newStickerElement]);
    setSelectedElement(newStickerElement);
  };

  const handleMouseDown = (e, element) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(element);
    
    const rect = previewRef.current.getBoundingClientRect();
    const absoluteX = (element.position.x / 100) * containerSize.width;
    const absoluteY = (element.position.y / 100) * containerSize.height;
    const offsetX = e.clientX - rect.left - absoluteX;
    const offsetY = e.clientY - rect.top - absoluteY;
    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  };

  const handleResizeStart = (e, element) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(element);
    setIsResizing(true);
    
    const rect = previewRef.current.getBoundingClientRect();
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.size || 50,
      height: element.size || 50,
      fontSize: element.style?.fontSize || 24
    });
  };

  const handleMouseMove = (e) => {
    if (!previewRef.current) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    
    if (isDragging && selectedElement) {
      const absoluteX = Math.max(0, Math.min(containerSize.width - 50, e.clientX - rect.left - dragOffset.x));
      const absoluteY = Math.max(0, Math.min(containerSize.height - 50, e.clientY - rect.top - dragOffset.y));
      
      // Convert to percentage
      const percentX = (absoluteX / containerSize.width) * 100;
      const percentY = (absoluteY / containerSize.height) * 100;
      
      if (selectedElement.text) {
        setTextElements(textElements.map(el => 
          el.id === selectedElement.id ? { ...el, position: { x: percentX, y: percentY } } : el
        ));
      } else if (selectedElement.url || selectedElement.type === 'emoji') {
        setStickerElements(stickerElements.map(el => 
          el.id === selectedElement.id ? { ...el, position: { x: percentX, y: percentY } } : el
        ));
      }
    }
    
    if (isResizing && selectedElement) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      // Calculate scale factor based on mouse movement
      const scale = 1 + (deltaX + deltaY) / 100;
      
      if (selectedElement.text) {
        // Resize text by changing font size
        const newFontSize = Math.max(12, Math.min(100, Math.round(resizeStart.fontSize * scale)));
        setTextElements(textElements.map(el => 
          el.id === selectedElement.id ? {
            ...el,
            style: {
              ...el.style,
              fontSize: newFontSize
            }
          } : el
        ));
      } else if (selectedElement.url || selectedElement.type === 'emoji') {
        // Resize sticker/emoji
        const newSize = Math.max(20, Math.min(200, Math.round(resizeStart.width * scale)));
        setStickerElements(stickerElements.map(el => 
          el.id === selectedElement.id ? {
            ...el,
            size: newSize
          } : el
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleDeleteElement = (e) => {
    e.stopPropagation();
    if (!selectedElement) return;
    
    if (selectedElement.text) {
      setTextElements(textElements.filter(el => el.id !== selectedElement.id));
    } else if (selectedElement.url || selectedElement.type === 'emoji') {
      setStickerElements(stickerElements.filter(el => el.id !== selectedElement.id));
    }
    
    setSelectedElement(null);
  };

  const getElementStyle = (element) => {
    // Convert percentage position to absolute pixels for display
    const absoluteX = (element.position.x / 100) * containerSize.width;
    const absoluteY = (element.position.y / 100) * containerSize.height;

    const baseStyle = {
      position: 'absolute',
      left: `${absoluteX}px`,
      top: `${absoluteY}px`,
      cursor: 'move',
      userSelect: 'none',
      transform: 'translate(-50%, -50%)' // Center the element
    };

    if (element.text) {
      return {
        ...baseStyle,
        ...element.style,
        fontSize: `${element.style.fontSize}px`
      };
    } else if (element.url || element.type === 'emoji') {
      return {
        ...baseStyle,
        width: `${element.size}px`,
        height: `${element.size}px`
      };
    }
    
    return baseStyle;
  };

  return (
    <Container fluid className="status-editor-container">
      <Row className="g-0">
        <Col md={8} className="editor-main-column">
          {/* Preview Section */}
          <div 
            className="preview-section"
            ref={previewRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {previewUrl ? (
              <div className="preview-media-container">
                <div
                  className="preview-media"
                  style={{ 
                    filter: Object.entries(selectedFilter).map(([key, value]) => {
                      if (key === 'dropShadow') return '';
                      return `${key}(${value})`;
                    }).join(' '),
                    boxShadow: selectedFilter.dropShadow || 'none'
                  }}
                >
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  
                  {/* Render text elements */}
                  {textElements.map((textEl) => (
                    <div
                      key={textEl.id}
                      className={`text-element ${selectedElement?.id === textEl.id ? 'selected' : ''}`}
                      style={getElementStyle(textEl)}
                      onMouseDown={(e) => handleMouseDown(e, textEl)}
                    >
                      {textEl.text}
                      
                      {/* Resize handle for text */}
                      {selectedElement?.id === textEl.id && (
                        <>
                          <div 
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, textEl)}
                          />
                          <div className="element-controls">
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={handleDeleteElement}
                              className="delete-btn"
                            >
                              <FiX size={12} />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {/* Render sticker elements */}
                  {stickerElements.map((stickerEl) => (
                    <div
                      key={stickerEl.id}
                      className={`sticker-element ${selectedElement?.id === stickerEl.id ? 'selected' : ''} ${stickerEl.type || ''}`}
                      style={getElementStyle(stickerEl)}
                      onMouseDown={(e) => handleMouseDown(e, stickerEl)}
                    >
                      {stickerEl.type === 'emoji' ? (
                        <span 
                          className="emoji-content" 
                          style={{ fontSize: `${stickerEl.size}px` }}
                        >
                          {stickerEl.emoji}
                        </span>
                      ) : (
                        <img src={stickerEl.url} alt="Sticker" className="sticker-img" />
                      )}
                      
                      {/* Resize handle for stickers */}
                      {selectedElement?.id === stickerEl.id && (
                        <>
                          <div 
                            className="resize-handle"
                            onMouseDown={(e) => handleResizeStart(e, stickerEl)}
                          />
                          <div className="element-controls">
                            <Button 
                              variant="danger" 
                              size="sm" 
                              onClick={handleDeleteElement}
                              className="delete-btn"
                            >
                              <FiX size={12} />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-preview">
                <FiImage size={48} />
                <p>Upload media or add text to preview your status</p>
              </div>
            )}
          </div>

          {/* Editor Tabs */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="editor-tabs"
          >
            <Tab eventKey="media" title={<><FiUpload /> Media</>}>
              <UploadMedia
                setMedia={setMedia}
                setPreviewUrl={setPreviewUrl}
              />
            </Tab>
            <Tab eventKey="text" title={<><FiEdit2 /> Text</>}>
              <TextEditor onAddText={handleAddText} />
            </Tab>
            <Tab eventKey="stickers" title={<><FiSmile /> Stickers</>}>
              <StickerEditor onAddSticker={handleAddSticker} />
            </Tab>
            <Tab eventKey="filters" title={<><FiFilter /> Filters</>}>
              <FilterEditor
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
              />
            </Tab>
          </Tabs>
        </Col>

        <Col md={4} className="editor-side-column">
          <Card className="music-section">
            <Card.Header>
              <h5><FiMusic /> Music</h5>
            </Card.Header>
            <Card.Body>
              <MusicEditor
                selectedMusic={selectedMusic}
                setSelectedMusic={setSelectedMusic}
                isPlaying={musicPlaying}
                onTogglePlay={handleMusicToggle}
              />
            </Card.Body>
          </Card>

          <Card className="status-info mt-3">
            <Card.Header>
              <h5>Status Info</h5>
            </Card.Header>
            <Card.Body>
              <div className="info-item">
                <strong>Media:</strong> {media ? "Uploaded" : "None"}
              </div>
              <div className="info-item">
                <strong>Text Elements:</strong> {textElements.length}
              </div>
              <div className="info-item">
                <strong>Stickers:</strong> {stickerElements.length}
              </div>
              <div className="info-item">
                <strong>Filter:</strong> {Object.keys(selectedFilter).length > 0 ? "Applied" : "None"}
              </div>
              <div className="info-item">
                <strong>Music:</strong> {selectedMusic ? selectedMusic.name : "None"}
              </div>
            </Card.Body>
          </Card>

          <div className="action-buttons mt-3">
            <Button
              variant="primary"
              onClick={handlePost}
              disabled={loading || (!media && textElements.length === 0)}
              className="post-button w-100"
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