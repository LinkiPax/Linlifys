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
import { useParams, useLocation } from "react-router-dom";
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
  const { userId } = useParams(); // Extract userId from URL
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const initializeUser = async () => {
    try {
      // Get token from cookies (authtoken)
      const cookieToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      const urlParams = new URLSearchParams(location.search);
      const tokenFromUrl = urlParams.get("token");
      const userParam = urlParams.get("user");
      const storedUserId = localStorage.getItem("userId");
      let currentUserId = userId || storedUserId;

      // Priority: token from URL → cookie → localStorage
      const finalToken = tokenFromUrl || cookieToken || localStorage.getItem("auth_token");

      if (tokenFromUrl && userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("auth_token", tokenFromUrl);
        localStorage.setItem("userId", userData.id);
        axios.defaults.headers.common["Authorization"] = `Bearer ${tokenFromUrl}`;

        // Clean the URL
        window.history.replaceState({}, "", `${window.location.origin}/home/${userData.id}`);
        currentUserId = userData.id;
      } else if (finalToken) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${finalToken}`;
      } else {
        console.warn("⚠️ No token found in cookies, URL, or localStorage.");
      }

      if (!currentUserId) {
        console.warn("⚠️ No userId found — skipping fetchData");
        return;
      }

      await fetchData(currentUserId);
    } catch (err) {
      console.error("Error initializing user:", err);
    } finally {
      setLoading(false);
    }
  };

  initializeUser();
}, [userId]);

const fetchData = async (currentUserId) => {
  try {
    const [postResponse, connectionsResponse, trendingResponse] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/api/posts`),
      axios.get(`${import.meta.env.VITE_API_URL}/user/suggested/${currentUserId}`),
      axios.get(`${import.meta.env.VITE_API_URL}/api/trending-topics`),
    ]);
    setPosts(postResponse.data || []);
    setConnections(connectionsResponse.data || []);
    setTrendingTopics(trendingResponse.data || []);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};


  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const currentUserId = localStorage.getItem("userId") || userId;
        if (currentUserId) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/user/${currentUserId}`
          );
          setUserProfile(response.data);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, [userId]);

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
              {/* <CreatePostCard userId={userId} /> */}
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