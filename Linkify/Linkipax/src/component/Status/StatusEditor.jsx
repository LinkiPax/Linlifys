import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import UploadMedia from '../Status/UploadMedia'; 
import TextEditor from '../Status/TextEdit';  
import StickerEditor from '../Status/StickerEditor';  
import FilterEditor from '../Status/Filter';  
import MusicEditor from '../Status/MusicEdit';  
import './StatusEditorPage.css';

const StatusEditorPage = () => {
  const [media, setMedia] = useState([]); // Ensure it's an array
  const [text, setText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedMusic, setSelectedMusic] = useState("");
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          setError("User not logged in");
          return;
        }
        const response = await axios.get(`http://localhost:5000/user/${userId}`);
        console.log("User data:", response.data);
        setUserData(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user data");
      }
    };

    fetchUserData();
  }, []);

  const handlePost = async () => {
    if (!userData) {
      setError("User details are required!");
      return;
    }
  
    console.log("Media State Before Posting:", media, "IsArray:", Array.isArray(media));
  
    const mediaArray = Array.isArray(media) ? media : [media];
    if (mediaArray.length === 0) {
      setError("Media must be an array and cannot be empty!");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const formData = new FormData();
      formData.append('userId', userData._id);
      formData.append('name', userData.username);
      formData.append('userProfilePic', userData.profilePicture || "");
  
      mediaArray.forEach(file => formData.append('media', file));
      formData.append('text', text);
      formData.append('selectedFilter', selectedFilter);
      formData.append('selectedMusic', selectedMusic);
      stickers.forEach((sticker, index) => formData.append(`stickers[${index}]`, sticker));
  
      await axios.post('http://localhost:5000/api/status/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
  
      alert('Status posted successfully!');
    } catch (error) {
      console.error("Error posting status:", error);
      setError('Failed to post status. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Container fluid className="status-editor">
      <Row>
        <Col md={8} className="scrollable-column">
          <UploadMedia setMedia={setMedia} setPreviewUrls={setPreviewUrls} />
          {previewUrls.length > 0 && (
            <div className="preview-section">
              {previewUrls.map((url, index) => (
                <div key={index} className="preview-media" style={{ filter: selectedFilter }}>
                  <img src={url} alt="Preview" className="preview-image" />
                </div>
              ))}
              {text && <div className="preview-text">{text}</div>}
              {stickers.map((sticker, index) => (
                <img key={index} src={sticker} alt="Sticker" className="preview-sticker" />
              ))}
            </div>
          )}
          <TextEditor text={text} setText={setText} />
          <StickerEditor setStickers={setStickers} />
          <FilterEditor setSelectedFilter={setSelectedFilter} />
        </Col>

        <Col md={4} className="fixed-column">
          <MusicEditor setSelectedMusic={setSelectedMusic} />
          <div className="action-buttons">
            <Button variant="primary" onClick={handlePost} disabled={loading} className="mt-3">
              {loading ? <Spinner as="span" animation="border" size="sm" role="status" /> : 'Post Status'}
            </Button>
          </div>
          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Col>
      </Row>
    </Container>
  );
};

export default StatusEditorPage;
