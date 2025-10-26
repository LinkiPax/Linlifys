// import React, { useState, useEffect } from "react";
// import { Container, Row, Col, Spinner } from "react-bootstrap";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import NavbarComponent from "../navbar/Navbar";
// import Postcard from "../Cards/Postcard";
// import EventsCard from "../Cards/EventsCard";
// import AdvertisementCard from "../Cards/AdvertisementCard";
// import CreatePostCard from "../Cards/CreatePostCard";
// import SuggestedConnectionsCard from "../Cards/SuggestedConnectionsCard";
// import TrendingTopicsCard from "../Cards/TrendingCard";
// import MyNetwork from "../MyNetwork/Mynewwork";
// import Status from "../Status/Status";
// import "./HomePage.css";

// const HomePage = () => {
//   const { userId } = useParams(); // Extract userId from URL
//   const [posts, setPosts] = useState([]);
//   const [connections, setConnections] = useState([]);
//   const [trendingTopics, setTrendingTopics] = useState([]);
//   const [userProfile, setUserProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [postResponse, connectionsResponse, trendingResponse] =
//           await Promise.all([
//             axios.get(`${import.meta.env.VITE_API_URL}/api/posts`),
//             axios.get(`/api/user/suggestions/suggestions?userId=${userId}`),
//             axios.get(`${import.meta.env.VITE_API_URL}/api/trending-topics`),
//           ]);
//         setPosts(postResponse.data || []);
//         setConnections(connectionsResponse.data || []);
//         setTrendingTopics(trendingResponse.data || []);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, [userId]);

//   useEffect(() => {
//     const fetchUserInfo = async () => {
//       try {
//         const storedUserId = localStorage.getItem("userId");
//         if (storedUserId) {
//           const response = await axios.get(
//             `${import.meta.env.VITE_API_URL}/user/${storedUserId}`
//           );
//           setUserProfile(response.data);
//         }
//       } catch (error) {
//         console.error("Error fetching user info:", error);
//       }
//     };

//     fetchUserInfo();
//   }, []);

//   if (loading) {
//     return (
//       <div className="text-center mt-5">
//         <Spinner animation="border" role="status">
//           <span className="visually-hidden">Loading...</span>
//         </Spinner>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="homepage-background">
//         <NavbarComponent />
//         <Container fluid className={`mt-3 px-3 main-content`}>
//           <Row>
//             {/* Left Column */}
//             <Col md={3} className="px-2">
//               <div className="sticky-column">
//                 <div className="suggested-connections-card">
//                   <SuggestedConnectionsCard connections={connections} />
//                 </div>

//                 <TrendingTopicsCard topics={trendingTopics} />
//               </div>
//             </Col>

//             {/* Middle Column */}
//             <Col md={6} className="px-2">
//               <Status userProfilePic={userProfile?.profilePicture} />
//               {/* <CreatePostCard userId={userId} /> */}
//               <div className="scrollable-postcards">
//                 {posts.length > 0 ? (
//                   posts.map((post) => <Postcard key={post._id} post={post} />)
//                 ) : (
//                   <div className="text-center text-muted mt-4">
//                     No posts to display.
//                   </div>
//                 )}
//               </div>
//             </Col>

//             {/* Right Column */}
//             <Col md={3} className="px-2">
//               <div className="sticky-column">
//                 <EventsCard />
//                 <AdvertisementCard />
//               </div>
//             </Col>
//           </Row>
//         </Container>
//       </div>
//     </>
//   );
// };

// export default HomePage;
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import NavbarComponent from "../navbar/Navbar";
import Postcard from "../Cards/Postcard";
import EventsCard from "../Cards/EventsCard";
import AdvertisementCard from "../Cards/AdvertisementCard";
import SuggestedConnectionsCard from "../Cards/SuggestedConnectionsCard";
import TrendingTopicsCard from "../Cards/TrendingCard";
import Status from "../Status/Status";
import "./HomePage.css";

const HomePage = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ Always include credentials for secure cross-origin requests
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  // ✅ Authentication initialization
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get("token");
        const userFromUrl = urlParams.get("user");

        if (tokenFromUrl) {
          // Set cookie in client
          document.cookie = `auth_token=${tokenFromUrl};path=/;max-age=${7*24*60*60}`;
        }

        if (tokenFromUrl && userFromUrl) {
          // ✅ Parse user data from URL
          let userData;
          try {
            userData = JSON.parse(decodeURIComponent(userFromUrl));
          } catch (parseError) {
            console.error("Error parsing user data:", parseError);
            navigate("/login");
            return;
          }

          // ✅ Save token and user data locally
          localStorage.setItem("auth_token", tokenFromUrl);
          localStorage.setItem("userId", userData.id);
          localStorage.setItem("user", userFromUrl);
          
          // ✅ Apply token to Axios headers
          axios.defaults.headers.common["Authorization"] = `Bearer ${tokenFromUrl}`;

          // ✅ Clean the URL (remove query params)
          const cleanUrl = `${window.location.origin}/home/${userData.id}`;
          window.history.replaceState({}, "", cleanUrl);

          setAuthChecked(true);
          return;
        }

        // ✅ If no token in URL, check stored session
        const existingToken = localStorage.getItem("auth_token");
        const storedUserId = localStorage.getItem("userId");

        if (!existingToken || !storedUserId) {
          navigate("/login");
          return;
        }

        // ✅ Validate existing token with backend - handle the response structure properly
        axios.defaults.headers.common["Authorization"] = `Bearer ${existingToken}`;
        const verifyResponse = await axios.get(`${import.meta.env.VITE_API_URL}/user/verify-token`);
        
        // The response has { success: true, user: userData } structure
        if (verifyResponse.data.success) {
          setAuthChecked(true);
        } else {
          throw new Error('Token verification failed');
        }

      } catch (error) {
        console.error("Auth initialization failed:", error);

        // Clear any invalid data and redirect to login
        localStorage.removeItem("auth_token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];

        navigate("/login");
      }
    };

    initializeAuth();
  }, [location, navigate, userId]);

  // ✅ Fetch homepage data once authenticated
  useEffect(() => {
    if (authChecked) {
      fetchData();
    }
  }, [authChecked]);

  const fetchData = async () => {
    try {
      const currentUserId = localStorage.getItem("userId");
      const apiBase = import.meta.env.VITE_API_URL;

      const [postRes, connRes, trendRes, userRes] = await Promise.all([
        axios.get(`${apiBase}/api/posts`),
        axios.get(`${apiBase}/user/suggested/${currentUserId}`),
        axios.get(`${apiBase}/api/trending-topics`),
        axios.get(`${apiBase}/user/${currentUserId}`),
      ]);

      setPosts(postRes.data || []);
      setConnections(connRes.data || []);
      setTrendingTopics(trendRes.data || []);
      
      // Handle both response structures for user data
      const userData = userRes.data;
      if (userData && userData.user) {
        // If response has { success: true, user: userData } structure
        setUserProfile(userData.user);
      } else {
        // If response is direct user object
        setUserProfile(userData);
      }
      
    } catch (error) {
      console.error("Error fetching homepage data:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        // Clear invalid tokens and redirect to login
        localStorage.removeItem("auth_token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle post creation
  const handlePostCreated = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Handle post deletion
  const handlePostDeleted = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  // ✅ Loading spinner
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  // ✅ Main content
  return (
    <div className="homepage-background">
      <NavbarComponent />
      <Container fluid className="mt-3 px-3 main-content">
        <Row>
          {/* Left Column */}
          <Col md={3} className="px-2">
            <div className="sticky-column">
              <SuggestedConnectionsCard connections={connections} />
              <TrendingTopicsCard topics={trendingTopics} />
            </div>
          </Col>

          {/* Middle Column */}
          <Col md={6} className="px-2">
            <Status 
              userProfilePic={userProfile?.profilePicture} 
              onPostCreated={handlePostCreated}
            />
            <div className="scrollable-postcards">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Postcard 
                    key={post._id} 
                    post={post} 
                    onPostDeleted={handlePostDeleted}
                  />
                ))
              ) : (
                <div className="text-center text-muted mt-4">
                  <p>No posts to display.</p>
                  <p>Be the first to share something!</p>
                </div>
              )}
            </div>
          </Col>

          {/* Right Column */}
          <Col md={3} className="px-2">
            <div className="sticky-column">
              <EventsCard />
              <AdvertisementCard />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;