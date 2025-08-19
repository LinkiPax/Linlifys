import React, { useState } from "react";
import { Form, Button, Alert, Spinner, Container, Row, Col } from "react-bootstrap";
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
  const [loading, setLoading] = useState(false);

  // Use navigate hook for redirect
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!name) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!email.match(/\S+@\S+\.\S+/)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
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
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/Signup`,
        {
          username: name,
          email: email.trim(),
          password: password.trim(),
        }
      );
      const userId = response.data.user._id;
      setSuccess("Signup successful! Redirecting...");
      setError("");

      // Redirect to personal details page after successful signup
      setTimeout(() => {
        navigate(`/personal-details/${userId}`);
      }, 1500);
    } catch (error) {
      setSuccess("");
      setError(
        error.response?.data?.error || "An error occurred during signup"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper" style={{ minHeight: '100vh', overflow: 'hidden' }}>
      {/* Animated background elements */}
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      <Container className="signup-container" style={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
        <Row className="justify-content-center" style={{ width: '100%' }}>
          <Col xl={10} className="signup-content" style={{ maxHeight: '90vh' }}>
            {/* Header section - Made more compact */}
            <div className="signup-header" style={{ marginBottom: '1.5rem', padding: '0 1rem' }}>
              <h1 className="logo-text" style={{ fontSize: '2.2rem', marginBottom: '0.3rem' }}>Linkipax</h1>
              <h2 className="tagline" style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>Join the Professional Network</h2>
              <p className="intro-text" style={{ fontSize: '0.9rem' }}>Create your account to connect with professionals worldwide</p>
            </div>

            <Row className="form-section" style={{ margin: 0 }}>
              {/* Left column - Illustration and benefits */}
              <Col md={6} className="benefits-col" style={{ padding: '1rem' }}>
                <div className="illustration-container" style={{ marginBottom: '1rem' }}>
                  <div className="signup-illustration" style={{ height: '180px' }}>
                    <div className="illustration-circle" style={{ width: '90px', height: '90px', top: '15px', left: '20px' }}></div>
                    <div className="illustration-square" style={{ width: '60px', height: '60px', top: '70px', right: '30px' }}></div>
                    <div className="illustration-triangle" style={{ 
                      borderLeft: '35px solid transparent', 
                      borderRight: '35px solid transparent', 
                      borderBottom: '65px solid #ff9a9e',
                      bottom: '20px', 
                      left: '45px' 
                    }}></div>
                    <div className="illustration-dots">
                      <span style={{ width: '8px', height: '8px' }}></span>
                      <span style={{ width: '8px', height: '8px' }}></span>
                      <span style={{ width: '8px', height: '8px' }}></span>
                      <span style={{ width: '8px', height: '8px' }}></span>
                      <span style={{ width: '8px', height: '8px' }}></span>
                    </div>
                  </div>
                </div>
                
                <div className="benefits-list" style={{ fontSize: '0.9rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Why Join Linkipax?</h3>
                  <ul style={{ margin: 0 }}>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem' }}>Connect with professionals</li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem' }}>Discover career opportunities</li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem' }}>Share insights and knowledge</li>
                    <li style={{ padding: '0.5rem 0', paddingLeft: '1.5rem' }}>Build your professional brand</li>
                  </ul>
                </div>
              </Col>

              {/* Right column - Form with scrollable container */}
              <Col md={6} className="form-col" style={{ padding: '1rem' }}>
                <div className="signup-form-container" style={{ 
                  padding: '1.5rem', 
                  maxHeight: '65vh', 
                  overflowY: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#c3cfe2 #f5f7fa'
                }}>
                  <div className="form-header" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>Create Your Account</h3>
                    <p style={{ fontSize: '0.9rem' }}>Start your professional journey today</p>
                  </div>

                  {error && <Alert variant="danger" className="alert-custom" style={{ padding: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</Alert>}
                  {success && <Alert variant="success" className="alert-custom" style={{ padding: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem' }}>{success}</Alert>}

                  <Form onSubmit={handleSubmit} className="signup-form">
                    <Form.Group controlId="name" className="mb-2">
                      <Form.Label style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="form-input-custom"
                        disabled={loading}
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                      />
                    </Form.Group>

                    <Form.Group controlId="email" className="mb-2">
                      <Form.Label style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="form-input-custom"
                        disabled={loading}
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                      />
                    </Form.Group>

                    <Form.Group controlId="password" className="mb-2">
                      <Form.Label style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="form-input-custom"
                        disabled={loading}
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                      />
                      <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Must include uppercase, lowercase, number, and special character
                      </Form.Text>
                    </Form.Group>

                    <Form.Group controlId="confirmPassword" className="mb-3">
                      <Form.Label style={{ fontSize: '0.9rem', marginBottom: '0.3rem' }}>Confirm Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="form-input-custom"
                        disabled={loading}
                        style={{ padding: '0.6rem 0.8rem', fontSize: '0.9rem' }}
                      />
                    </Form.Group>

                    <div className="terms-section mb-3" style={{ padding: '0.7rem', fontSize: '0.85rem' }}>
                      <Form.Check
                        type="checkbox"
                        id="terms-checkbox"
                        label={
                          <span>
                            I agree to the{" "}
                            <a href="/terms" className="terms-link">Terms</a> and{" "}
                            <a href="/privacy" className="terms-link">Privacy Policy</a>
                          </span>
                        }
                        required
                      />
                    </div>

                    <Button
                      variant="primary"
                      type="submit"
                      className="signup-btn w-100"
                      disabled={loading}
                      style={{ padding: '0.7rem', fontSize: '0.9rem', marginBottom: '1rem' }}
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
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>

                    <div className="separator" style={{ margin: '1rem 0' }}>
                      <span style={{ fontSize: '0.85rem' }}>Or</span>
                    </div>

                    <div className="social-signup">
                      <Button variant="outline-primary" className="social-btn google-btn mb-2" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                        <i className="fab fa-google me-2"></i>
                        Sign up with Google
                      </Button>
                      <Button variant="outline-dark" className="social-btn linkedin-btn" style={{ padding: '0.5rem', fontSize: '0.85rem' }}>
                        <i className="fab fa-linkedin me-2"></i>
                        Sign up with LinkedIn
                      </Button>
                    </div>

                    <div className="login-redirect text-center mt-3">
                      <p style={{ fontSize: '0.85rem', margin: 0 }}>
                        Already have an account?{" "}
                        <Link to="/login" className="login-link">
                          Sign in
                        </Link>
                      </p>
                    </div>
                  </Form>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Signup;