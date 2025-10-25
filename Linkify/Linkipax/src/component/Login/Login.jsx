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
import "./Login.css";

// Cookie utility functions
const setCookie = (name, value, days = 1) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  const secureFlag = ';secure';
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;samesite=none${secureFlag}`;
};

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

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

    // Check for Google authentication callback first
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    const userData = urlParams.get('user');
    const authSuccess = urlParams.get('auth');
    const newUser = urlParams.get('newUser');
    const errorFromUrl = urlParams.get('error');
    
    if (tokenFromUrl && userData && authSuccess === 'success') {
        handleGoogleAuthSuccess(tokenFromUrl, userData, newUser === 'true');
        return;
    }
    
    if (errorFromUrl) {
        const errorMessage = urlParams.get('message') || "Google authentication failed. Please try again.";
        setError(errorMessage);
        return;
    }

    // Check if user is already logged in via token verification (using cookies now)
    const checkExistingAuth = async () => {
        const token = getCookie('auth_token');
        const userId = getCookie('userId');
        
        console.log('Existing cookies - Token:', !!token, 'UserID:', userId);
        
        if (!token || !userId) {
            return; // No existing auth
        }

        try {
            setLoading(true);
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/user/verify-token`,
                {
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Token is valid, redirect to home
            const { user } = response.data;
            navigate(`/home/${user.id}`);
            
        } catch (error) {
            console.log('Token invalid, requiring new login');
            // Clear invalid cookies
            deleteCookie('auth_token');
            deleteCookie('userId');
            deleteCookie('user_data');
        } finally {
            setLoading(false);
        }
    };

    checkExistingAuth();
}, [navigate]);

  const handleGoogleAuthSuccess = (token, userData, isNewUser) => {
    try {
      const user = JSON.parse(decodeURIComponent(userData));
      
      // Store token and user data in COOKIES (not localStorage)
      setCookie('auth_token', token, 7); // 7 days
      setCookie('userId', user.id, 7);
      setCookie('user_data', userData, 7);
      
      // Also store in localStorage as fallback
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('userId', user.id);
      
      // Set axios default headers with credentials for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;
      
      setSuccess("Google login successful! Redirecting...");
      setGoogleLoading(false);
      
      // Clean URL - remove query parameters
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      // Redirect based on profile completion
      setTimeout(() => {
        if (isNewUser || !user.profileCompleted) {
          navigate(`/personal-details/${user.id}`);
        } else {
          navigate(`/home/${user.id}`);
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
    const googleAuthUrl = `${import.meta.env.VITE_API_URL}/user/google`;
    console.log('Redirecting to Google OAuth:', googleAuthUrl);
    window.location.href = googleAuthUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    // Validate inputs
    if (!email || !password) {
      setError("Please enter both email/username and password");
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/signin`,
        { email, password },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const { token, user, cookieSet } = response.data;
      
      console.log('Login response:', { token, user, cookieSet });
      
      // Store user data in COOKIES (primary storage)
      setCookie('auth_token', token, 7); // 7 days
      setCookie('userId', user.id, 7);
      setCookie('user_data', JSON.stringify(user), 7);
      
      // Also store in localStorage as fallback
      localStorage.setItem("userId", user.id);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      
      // Set axios default headers for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;
      
      setSuccess("Login successful! Redirecting...");
      setError("");
      
      // Redirect based on profile completion
      setTimeout(() => {
        setCookie('auth_token', token, 7);
        if (user.profileCompleted) {
          navigate(`/home/${user.id}`);
        } else {
          navigate(`/personal-details/${user.id}`);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      setSuccess("");
      
      if (error.response?.status === 401) {
        if (error.response?.data?.message?.includes('Google authentication')) {
          setError(
            "This account uses Google authentication. Please sign in with Google."
          );
        } else {
          setError(
            error.response?.data?.message || "Invalid email/username or password"
          );
        }
      } else if (error.response?.status === 400) {
        setError(
          error.response?.data?.errors?.[0]?.msg || "Please check your input"
        );
      } else if (error.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError(
          error.response?.data?.message || "An unexpected error occurred"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced cookie test functionality
  const testCookies = async () => {
    try {
      // Test frontend cookies
      console.log('All cookies:', document.cookie);
      console.log('Auth token cookie:', getCookie('auth_token'));
      console.log('User ID cookie:', getCookie('userId'));
      console.log('User data cookie:', getCookie('user_data'));
      
      // Test backend cookies
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/user/debug-cookies`,
        { withCredentials: true }
      );
      console.log('Backend cookie debug info:', response.data);
      
      // Set a test cookie
      setCookie('test_cookie', 'frontend_cookie_works', 1);
      console.log('Test cookie set, refreshing in 2 seconds...');
      
      setTimeout(() => {
        console.log('Test cookie after refresh:', getCookie('test_cookie'));
      }, 2000);
      
    } catch (error) {
      console.error('Cookie test failed:', error);
    }
  };

  // Clear all auth data (for testing)
  const clearAuthData = () => {
    // Clear cookies
    deleteCookie('auth_token');
    deleteCookie('userId');
    deleteCookie('user_data');
    deleteCookie('test_cookie');
    
    // Clear localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    
    console.log('All auth data cleared');
    setSuccess('All authentication data cleared successfully');
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

            {/* Debug buttons - remove in production */}
            {import.meta.env.DEV && (
              <div className="mb-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  className="me-2"
                  onClick={testCookies}
                >
                  Debug Cookies
                </Button>
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  onClick={clearAuthData}
                >
                  Clear Auth Data
                </Button>
              </div>
            )}

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
                  type="text"
                  placeholder="Email or username"
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