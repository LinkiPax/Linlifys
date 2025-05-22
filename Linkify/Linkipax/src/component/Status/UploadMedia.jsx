import React, { useState, useRef } from 'react';
import { Form, Alert } from 'react-bootstrap';
import { Upload, Image, FileEarmark } from 'react-bootstrap-icons';
import './UploadMedia.css'; // Add custom CSS for styling

const UploadMedia = ({ setMedia }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null); // Ref for the file input

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
    fileInputRef.current.click(); // Trigger file input click
  };

  const validateAndSetMedia = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload an image or video.');
      return;
    }

    // Validate file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds the limit of 10MB.');
      return;
    }

    setError(null);
    setPreviewUrl(URL.createObjectURL(file));
    setMedia(file);
  };

  return (
    <div className="upload-media">
      <Form>
        <Form.Group controlId="formFile">
          <Form.Label>Upload Image or Video</Form.Label>
          <div
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleUploadAreaClick} // Trigger file input on click
          >
            <Upload size={40} className="upload-icon" />
            <p>Drag & drop an image or video here, or click to browse.</p>
            <Form.Control
              type="file"
              onChange={handleMediaChange}
              accept="image/*, video/*"
              className="file-input"
              ref={fileInputRef} // Attach ref to the file input
              style={{ display: 'none' }} // Hide the file input
            />
          </div>
        </Form.Group>
      </Form>

      {/* Media Preview */}
      {previewUrl && (
        <div className="media-preview">
          {previewUrl.startsWith('data:video') ? (
            <video controls src={previewUrl} style={{ width: '100%' }} />
          ) : (
            <img src={previewUrl} alt="Preview" style={{ width: '100%' }} />
          )}
        </div>
      )}

      {/* Error Message */}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
    </div>
  );
};

export default UploadMedia;