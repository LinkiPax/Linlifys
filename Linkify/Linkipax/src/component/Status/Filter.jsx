import React, { useState } from 'react';
import { Button, Row, Col, Form, Card } from 'react-bootstrap';
import './FilterEditor.css'; // Add custom CSS for styling

const FilterEditor = ({ setSelectedFilter }) => {
  const [filterSettings, setFilterSettings] = useState({
    grayscale: 0,
    sepia: 0,
    blur: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    hueRotate: 0,
    invert: 0,
    opacity: 100,
    dropShadow: '0px 0px 0px #000000'
  });

  const applyFilter = (filter) => {
    setSelectedFilter((prev) => ({
      ...prev,
      [filter]: filterSettings[filter]
    }));
  };

  const resetFilters = () => {
    setSelectedFilter(null);
    setFilterSettings({
      grayscale: 0,
      sepia: 0,
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturate: 100,
      hueRotate: 0,
      invert: 0,
      opacity: 100,
      dropShadow: '0px 0px 0px #000000'
    });
  };

  const handleSliderChange = (filter, value) => {
    setFilterSettings((prev) => ({ ...prev, [filter]: value }));
    setSelectedFilter((prev) => ({
      ...prev,
      [filter]: value,
    }));
  };

  const handleDropShadowChange = (e) => {
    const { name, value } = e.target;
    setFilterSettings(prev => {
      const newSettings = {...prev};
      const parts = newSettings.dropShadow.split(' ');
      if (name === 'shadowX') parts[0] = `${value}px`;
      if (name === 'shadowY') parts[1] = `${value}px`;
      if (name === 'shadowBlur') parts[2] = `${value}px`;
      if (name === 'shadowColor') parts[3] = value;
      newSettings.dropShadow = parts.join(' ');
      return newSettings;
    });
  };

  const getFilterStyle = () => {
    return {
      filter: `
        grayscale(${filterSettings.grayscale}%)
        sepia(${filterSettings.sepia}%)
        blur(${filterSettings.blur}px)
        brightness(${filterSettings.brightness}%)
        contrast(${filterSettings.contrast}%)
        saturate(${filterSettings.saturate}%)
        hue-rotate(${filterSettings.hueRotate}deg)
        invert(${filterSettings.invert}%)
        opacity(${filterSettings.opacity}%)
      `,
      boxShadow: filterSettings.dropShadow
    };
  };

  const presetFilters = [
    { name: 'Normal', filter: {} },
    { name: 'Vintage', filter: { sepia: 80, contrast: 90, brightness: 90 } },
    { name: 'Black & White', filter: { grayscale: 100, contrast: 120 } },
    { name: 'Cool', filter: { brightness: 110, saturate: 110, hueRotate: 10 } },
    { name: 'Warm', filter: { brightness: 110, sepia: 30, hueRotate: -10 } },
    { name: 'Inverted', filter: { invert: 100 } },
  ];

  const applyPreset = (preset) => {
    const newSettings = { ...filterSettings, ...preset.filter };
    setFilterSettings(newSettings);
    setSelectedFilter(newSettings);
  };

  return (
    <Card className="filter-editor">
      <Card.Body>
        <Card.Title>Advanced Filter Editor</Card.Title>

        {/* Filter Preview */}
        <div className="filter-preview mb-4" style={getFilterStyle()}>
          <img
            src="https://via.placeholder.com/300" // Replace with your image URL
            alt="Filter Preview"
            className="preview-image img-fluid"
          />
        </div>

        {/* Preset Filters */}
        <div className="preset-filters mb-4">
          <h6>Preset Filters</h6>
          <Row className="g-2">
            {presetFilters.map((preset, index) => (
              <Col key={index} xs={4} sm={3} md={2}>
                <Button 
                  variant="outline-secondary" 
                  className="w-100" 
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* Slider Controls */}
        <div className="slider-controls">
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Grayscale: {filterSettings.grayscale}%</Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  value={filterSettings.grayscale}
                  onChange={(e) => handleSliderChange('grayscale', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Sepia: {filterSettings.sepia}%</Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  value={filterSettings.sepia}
                  onChange={(e) => handleSliderChange('sepia', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Blur: {filterSettings.blur}px</Form.Label>
                <Form.Range
                  min={0}
                  max={20}
                  value={filterSettings.blur}
                  onChange={(e) => handleSliderChange('blur', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Brightness: {filterSettings.brightness}%</Form.Label>
                <Form.Range
                  min={0}
                  max={200}
                  value={filterSettings.brightness}
                  onChange={(e) => handleSliderChange('brightness', e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Contrast: {filterSettings.contrast}%</Form.Label>
                <Form.Range
                  min={0}
                  max={200}
                  value={filterSettings.contrast}
                  onChange={(e) => handleSliderChange('contrast', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Saturation: {filterSettings.saturate}%</Form.Label>
                <Form.Range
                  min={0}
                  max={200}
                  value={filterSettings.saturate}
                  onChange={(e) => handleSliderChange('saturate', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Hue Rotate: {filterSettings.hueRotate}°</Form.Label>
                <Form.Range
                  min={0}
                  max={360}
                  value={filterSettings.hueRotate}
                  onChange={(e) => handleSliderChange('hueRotate', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Invert: {filterSettings.invert}%</Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  value={filterSettings.invert}
                  onChange={(e) => handleSliderChange('invert', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Opacity: {filterSettings.opacity}%</Form.Label>
                <Form.Range
                  min={0}
                  max={100}
                  value={filterSettings.opacity}
                  onChange={(e) => handleSliderChange('opacity', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Drop Shadow Controls */}
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Drop Shadow</Card.Title>
              <Row>
                <Col>
                  <Form.Group>
                    <Form.Label>X Offset</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={filterSettings.dropShadow.split(' ')[0].replace('px', '')}
                      onChange={(e) => handleDropShadowChange({ target: { name: 'shadowX', value: e.target.value } })}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Y Offset</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={filterSettings.dropShadow.split(' ')[1].replace('px', '')}
                      onChange={(e) => handleDropShadowChange({ target: { name: 'shadowY', value: e.target.value } })}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Blur</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={filterSettings.dropShadow.split(' ')[2].replace('px', '')}
                      onChange={(e) => handleDropShadowChange({ target: { name: 'shadowBlur', value: e.target.value } })}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>Color</Form.Label>
                    <Form.Control 
                      type="color" 
                      value={filterSettings.dropShadow.split(' ')[3]}
                      onChange={(e) => handleDropShadowChange({ target: { name: 'shadowColor', value: e.target.value } })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="d-flex justify-content-between mt-4">
          <Button variant="primary" onClick={() => setSelectedFilter(filterSettings)}>
            Apply All Filters
          </Button>
          <Button variant="danger" onClick={resetFilters}>
            Reset All Filters
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default FilterEditor;