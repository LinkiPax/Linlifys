import React, { useState, useEffect } from 'react';
import { Form, ButtonGroup, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { 
  TypeBold, 
  TypeItalic, 
  TypeUnderline, 
  TextLeft, 
  TextCenter, 
  TextRight, 
  Palette, 
  Type,
  ExclamationTriangle,
  Fonts,
  ArrowsExpand
} from 'react-bootstrap-icons';
import './TextEditor.css';

const TextEditor = ({ onAddText, onTextStyleChange, currentText = '' }) => {
  const [text, setText] = useState(currentText);
  const [fontSize, setFontSize] = useState(24);
  const [textColor, setTextColor] = useState('#ffffff');
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [textAlign, setTextAlign] = useState('center');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [availableFonts, setAvailableFonts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Available web fonts
  const webFonts = [
    'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 
    'Courier New', 'Verdana', 'Trebuchet MS', 'Impact',
    'Comic Sans MS', 'Tahoma', 'Palatino', 'Garamond'
  ];

  useEffect(() => {
    setAvailableFonts(webFonts);
  }, []);

  useEffect(() => {
    // Update text style in real-time for preview
    if (text.trim() && onTextStyleChange) {
      const textStyle = getTextStyle();
      onTextStyleChange(text, textStyle);
    }
  }, [text, fontSize, textColor, backgroundColor, textAlign, isBold, isItalic, isUnderline, fontFamily]);

  const getTextStyle = () => {
    return {
      fontSize: `${fontSize}px`,
      color: textColor,
      backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : 'transparent',
      textAlign,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      textDecoration: isUnderline ? 'underline' : 'none',
      fontFamily,
      textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
      padding: backgroundColor !== 'transparent' ? '8px 12px' : '0',
      borderRadius: backgroundColor !== 'transparent' ? '8px' : '0',
      lineHeight: '1.4',
      display: 'inline-block',
      maxWidth: '100%',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap'
    };
  };

  const handleAddTextToPreview = () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }
    
    const textStyle = getTextStyle();
    onAddText(text, textStyle);
    setError('');
  };

  const handleClearText = () => {
    setText('');
    setError('');
    if (onTextStyleChange) {
      onTextStyleChange('', getTextStyle());
    }
  };

  const quickStyles = [
    {
      name: 'Default',
      style: { fontSize: 24, color: '#ffffff', bold: false, italic: false }
    },
    {
      name: 'Bold Title',
      style: { fontSize: 32, color: '#ffffff', bold: true, italic: false }
    },
    {
      name: 'Italic Quote',
      style: { fontSize: 20, color: '#f8f9fa', bold: false, italic: true }
    },
    {
      name: 'Highlight',
      style: { fontSize: 22, color: '#000000', bold: true, backgroundColor: '#ffeb3b' }
    }
  ];

  const applyQuickStyle = (style) => {
    setFontSize(style.fontSize);
    setTextColor(style.color);
    setIsBold(style.bold || false);
    setIsItalic(style.italic || false);
    if (style.backgroundColor) {
      setBackgroundColor(style.backgroundColor);
    }
  };

  return (
    <Card className="text-editor-card">
      <Card.Body>
        <div className="editor-header">
          <h5><Type className="me-2" />Text Editor</h5>
          <small className="text-muted">
            <ArrowsExpand size={14} className="me-1" />
            Drag corners to resize text on image
          </small>
        </div>

        {error && (
          <Alert variant="warning" className="py-2">
            <ExclamationTriangle size={16} className="me-2" />
            {error}
          </Alert>
        )}

        <Form.Group controlId="formText" className="mb-3">
          <Form.Label>Your Text</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your status text here..."
            className="text-input"
            maxLength={200}
          />
          <div className="text-end">
            <small className="text-muted">{text.length}/200 characters</small>
          </div>
        </Form.Group>

        {/* Quick Styles */}
        <div className="quick-styles mb-3">
          <Form.Label>Quick Styles</Form.Label>
          <div className="style-buttons">
            {quickStyles.map((quickStyle, index) => (
              <Button
                key={index}
                variant="outline-secondary"
                size="sm"
                className="me-2 mb-2"
                onClick={() => applyQuickStyle(quickStyle.style)}
              >
                {quickStyle.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-controls">
          <Row className="g-3">
            <Col sm={6}>
              <Form.Label>Font Size: {fontSize}px</Form.Label>
              <Form.Range
                min={12}
                max={72}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="font-size-slider"
              />
            </Col>
            
            <Col sm={6}>
              <Form.Label>Font Family</Form.Label>
              <Form.Select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                size="sm"
              >
                {availableFonts.map((font, index) => (
                  <option key={index} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </Form.Select>
            </Col>

            <Col sm={6}>
              <Form.Label>Text Color</Form.Label>
              <div className="color-picker-container">
                <Form.Control
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="color-picker"
                  title="Text Color"
                />
                <Palette className="color-picker-icon" />
              </div>
            </Col>

            <Col sm={6}>
              <Form.Label>Background</Form.Label>
              <Form.Select
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                size="sm"
              >
                <option value="transparent">Transparent</option>
                <option value="#000000">Black</option>
                <option value="#ffffff">White</option>
                <option value="#ff0000">Red</option>
                <option value="#00ff00">Green</option>
                <option value="#0000ff">Blue</option>
                <option value="#ffff00">Yellow</option>
              </Form.Select>
            </Col>
          </Row>

          <div className="text-style-controls mt-3">
            <div className="control-group">
              <Form.Label>Text Style</Form.Label>
              <ButtonGroup className="w-100">
                <Button 
                  variant={isBold ? "primary" : "outline-secondary"} 
                  onClick={() => setIsBold(!isBold)}
                  size="sm"
                >
                  <TypeBold />
                </Button>
                <Button 
                  variant={isItalic ? "primary" : "outline-secondary"} 
                  onClick={() => setIsItalic(!isItalic)}
                  size="sm"
                >
                  <TypeItalic />
                </Button>
                <Button 
                  variant={isUnderline ? "primary" : "outline-secondary"} 
                  onClick={() => setIsUnderline(!isUnderline)}
                  size="sm"
                >
                  <TypeUnderline />
                </Button>
              </ButtonGroup>
            </div>

            <div className="control-group">
              <Form.Label>Alignment</Form.Label>
              <ButtonGroup className="w-100">
                <Button 
                  variant={textAlign === 'left' ? "primary" : "outline-secondary"} 
                  onClick={() => setTextAlign('left')}
                  size="sm"
                >
                  <TextLeft />
                </Button>
                <Button 
                  variant={textAlign === 'center' ? "primary" : "outline-secondary"} 
                  onClick={() => setTextAlign('center')}
                  size="sm"
                >
                  <TextCenter />
                </Button>
                <Button 
                  variant={textAlign === 'right' ? "primary" : "outline-secondary"} 
                  onClick={() => setTextAlign('right')}
                  size="sm"
                >
                  <TextRight />
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </div>

        {/* Live Preview */}
        {text.trim() && (
          <div className="preview-section mt-3">
            <Form.Label>Live Preview</Form.Label>
            <div className="text-preview" style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
              <div style={getTextStyle()}>
                {text}
              </div>
            </div>
          </div>
        )}

        <div className="action-buttons mt-3">
          <Button 
            variant="outline-secondary" 
            onClick={handleClearText}
            disabled={!text.trim()}
            className="me-2"
          >
            Clear
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddTextToPreview}
            disabled={!text.trim()}
            className="flex-grow-1"
          >
            <Type className="me-2" />
            Apply Text to Image
          </Button>
        </div>

        <div className="editor-footer mt-3">
          <small className="text-muted">
            💡 Text will be permanently added to your image when you post the status
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default TextEditor;