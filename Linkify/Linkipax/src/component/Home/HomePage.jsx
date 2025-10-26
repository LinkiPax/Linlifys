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
import Cookies from "js-cookie";
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

  // ✅ Ensure axios sends cookies automatically
  useEffect(() => {
    axios.defaults.withCredentials = true;
  }, []);

  // ✅ Authentication setup (cookie + URL handling)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const tokenFromUrl = urlParams.get("token");
        const userFromUrl = urlParams.get("user");

        // ✅ Step 1: If OAuth redirect — save token in cookie
        if (tokenFromUrl && userFromUrl) {
          const decodedUser = JSON.parse(decodeURIComponent(userFromUrl));

          // Save token in cookie (7 days expiry)
          document.cookie = `auth_token=${tokenFromUrl}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=None`;

          // Also keep minimal data in localStorage
          localStorage.setItem("userId", decodedUser.id);
          localStorage.setItem("user", JSON.stringify(decodedUser));

          // Clean URL
          const cleanUrl = `${window.location.origin}/home/${decodedUser.id}`;
          window.history.replaceState({}, "", cleanUrl);
        }

        // ✅ Step 2: Read cookie
        const cookieToken = Cookies.get("auth_token");

        if (!cookieToken) {
          console.warn("No auth cookie found — redirecting to login");
          navigate("/login");
          return;
        }

        // ✅ Step 3: Verify token with backend
        await axios.get(`${import.meta.env.VITE_API_URL}/user/verify-token`, {
          headers: { Authorization: `Bearer ${cookieToken}` },
        });

        // ✅ Step 4: Apply token globally
        axios.defaults.headers.common["Authorization"] = `Bearer ${cookieToken}`;
        setAuthChecked(true);
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Clear all data and redirect
        Cookies.remove("auth_token");
        localStorage.clear();
        delete axios.defaults.headers.common["Authorization"];
        navigate("/login");
      }
    };

    initializeAuth();
  }, [location, navigate]);

  // ✅ Fetch homepage data once authentication is confirmed
  useEffect(() => {
    if (authChecked) fetchData();
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
      setUserProfile(userRes.data);
    } catch (error) {
      console.error("Error fetching homepage data:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        Cookies.remove("auth_token");
        localStorage.clear();
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading spinner while checking auth or fetching data
  if (loading || !authChecked) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
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
          <Col md={3} className="px-2">
            <div className="sticky-column">
              <SuggestedConnectionsCard connections={connections} />
              <TrendingTopicsCard topics={trendingTopics} />
            </div>
          </Col>

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
