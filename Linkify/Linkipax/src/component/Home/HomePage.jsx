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
import CreatePostCard from "../Cards/CreatePostCard";
import SuggestedConnectionsCard from "../Cards/SuggestedConnectionsCard";
import TrendingTopicsCard from "../Cards/TrendingCard";
import MyNetwork from "../MyNetwork/Mynewwork";
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

  // Configure axios for HTTPS
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for token in URL (Google OAuth callback)
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get('token');
        const userFromUrl = urlParams.get('user');

        if (tokenFromUrl && userFromUrl) {
          // Handle OAuth callback
          const userData = JSON.parse(decodeURIComponent(userFromUrl));
          
          // Store in localStorage
          localStorage.setItem('auth_token', tokenFromUrl);
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('userId', userData.id);
          
          // Set axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${tokenFromUrl}`;
          axios.defaults.withCredentials = true;
          
          // Clean URL
          const cleanUrl = `${window.location.origin}/home/${userData.id}`;
          window.history.replaceState({}, '', cleanUrl);
          
          setAuthChecked(true);
          return;
        }

        // Normal flow - check existing authentication
        const existingToken = localStorage.getItem('auth_token');
        const storedUserId = localStorage.getItem('userId');

        if (!existingToken || !storedUserId) {
          navigate('/login');
          return;
        }

        // Validate the token
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
          axios.defaults.withCredentials = true;
          
          await axios.get(`${import.meta.env.VITE_API_URL}/user/verify-token`);
          
          setAuthChecked(true);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Clear storage and redirect
          localStorage.removeItem('auth_token');
          localStorage.removeItem('userId');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
          navigate('/login');
          return;
        }

      } catch (error) {
        console.error("Auth initialization error:", error);
        navigate('/login');
      }
    };

    initializeAuth();
  }, [userId, location, navigate]);

  useEffect(() => {
    if (authChecked) {
      fetchData();
    }
  }, [authChecked]);

  const fetchData = async () => {
    try {
      const currentUserId = localStorage.getItem("userId");
      
      const [postResponse, connectionsResponse, trendingResponse, userResponse] =
        await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/posts`, { withCredentials: true }),
          axios.get(`${import.meta.env.VITE_API_URL}/user/suggested/${currentUserId}`, { withCredentials: true }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/trending-topics`, { withCredentials: true }),
          axios.get(`${import.meta.env.VITE_API_URL}/user/${currentUserId}`, { withCredentials: true })
        ]);
      
      setPosts(postResponse.data || []);
      setConnections(connectionsResponse.data || []);
      setTrendingTopics(trendingResponse.data || []);
      setUserProfile(userResponse.data);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <>
      <div className="homepage-background">
        <NavbarComponent />
        <Container fluid className={`mt-3 px-3 main-content`}>
          <Row>
            {/* Left Column */}
            <Col md={3} className="px-2">
              <div className="sticky-column">
                <div className="suggested-connections-card">
                  <SuggestedConnectionsCard connections={connections} />
                </div>
                <TrendingTopicsCard topics={trendingTopics} />
              </div>
            </Col>

            {/* Middle Column */}
            <Col md={6} className="px-2">
              <Status userProfilePic={userProfile?.profilePicture} />
              <div className="scrollable-postcards">
                {posts.length > 0 ? (
                  posts.map((post) => <Postcard key={post._id} post={post} />)
                ) : (
                  <div className="text-center text-muted mt-4">
                    No posts to display.
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
    </>
  );
};

export default HomePage;