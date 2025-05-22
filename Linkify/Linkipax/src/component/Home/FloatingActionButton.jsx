import React from "react";
import { Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";

const FloatingActionButton = () => {
  return (
    <Button
      variant="primary"
      className="floating-action-button"
      aria-label="Create New Post"
    >
      <FaPlus className="icon" />
    </Button>
  );
};

export default FloatingActionButton;