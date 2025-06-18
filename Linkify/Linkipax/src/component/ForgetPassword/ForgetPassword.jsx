import React, { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./ForgetPassword.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/forgot-password`,
        { email }
      );
      console.log("Reset password link sent to", email);
      alert("A reset password link has been sent to your email.");
    } catch (error) {
      console.error("Error sending reset link:", error);
      alert("Failed to send reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <h1 className="logo">Linkipax</h1>
      <div className="forgot-password-form">
        <h2 className="text-center mb-4">Forgot Password</h2>
        <p className="text-center mb-4">
          Enter your email to receive a password reset link
        </p>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="email">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>
          <Button
            variant="primary"
            type="submit"
            className="w-100 mt-3 button"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default ForgotPassword;
