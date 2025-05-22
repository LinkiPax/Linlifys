import React, { useState } from "react";
import { Card, Button, CloseButton, Modal } from "react-bootstrap";
import { FiStar, FiX, FiCheckCircle, FiZap } from "react-icons/fi";
import { motion } from "framer-motion";
import "./AdvertisementCard.css";

const AdvertisementCard = ({
  title = "Upgrade to Premium",
  description = "Unlock exclusive features and ad-free experience!",
  buttonText = "Upgrade Now",
  onButtonClick,
  onClose,
  showCloseButton = true,
  features = [
    "Ad-free browsing",
    "Exclusive content",
    "Priority support",
    "Advanced analytics",
  ],
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleAction = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      setShowModal(true);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card
          className="advertisement-card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {showCloseButton && (
            <CloseButton
              className="card-close-btn"
              onClick={handleClose}
              aria-label="Close advertisement"
            />
          )}

          <Card.Body className="text-center">
            <div className="premium-badge">
              <FiStar className="icon" />
              <span>PREMIUM</span>
            </div>

            <h5 className="card-title">
              {title}
              {isHovered && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="sparkle"
                >
                  ✨
                </motion.span>
              )}
            </h5>

            <p className="card-description">{description}</p>

            <ul className="feature-list">
              {features.map((feature, index) => (
                <li key={index}>
                  <FiCheckCircle className="feature-icon" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              variant="primary"
              className="card-button"
              onClick={handleAction}
              aria-label={buttonText}
            >
              <FiZap className="button-icon" />
              {buttonText}
            </Button>

            <div className="trust-badge">
              <img
                src="https://cdn-icons-png.flaticon.com/512/179/179319.png"
                alt="Secure payment"
                width="16"
              />
              <span>Secure payment</span>
            </div>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Upgrade Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FiStar className="modal-title-icon" />
            Premium Upgrade
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="pricing-options">
            <div className="pricing-card recommended">
              <div className="pricing-header">
                <h5>Annual Plan</h5>
                <div className="price">
                  $59.99<span>/year</span>
                </div>
                <div className="savings">Save 30%</div>
              </div>
              <ul>
                <li>All premium features</li>
                <li>24/7 priority support</li>
                <li>Exclusive content</li>
              </ul>
              <Button variant="success" className="w-100">
                Choose Annual
              </Button>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h5>Monthly Plan</h5>
                <div className="price">
                  $7.99<span>/month</span>
                </div>
              </div>
              <ul>
                <li>All premium features</li>
                <li>Standard support</li>
              </ul>
              <Button variant="outline-primary" className="w-100">
                Choose Monthly
              </Button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-center">
          <div className="secure-checkout">
            <img
              src="https://cdn-icons-png.flaticon.com/512/196/196566.png"
              alt="Payment methods"
              width="120"
            />
            <p className="small text-muted mt-2">30-day money back guarantee</p>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdvertisementCard;
