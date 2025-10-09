import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useRef, useEffect } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const videoSource =
    "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }
  }, []);
//    function saveTokenToCookie() {
//     // Get token from localStorage
//     const token = localStorage.getItem('auth_token');
    
//     if (token) {
//         // Save to cookie
//         document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=None; Secure`;
//         console.log('Token successfully saved to cookie');
//         return true;
//     } else {
//         console.log('No token found in localStorage');
//         return false;
//     }
// }

// // Execute the function
// saveTokenToCookie();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading
    setError("");
    setSuccess("");
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/Signin`,
        { email, password },
        { withCredentials: true }
      );
      const { token, user } = response.data;
      localStorage.setItem("userId", user._id);
      localStorage.setItem("auth_token", token);
      document.cookie = `auth_token=${token}; Path=/; Max-Age=86400; SameSite=none; Secure`;
      setSuccess("Login successful!");
      setError("");
      navigate(`/home/${user._id}`);
    } catch (error) {
      setSuccess("");
      setError(
        error.response?.data?.message || "An error occurred during login"
      );
    } finally {
      setLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    <div className="login-container">
      {/* Aurora background */}
      <div className="aurora-bg">
        <div className="aurora-1"></div>
        <div className="aurora-2"></div>
        <div className="aurora-3"></div>
      </div>

      {/* Left side with video */}
      <div className="video-container">
        <video ref={videoRef} autoPlay muted loop className="background-video">
          <source src={videoSource} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="video-overlay"></div>
        <div className="video-content">
          <h1 className="logo-top">Linkipax</h1>
          <div className="welcome-text">
            <h2>Welcome Back</h2>
            <p>Connect with professionals around the world</p>
          </div>
        </div>
      </div>

      {/* Right side with login form */}
      <div className="form-container">
        <div className="login-content">
          <div className="login-form">
            <h2 className="text-center mb-4">Sign in</h2>
            <p className="subtitle">Stay updated on your professional world</p>

            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="email" className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="Email or phone"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  disabled={loading} // Disable fields during loading
                />
              </Form.Group>

              <Form.Group controlId="password" className="mb-3">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field"
                  disabled={loading} // Disable fields during loading
                />
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 mt-3 login-button"
                disabled={loading} // Disable button during loading
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
              <p className="mt-3 text-center">
                <a href="/forgot-password" className="link-text">
                  Forgot Password?
                </a>
              </p>
            </Form>
          </div>
          <div className="signup-link text-center mt-4">
            <p>
              New to Linkipax?{" "}
              <Link to="/Signup" className="link-text">
                Join now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;