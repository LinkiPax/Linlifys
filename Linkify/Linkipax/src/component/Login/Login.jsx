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
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const videoSource =
    "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4";

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
    }

    // Check for Google authentication callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    const error = urlParams.get('error');
    
    if (token && userData) {
      handleGoogleAuthSuccess(token, userData);
    }
    
    if (error) {
      setError("Google authentication failed. Please try again.");
    }
  }, []);

  const handleGoogleAuthSuccess = (token, userData) => {
    try {
      const user = JSON.parse(decodeURIComponent(userData));
      
      // Store token and user data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
      
      // Set cookie for the token
      document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      
      setSuccess("Google login successful! Redirecting...");
      setGoogleLoading(false);
      
      // Redirect based on profile completion status
      setTimeout(() => {
        if (user.profileCompleted) {
          navigate('/home');
        }
      }, 1500);
      
    } catch (error) {
      setError("Failed to process Google authentication");
      setGoogleLoading(false);
      console.error('Google auth error:', error);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setError("");
    
    // Redirect to Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/user/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/signin`,
        { email, password },
        { withCredentials: true }
      );
      
      const { token, user } = response.data;
      
      // Store user data
      localStorage.setItem("userId", user._id || user.id);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Set cookie
      document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      
      setSuccess("Login successful!");
      setError("");
      
      // Redirect based on profile completion
      setTimeout(() => {
        if (user.profileCompleted) {
          navigate(`/home/${user._id || user.id}`);
        }
      }, 1500);
      
    } catch (error) {
      setSuccess("");
      if (error.response?.data?.message?.includes('Google authentication')) {
        setError(
          "This account uses Google authentication. Please sign in with Google."
        );
      } else {
        setError(
          error.response?.data?.message || "An error occurred during login"
        );
      }
    } finally {
      setLoading(false);
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
          {/* Google benefits on video side */}
          <div className="google-benefits-side">
            <h4>Quick Access with Google</h4>
            <ul>
              <li>One-click sign in</li>
              <li>No password to remember</li>
              <li>Secure and verified</li>
              <li>Automatic profile sync</li>
            </ul>
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

            {/* Google Login Button */}
            <Button
              variant="outline-danger"
              className="w-100 mb-3 google-login-button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <i className="fab fa-google me-2"></i>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="separator">
              <span>or</span>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="email" className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  disabled={loading || googleLoading}
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
                  disabled={loading || googleLoading}
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Check
                  type="checkbox"
                  id="remember-me"
                  label="Remember me"
                  className="small-text"
                />
                <a href="/forgot-password" className="link-text small-text">
                  Forgot Password?
                </a>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-100 login-button"
                disabled={loading || googleLoading}
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
            </Form>

            <div className="signup-link text-center mt-4">
              <p className="mb-2">New to Linkipax?</p>
              <Link to="/signup" className="link-text signup-link-button">
                Join now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;