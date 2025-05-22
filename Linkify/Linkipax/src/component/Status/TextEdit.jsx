import React, { useState } from 'react';
import { Form, ButtonGroup, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { Type, TypeBold, TypeItalic, TypeUnderline, TextLeft, TextCenter, TextRight, EmojiSmile } from 'react-bootstrap-icons';
import EmojiPicker from 'emoji-picker-react'; // Install emoji-picker-react
import './TextEditor.css'; // Add custom CSS for styling

const TextEditor = ({ text, setText }) => {
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');
  const [textAlign, setTextAlign] = useState('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji);
    setShowEmojiPicker(false); 
  };

  const getTextStyle = () => ({
    fontSize: `${fontSize}px`,
    color: textColor,
    textAlign,
    fontWeight: isBold ? 'bold' : 'normal',
    fontStyle: isItalic ? 'italic' : 'normal',
    textDecoration: isUnderline ? 'underline' : 'none',
  });

  return (
    <div className="text-editor">
      <Form.Group controlId="formText">
        <Form.Label>Add Text to Status</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your status here..."
          style={getTextStyle()}
        />
      </Form.Group>

      {/* Text Customization Toolbar */}
      <div className="text-toolbar">
        <ButtonGroup className="me-2">
          <Button variant="outline-secondary" onClick={() => setIsBold(!isBold)}>
            <TypeBold />
          </Button>
          <Button variant="outline-secondary" onClick={() => setIsItalic(!isItalic)}>
            <TypeItalic />
          </Button>
          <Button variant="outline-secondary" onClick={() => setIsUnderline(!isUnderline)}>
            <TypeUnderline />
          </Button>
        </ButtonGroup>

        <ButtonGroup className="me-2">
          <Button variant="outline-secondary" onClick={() => setTextAlign('left')}>
            <TextLeft />
          </Button>
          <Button variant="outline-secondary" onClick={() => setTextAlign('center')}>
            <TextCenter />
          </Button>
          <Button variant="outline-secondary" onClick={() => setTextAlign('right')}>
            <TextRight />
          </Button>
        </ButtonGroup>

        <Form.Control
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="color-picker"
        />

        <Form.Control
          type="number"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          min="10"
          max="50"
          className="font-size-picker"
        />

        <OverlayTrigger
          trigger="click"
          placement="bottom"
          show={showEmojiPicker}
          onToggle={setShowEmojiPicker}
          overlay={
            <Popover>
              <Popover.Body>
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </Popover.Body>
            </Popover>
          }
        >
          <Button variant="outline-secondary">
            <EmojiSmile />
          </Button>
        </OverlayTrigger>
      </div>

      {/* Real-Time Preview */}
      <div className="text-preview" style={getTextStyle()}>
        {text || 'Preview your text here...'}
      </div>
    </div>
  );
};

export default TextEditor;