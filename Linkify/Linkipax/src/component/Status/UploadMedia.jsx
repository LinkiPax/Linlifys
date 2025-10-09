import React, { useState, useRef } from 'react';
import { Form, Alert, Card } from 'react-bootstrap';
import { Upload, Image, FileEarmark } from 'react-bootstrap-icons';
import './UploadMedia.css';

const UploadMedia = ({ setMedia, setPreviewUrl }) => {
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    validateAndSetMedia(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    validateAndSetMedia(file);
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current.click();
  };

  const validateAndSetMedia = (file) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image or video.');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size exceeds the limit of 10MB.');
      return;
    }

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setMedia(file);
  };

  return (
    <Card className="upload-media-card">
      <Card.Body>
        <Form>
          <Form.Group controlId="formFile">
            <Form.Label>Upload Image or Video</Form.Label>
            <div
              className="upload-area"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleUploadAreaClick}
            >
              <Upload size={40} className="upload-icon" />
              <p>Drag & drop an image or video here, or click to browse.</p>
              <Form.Control
                type="file"
                onChange={handleMediaChange}
                accept="image/*, video/*"
                className="file-input"
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
            </div>
          </Form.Group>
        </Form>

        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Card.Body>
    </Card>
  );
};

export default UploadMedia;