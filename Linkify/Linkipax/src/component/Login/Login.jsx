import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post(
        'http://localhost:5000/user/Signin',
        { email, password },
        { withCredentials: true }  // Add this option to send/receive cookies
      );
  
      const { token, user } = response.data;  
      console.log(token, user);
      console.log('Token:', token);
      console.log('User:', user._id);
      // Save token and userId to localStorage
      localStorage.setItem('userId', user._id); // Store userId as well
  
      setSuccess('Login successful!');
      setError('');
  
      // Redirect to homepage
      navigate(`/home/${user._id}`);
    } catch (error) {
      setSuccess('');
      setError(error.response?.data?.message || 'An error occurred during login');
    }
  };
  
  return (
    <Container className="mt-5"> 
      <h1 className="logo">Linkipax</h1>
      <div className="login-form">
        <h2 className="text-center mb-4">Sign in</h2>
        <p>Stay updated on your professional world.</p>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="email">
            <Form.Control
              type="email"
              placeholder="Email or phone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="inpu"
            />
          </Form.Group>

          <Form.Group controlId="password">
            <Form.Control
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="inpu"
            />
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 mt-3 button">
            Sign in
          </Button>
          <p className="mt-3 text-center">
            <a href="/forgot-password">Forgot Password?</a>
          </p>
        </Form>
      </div>
      <div className="mt-3 text-center">
        <Link to="/Signup">Create new user</Link>
      </div>
    </Container>
  );
};

export default Login;
