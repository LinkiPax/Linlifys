import React, { useState } from "react";
import { Form, Button, Container, Alert } from "react-bootstrap";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Signup.css";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Use navigate hook for redirect
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!name) {
      setError("Name is required");
      return;
    }

    if (!email.match(/\S+@\S+\.\S+/)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      setError(
        "Password must contain uppercase, lowercase, a number, and a special character"
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/Signup`,
        {
          username: name,
          // Send `name` as `username` to the backend
          // trim() removes whitespace from both ends of a string
          email: email.trim(),
          password: password.trim(),
        }
      );
      const userId = response.data.user._id; // Extract userId from response
      setSuccess("Signup successful! You can now log in.");
      setError("");

      // Redirect to home page after successful signup
      navigate(`/personal-details/${userId}`); // Redirect to the home page ("/home" is the home route)
    } catch (error) {
      setSuccess("");
      setError(
        error.response?.data?.error || "An error occurred during signup"
      );
    }
  };

  return (
    <Container className="mt-5">
      <h1 className="logo">Linkipax</h1>

      <div className="signup-form">
        <h2 className="text-center mb-4">Sign up</h2>
        <p>Make the most of your professional life</p>

        {/* Show error or success messages */}
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="name">
            <Form.Control
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="inpu"
            />
          </Form.Group>

          <Form.Group controlId="email">
            <Form.Control
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="inpu"
            />
          </Form.Group>

          <Form.Group controlId="password">
            <Form.Control
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="inpu"
            />
          </Form.Group>

          <Form.Group controlId="confirmPassword">
            <Form.Control
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="inpu"
            />
          </Form.Group>

          <p>
            By clicking Agree & Join or Continue, you agree to the User
            Agreement, Privacy Policy, and Cookie Policy.
          </p>

          <Button variant="primary" type="submit" className="w-100 mt-3 button">
            Sign up
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default Signup;
