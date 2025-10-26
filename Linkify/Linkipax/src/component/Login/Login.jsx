// import "bootstrap/dist/css/bootstrap.min.css";
// import React, { useState, useRef, useEffect } from "react";
// import { Form, Button, Alert, Spinner } from "react-bootstrap";
// import axios from "axios";
// import { Link, useNavigate } from "react-router-dom";
// import "./Login.css";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [googleLoading, setGoogleLoading] = useState(false);
//   const navigate = useNavigate();
//   const videoRef = useRef(null);

//   const videoSource =
//     "https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4";

//   useEffect(() => {
//     if (videoRef.current) {
//         videoRef.current.playbackRate = 0.8;
//     }

//     // Check for Google authentication callback first
//     const urlParams = new URLSearchParams(window.location.search);
//     const tokenFromUrl = urlParams.get('token');
//     const userData = urlParams.get('user');
//     const authSuccess = urlParams.get('auth');
//     const newUser = urlParams.get('newUser');
//     const errorFromUrl = urlParams.get('error');
//     console.log('URL Parameters:', urlParams.toString());
//     console.log('Token from URL:', tokenFromUrl);
//     console.log('User data from URL:', userData);
//     console.log('Auth success from URL:', authSuccess);
//     console.log('New user from URL:', newUser);
//     console.log('Error from URL:', errorFromUrl);
//         if (tokenFromUrl && userData && authSuccess === 'success') {
//         handleGoogleAuthSuccess(tokenFromUrl, userData, newUser === 'true');
//         return;
//     }
    
//     if (errorFromUrl) {
//         const errorMessage = urlParams.get('message') || "Google authentication failed. Please try again.";
//         setError(errorMessage);
//         return;
//     }

//     // Check if user is already logged in via token verification
//     const checkExistingAuth = async () => {
//         const token = localStorage.getItem('auth_token');
//         const userId = localStorage.getItem('userId');
        
//         if (!token || !userId) {
//             return; // No existing auth
//         }

//         try {
//             setLoading(true);
//             const response = await axios.get(
//                 `${import.meta.env.VITE_API_URL}/user/verify-token`,
//                 {
//                     withCredentials: true,
//                     headers: {
//                         'Authorization': `Bearer ${token}`
//                     }
//                 }
//             );

//             // Token is valid, redirect to home
//             const { user } = response.data;
//             navigate(`/home/${user.id}`);
            
//         } catch (error) {
//             console.log('Token invalid, requiring new login');
//             // Clear invalid tokens
//             // localStorage.removeItem('auth_token');
//             // localStorage.removeItem('user');
//             // localStorage.removeItem('userId');
//         } finally {
//             setLoading(false);
//         }
//     };

//     checkExistingAuth();
// }, [navigate]);

//   const handleGoogleAuthSuccess = (token, userData, isNewUser) => {
//     try {
//       const user = JSON.parse(decodeURIComponent(userData));
      
//       // Store token and user data in localStorage as fallback
//       localStorage.setItem('auth_token', token);
//       localStorage.setItem('user', JSON.stringify(user));
//       localStorage.setItem('userId', user.id);
      
//       // Set axios default headers with credentials for future requests
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       axios.defaults.withCredentials = true;
      
//       setSuccess("Google login successful! Redirecting...");
//       setGoogleLoading(false);
      
//       // // Clean URL - remove query parameters
//       // const cleanUrl = window.location.origin + window.location.pathname;
//       // window.history.replaceState({}, '', cleanUrl);
      
//       // Redirect based on profile completion
//       setTimeout(() => {
//         if (isNewUser || !user.profileCompleted) {
//           navigate(`/personal-details/${user.id}`);
//         } else {
//           navigate(`/home/${user.id}`);
//         }
//       }, 1500);
      
//     } catch (error) {
//       setError("Failed to process Google authentication");
//       setGoogleLoading(false);
//       console.error('Google auth error:', error);
//     }
//   };

//   const handleGoogleLogin = () => {
//     setGoogleLoading(true);
//     setError("");
    
//     // Redirect to Google OAuth endpoint
//     const googleAuthUrl = `${import.meta.env.VITE_API_URL}/user/google`;
//     console.log('Redirecting to Google OAuth:', googleAuthUrl);
//     window.location.href = googleAuthUrl;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSuccess("");
    
//     // Validate inputs
//     if (!email || !password) {
//       setError("Please enter both email/username and password");
//       setLoading(false);
//       return;
//     }
    
//     try {
//       const response = await axios.post(
//         `${import.meta.env.VITE_API_URL}/user/signin`,
//         { email, password },
//         { 
//           withCredentials: true, // Essential for cookies
//           headers: {
//             'Content-Type': 'application/json'
//           }
//         }
//       );
      
//       const { token, user, cookieSet } = response.data;
      
//       console.log('Login response:', { token, user, cookieSet });
      
//       // Store user data in localStorage as fallback
//       localStorage.setItem("userId", user.id);
//       localStorage.setItem("auth_token", token);
//       localStorage.setItem("user", JSON.stringify(user));
      
//       // Set axios default headers for future requests
//       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//       axios.defaults.withCredentials = true;
      
//       setSuccess("Login successful! Redirecting...");
//       setError("");
      
//       // Redirect based on profile completion
//       setTimeout(() => {
//         if (user.profileCompleted) {
//           navigate(`/home/${user.id}`);
//         } else {
//           navigate(`/personal-details/${user.id}`);
//         }
//       }, 1500);
      
//     } catch (error) {
//       console.error('Login error:', error);
//       setSuccess("");
      
//       if (error.response?.status === 401) {
//         if (error.response?.data?.message?.includes('Google authentication')) {
//           setError(
//             "This account uses Google authentication. Please sign in with Google."
//           );
//         } else {
//           setError(
//             error.response?.data?.message || "Invalid email/username or password"
//           );
//         }
//       } else if (error.response?.status === 400) {
//         setError(
//           error.response?.data?.errors?.[0]?.msg || "Please check your input"
//         );
//       } else if (error.response?.status === 500) {
//         setError("Server error. Please try again later.");
//       } else if (error.code === 'NETWORK_ERROR' || !error.response) {
//         setError("Network error. Please check your connection.");
//       } else {
//         setError(
//           error.response?.data?.message || "An unexpected error occurred"
//         );
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Test cookie functionality
//   const testCookies = async () => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/user/debug-cookies`,
//         { withCredentials: true }
//       );
//       console.log('Cookie debug info:', response.data);
//     } catch (error) {
//       console.error('Cookie test failed:', error);
//     }
//   };

//   return (
//     <div className="login-container">
//       {/* Aurora background */}
//       <div className="aurora-bg">
//         <div className="aurora-1"></div>
//         <div className="aurora-2"></div>
//         <div className="aurora-3"></div>
//       </div>

//       {/* Left side with video */}
//       <div className="video-container">
//         <video ref={videoRef} autoPlay muted loop className="background-video">
//           <source src={videoSource} type="video/mp4" />
//           Your browser does not support the video tag.
//         </video>
//         <div className="video-overlay"></div>
//         <div className="video-content">
//           <h1 className="logo-top">Linkipax</h1>
//           <div className="welcome-text">
//             <h2>Welcome Back</h2>
//             <p>Connect with professionals around the world</p>
//           </div>
//         </div>
//       </div>

//       {/* Right side with login form */}
//       <div className="form-container">
//         <div className="login-content">
//           <div className="login-form">
//             <h2 className="text-center mb-4">Sign in</h2>
//             <p className="subtitle">Stay updated on your professional world</p>

//             {error && <Alert variant="danger">{error}</Alert>}
//             {success && <Alert variant="success">{success}</Alert>}

//             {/* Debug button - remove in production */}
//             {import.meta.env.DEV && (
//               <Button 
//                 variant="outline-secondary" 
//                 size="sm" 
//                 className="mb-2"
//                 onClick={testCookies}
//               >
//                 Debug Cookies
//               </Button>
//             )}

//             {/* Google Login Button */}
//             <Button
//               variant="outline-danger"
//               className="w-100 mb-3 google-login-button"
//               onClick={handleGoogleLogin}
//               disabled={googleLoading || loading}
//             >
//               {googleLoading ? (
//                 <>
//                   <Spinner
//                     as="span"
//                     animation="border"
//                     size="sm"
//                     role="status"
//                     aria-hidden="true"
//                     className="me-2"
//                   />
//                   Connecting to Google...
//                 </>
//               ) : (
//                 <>
//                   <i className="fab fa-google me-2"></i>
//                   Continue with Google
//                 </>
//               )}
//             </Button>

//             <div className="separator">
//               <span>or</span>
//             </div>

//             <Form onSubmit={handleSubmit}>
//               <Form.Group controlId="email" className="mb-3">
//                 <Form.Control
//                   type="text"
//                   placeholder="Email or username"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   required
//                   className="input-field"
//                   disabled={loading || googleLoading}
//                 />
//               </Form.Group>

//               <Form.Group controlId="password" className="mb-3">
//                 <Form.Control
//                   type="password"
//                   placeholder="Password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   required
//                   className="input-field"
//                   disabled={loading || googleLoading}
//                 />
//               </Form.Group>

//               <div className="d-flex justify-content-between align-items-center mb-3">
//                 <Form.Check
//                   type="checkbox"
//                   id="remember-me"
//                   label="Remember me"
//                   className="small-text"
//                 />
//                 <a href="/forgot-password" className="link-text small-text">
//                   Forgot Password?
//                 </a>
//               </div>

//               <Button
//                 variant="primary"
//                 type="submit"
//                 className="w-100 login-button"
//                 disabled={loading || googleLoading}
//               >
//                 {loading ? (
//                   <>
//                     <Spinner
//                       as="span"
//                       animation="border"
//                       size="sm"
//                       role="status"
//                       aria-hidden="true"
//                       className="me-2"
//                     />
//                     Signing in...
//                   </>
//                 ) : (
//                   "Sign in"
//                 )}
//               </Button>
//             </Form>

//             <div className="signup-link text-center mt-4">
//               <p className="mb-2">New to Linkipax?</p>
//               <Link to="/signup" className="link-text signup-link-button">
//                 Join now
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;
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
    
    // Removed checkExistingAuth function to prevent auto-redirect issues
    console.log('🔍 Auto-auth check disabled');
  }, [navigate]);

  // Enhanced token storage function
  const storeAuthData = (data) => {
    console.log('💾 Storing auth data:', data);
    
    // Extract token from response data
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

    // Store in localStorage
    localStorage.setItem("auth_token", token);
    localStorage.setItem("userId", userId);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    }
    
    // Set axios defaults for future requests
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
      console.log('📨 Google credential received');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/google-auth`,
        {
          credential: credentialResponse.credential
        },
        { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📨 Google auth response received:', response.data);
      
      if (!response.data.token) {
        throw new Error('No token received from server');
      }

      // Store authentication data from response
      const { token, user, userId } = storeAuthData(response.data);
      
      console.log('✅ Google auth successful');
      setSuccess("Google login successful! Redirecting...");
      
      // Determine redirect path
      const redirectTo = response.data.redirectTo || 
                        (response.data.profileCompleted ? `/home/${userId}` : `/personal-details/${userId}`);
      
      console.log('🔄 Redirecting to:', redirectTo);
      
      // Redirect after short delay
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
      console.log('📧 Email:', email);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/Signin`,
        { email, password },
        { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📨 Login response received:', response.data);
      
      // Check if token exists in response
      if (!response.data.token) {
        throw new Error('No token received from server');
      }

      // Store authentication data from response
      const { token, user, userId } = storeAuthData(response.data);
      
      console.log('✅ Login successful');
      setSuccess("Login successful! Redirecting...");
      
      // Determine redirect path
      const redirectTo = response.data.redirectTo || 
                        (response.data.profileCompleted ? `/home/${userId}` : `/personal-details/${userId}`);
      
      console.log('🔄 Redirecting to:', redirectTo);
      
      // Redirect after short delay
      setTimeout(() => {
        navigate(redirectTo);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('Error response:', error.response?.data);
      
      // Enhanced error handling
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

  // Debug function to check storage
  const debugStorage = () => {
    console.log('🔍 Storage Debug:');
    console.log('localStorage auth_token:', localStorage.getItem('auth_token') ? 'PRESENT' : 'MISSING');
    console.log('localStorage userId:', localStorage.getItem('userId'));
    console.log('localStorage user:', localStorage.getItem('user'));
    console.log('Axios default headers:', axios.defaults.headers.common['Authorization'] ? 'SET' : 'NOT SET');
  };

  // Clear storage function for debugging
  const clearStorage = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
    axios.defaults.headers.common['Authorization'] = null;
    console.log('🧹 Storage cleared');
    setSuccess('Storage cleared. Please login again.');
  };

  const isDevelopment = import.meta.env.DEV;

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

              {error && (
                <Alert variant="danger" className="small">
                  {error}
                </Alert>
              )}
              {success && <Alert variant="success">{success}</Alert>}

              {/* Debug buttons in development */}
              {isDevelopment && (
                <div className="mb-3 d-flex gap-2">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={debugStorage}
                  >
                    Debug Storage
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={clearStorage}
                  >
                    Clear Storage
                  </Button>
                </div>
              )}

              {/* Google Login Button */}
              <div className="mb-3">
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
                  <div className="text-center mt-2">
                    <Spinner animation="border" size="sm" variant="primary" />
                    <span className="ms-2 small">Processing Google login...</span>
                  </div>
                )}
              </div>

              <div className="separator">
                <span>or</span>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="email" className="mb-3">
                  <Form.Label className="small text-muted">Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field"
                    disabled={loading || googleLoading}
                  />
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                  <Form.Label className="small text-muted">Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
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
                  <Link to="/forgot-password" className="link-text small-text">
                    Forgot Password?
                  </Link>
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

              {/* Debug info in development */}
              {isDevelopment && (
                <div className="mt-3 p-2 bg-light rounded small">
                  <div>API URL: {import.meta.env.VITE_API_URL}</div>
                  <div>Google Client ID: {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'SET' : 'MISSING'}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default Login;