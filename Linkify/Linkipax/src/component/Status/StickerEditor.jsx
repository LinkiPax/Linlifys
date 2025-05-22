import React, { useState } from 'react';
import { Form, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { Search, EmojiSmile, X } from 'react-bootstrap-icons'; // Use EmojiSmile instead of Smile
import './StickerEditor.css'; // Add custom CSS for styling

// Sample sticker library (replace with your own stickers)
const stickerLibrary = [
  { id: 1, url: 'https://via.placeholder.com/50', alt: 'Sticker 1' },
  { id: 2, url: 'https://via.placeholder.com/50', alt: 'Sticker 2' },
  { id: 3, url: 'https://via.placeholder.com/50', alt: 'Sticker 3' },
  { id: 4, url: 'https://via.placeholder.com/50', alt: 'Sticker 4' },
  { id: 5, url: 'https://via.placeholder.com/50', alt: 'Sticker 5' },
  { id: 6, url: 'https://via.placeholder.com/50', alt: 'Sticker 6' },
];

const StickerEditor = ({ setStickers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStickerClick = (sticker) => {
    setSelectedSticker(sticker);
    setStickers((prevStickers) => [...prevStickers, sticker.url]);
    setShowStickerPicker(false); // Close the picker after selection
  };

  const filteredStickers = stickerLibrary.filter((sticker) =>
    sticker.alt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="sticker-editor">
      <OverlayTrigger
        trigger="click"
        placement="bottom"
        show={showStickerPicker}
        onToggle={setShowStickerPicker}
        overlay={
          <Popover className="sticker-picker-popover">
            <Popover.Body>
              <div className="sticker-picker">
                {/* Search Bar */}
                <Form.Control
                  type="text"
                  placeholder="Search stickers..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="sticker-search"
                />

                {/* Sticker Grid */}
                <div className="sticker-grid">
                  {filteredStickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="sticker-item"
                      onClick={() => handleStickerClick(sticker)}
                    >
                      <img src={sticker.url} alt={sticker.alt} className="sticker-image" />
                    </div>
                  ))}
                </div>
              </div>
            </Popover.Body>
          </Popover>
        }
      >
        <Button variant="outline-secondary" className="sticker-button">
          <EmojiSmile size={20} /> Add Sticker
        </Button>
      </OverlayTrigger>

      {/* Selected Sticker Preview */}
      {selectedSticker && (
        <div className="sticker-preview">
          <img src={selectedSticker.url} alt={selectedSticker.alt} className="preview-image" />
          <Button
            variant="danger"
            size="sm"
            className="remove-button"
            onClick={() => setSelectedSticker(null)}
          >
            <X size={12} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default StickerEditor;