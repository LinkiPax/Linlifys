import React, { useState } from 'react';
import { Button, Row, Col, Form } from 'react-bootstrap';
import './FilterEditor.css'; // Add custom CSS for styling

const FilterEditor = ({ setSelectedFilter }) => {
  const [filterSettings, setFilterSettings] = useState({
    grayscale: 0,
    sepia: 0,
    blur: 0,
    brightness: 100,
    contrast: 100,
  });

  const applyFilter = (filter) => {
    setSelectedFilter(filter);
  };

  const resetFilters = () => {
    setSelectedFilter(null);
    setFilterSettings({
      grayscale: 0,
      sepia: 0,
      blur: 0,
      brightness: 100,
      contrast: 100,
    });
  };

  const handleSliderChange = (filter, value) => {
    setFilterSettings((prev) => ({ ...prev, [filter]: value }));
    setSelectedFilter((prev) => ({
      ...prev,
      [filter]: value,
    }));
  };

  const getFilterStyle = () => {
    return {
      filter: `
        grayscale(${filterSettings.grayscale}%)
        sepia(${filterSettings.sepia}%)
        blur(${filterSettings.blur}px)
        brightness(${filterSettings.brightness}%)
        contrast(${filterSettings.contrast}%)
      `,
    };
  };

  return (
    <div className="filter-editor">
      <h4>Apply Filters</h4>

      {/* Filter Preview */}
      <div className="filter-preview" style={getFilterStyle()}>
        <img
          src="https://via.placeholder.com/300" // Replace with your image URL
          alt="Filter Preview"
          className="preview-image"
        />
      </div>

      {/* Filter Buttons */}
      <Row className="filter-buttons">
        <Col>
          <Button onClick={() => applyFilter("grayscale")}>Grayscale</Button>
        </Col>
        <Col>
          <Button onClick={() => applyFilter("sepia")}>Sepia</Button>
        </Col>
        <Col>
          <Button onClick={() => applyFilter("blur")}>Blur</Button>
        </Col>
        <Col>
          <Button onClick={() => applyFilter("brightness")}>Brightness</Button>
        </Col>
        <Col>
          <Button onClick={() => applyFilter("contrast")}>Contrast</Button>
        </Col>
      </Row>

      {/* Slider Controls */}
      <div className="slider-controls">
        <Form.Group>
          <Form.Label>Grayscale: {filterSettings.grayscale}%</Form.Label>
          <Form.Range
            min={0}
            max={100}
            value={filterSettings.grayscale}
            onChange={(e) => handleSliderChange('grayscale', e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Sepia: {filterSettings.sepia}%</Form.Label>
          <Form.Range
            min={0}
            max={100}
            value={filterSettings.sepia}
            onChange={(e) => handleSliderChange('sepia', e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Blur: {filterSettings.blur}px</Form.Label>
          <Form.Range
            min={0}
            max={20}
            value={filterSettings.blur}
            onChange={(e) => handleSliderChange('blur', e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Brightness: {filterSettings.brightness}%</Form.Label>
          <Form.Range
            min={0}
            max={200}
            value={filterSettings.brightness}
            onChange={(e) => handleSliderChange('brightness', e.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Contrast: {filterSettings.contrast}%</Form.Label>
          <Form.Range
            min={0}
            max={200}
            value={filterSettings.contrast}
            onChange={(e) => handleSliderChange('contrast', e.target.value)}
          />
        </Form.Group>
      </div>

      {/* Reset Button */}
      <Button variant="danger" onClick={resetFilters} className="reset-button">
        Reset Filters
      </Button>
    </div>
  );
};

export default FilterEditor;