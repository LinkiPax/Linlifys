import React, { useState, useEffect } from "react";
import { Container, Row, Col , Spinner} from "react-bootstrap";
import { useParams } from "react-router-dom";
import axios from "axios";
import NavbarComponent from "../navbar/Navbar";
import Postcard from "../Cards/Postcard";
import EventsCard from "../Cards/EventsCard";
import AdvertisementCard from "../Cards/AdvertisementCard";
import CreatePostCard from "../Cards/CreatePostCard";
import SuggestedConnectionsCard from "../Cards/SuggestedConnectionsCard";
import TrendingTopicsCard from "../Cards/TrendingCard";
import MyNetwork from '../MyNetwork/Mynewwork';
import Status from "../Status/Status";
import "./HomePage.css";

const HomePage = () => {
  const { userId } = useParams(); // Extract userId from URL
  const [posts, setPosts] = useState([]);
  const [connections, setConnections] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postResponse, connectionsResponse, trendingResponse] =
          await Promise.all([
            axios.get(`http://localhost:5000/api/posts`),
            axios.get(`/api/user/suggestions/suggestions?userId=${userId}`),
            axios.get(`http://localhost:5000/api/trending-topics`),
          ]);
        setPosts(postResponse.data || []);
        setConnections(connectionsResponse.data || []);
        setTrendingTopics(trendingResponse.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const storedUserId = localStorage.getItem("userId");
        if (storedUserId) {
          const response = await axios.get(`http://localhost:5000/user/${storedUserId}`);
          setUserProfile(response.data);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

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
      <NavbarComponent />
      <Container fluid className={`mt-3 px-3 main-content`}>
        <Row>
          {/* Left Column */}
          <Col md={3} className="px-2">
            <div className="sticky-column">
              <div className="suggested-connections-card">
                <SuggestedConnectionsCard connections={connections} />
              </div>
              <div className="trending-topics-card">
                <TrendingTopicsCard topics={trendingTopics} />
              </div>
            </div>
          </Col>

          {/* Middle Column */}
          <Col md={6} className="px-2">
            <Status userProfilePic={userProfile?.profilePicture} />
            <CreatePostCard userId={userId} />
            <div className="scrollable-postcards">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Postcard key={post._id} post={post} />
                ))
              ) : (
                <div className="text-center text-muted mt-4">No posts to display.</div>
              )}
            </div>
          </Col>

          {/* Right Column */}
          <Col md={3} className="px-2">
            <div className="sticky-column">
              <EventsCard />
              <AdvertisementCard />
              <MyNetwork userId={userId} />
            </div>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default HomePage;