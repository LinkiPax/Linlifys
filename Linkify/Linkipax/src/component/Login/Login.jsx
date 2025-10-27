import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useRef, useEffect } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
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
  }, [navigate]);

  const storeAuthData = (data) => {
    console.log('💾 Storing auth data:', data);
    
    const token = data.token;
    console.log('Token:', token);
    const user = data.user;
    const userId = user?._id || user?.id || data.userId;
    
    if (!token) {
      console.error('❌ No token found in response:', data);
      throw new Error('No authentication token received from server');
    }
    
    if (!userId) {
      console.error('❌ No user ID found in response:', data);
      throw new Error('No user ID received from server');
    }

    localStorage.setItem("auth_token", token);
    localStorage.setItem("userId", userId);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    axios.defaults.withCredentials = true;
    
    console.log('✅ Auth data stored successfully:', {
      token: token.substring(0, 20) + '...',
      userId,
      hasUser: !!user
    });
    
    return { token, user, userId };
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError("");

    try {
      console.log('🔐 Starting Google authentication...');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/google-auth`,
        {
          credential: credentialResponse.credential
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📨 Google auth response received:', response.data);
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }

      const { token, user, userId } = storeAuthData(response.data);
      
      console.log('✅ Google auth successful');
      setSuccess("Google login successful! Redirecting...");
      
      const redirectTo = response.data.redirectTo || 
                        (response.data.profileCompleted ? `/home/${userId}` : `/personal-details/${userId}`);
      
      console.log('🔄 Redirecting to:', redirectTo);
      
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Google auth error:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          "Google authentication failed";
      setError(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    console.error('❌ Google login failed');
    setError("Google login failed. Please try again.");
    setGoogleLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    if (!email || !password) {
      setError("Please enter both email and password");
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔐 Starting login process...');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/Signin`,
        { email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📨 Login response received:', response.data);
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }

      const { token, user, userId } = storeAuthData(response.data);
      
      console.log('✅ Login successful');
      setSuccess("Login successful! Redirecting...");
      
      const redirectTo = response.data.redirectTo || 
                        (response.data.profileCompleted ? `/home/${userId}` : `/personal-details/${userId}`);
      
      console.log('🔄 Redirecting to:', redirectTo);
      
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        if (error.response?.data?.message?.includes('Google authentication')) {
          setError(
            "This account uses Google authentication. Please use Google login."
          );
        } else {
          setError(
            error.response?.data?.message || "Invalid email or password"
          );
        }
      } else if (error.response?.status === 400) {
        setError(
          error.response?.data?.message || 
          error.response?.data?.errors?.[0]?.msg || 
          "Please check your input"
        );
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError("Network error. Please check your connection.");
      } else if (error.message?.includes('No authentication token')) {
        setError("Authentication failed. No token received from server.");
      } else {
        setError(
          error.response?.data?.message || 
          error.response?.data?.error ||
          "An unexpected error occurred"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <div className="login-container">
        {/* Aurora background */}
        <div className="aurora-bg">
          <div className="aurora-1"></div>
          <div className="aurora-2"></div>
          <div className="aurora-3"></div>
        </div>

        {/* Left side with video */}
        <div className="video-containerlogin">
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
            
            {/* Google Benefits Section */}
            <div className="google-benefits-side">
              <h4>Why sign in with Google?</h4>
              <ul>
                <li>One-click secure access</li>
                <li>No password to remember</li>
                <li>Enhanced security protection</li>
                <li>Faster login experience</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right side with login form */}
        <div className="form-container">
          <div className="login-content">
            <div className="login-form">
              <div className="form-header">
                <h2>Welcome Back</h2>
                <p className="subtitle">Sign in to continue your professional journey</p>
              </div>

              {error && (
                <Alert variant="danger" className="alert-custom">
                  <i className="bi bi-exclamation-triangle"></i>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" className="alert-custom">
                  <i className="bi bi-check-circle"></i>
                  {success}
                </Alert>
              )}

              {/* Google Login Button */}
              <div className="google-section">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  useOneTap={false}
                  shape="rectangular"
                  size="large"
                  text="continue_with"
                  width="100%"
                  disabled={loading || googleLoading}
                />
                {googleLoading && (
                  <div className="loading-overlay">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <span>Processing Google login...</span>
                  </div>
                )}
              </div>

              <div className="separator">
                <span>or continue with email</span>
              </div>

              <Form onSubmit={handleSubmit} className="custom-form">
                <Form.Group controlId="email" className="form-group-custom">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-control-login"
                    disabled={loading || googleLoading}
                  />
                </Form.Group>

                <Form.Group controlId="password" className="form-group-custom">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-control-login"
                    disabled={loading || googleLoading}
                  />
                </Form.Group>

                <div className="form-options">
                  <Form.Check
                    type="checkbox"
                    id="remember-me"
                    label="Remember me"
                    className="remember-check"
                  />
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="login-btn-primary"
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
                    "Sign In"
                  )}
                </Button>
              </Form>

              <div className="signup-section">
                <p>New to Linkipax?</p>
                <Link to="/signup" className="signup-link-btn">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;