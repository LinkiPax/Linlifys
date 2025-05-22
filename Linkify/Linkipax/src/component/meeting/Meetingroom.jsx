// import React, { useState, useRef, useEffect } from 'react';
// import { Button, Form, Container, Row, Col, Alert } from 'react-bootstrap';
// import axios from 'axios';
// import io from 'socket.io-client';
// import './Meetingroom.css';

// const socket = io('http://localhost:5000'); // Replace with your backend URL
// const userId = localStorage.getItem('userId');
// const MeetingApp = () => {
//   const [meetingId, setMeetingId] = useState('');
//   const [username, setUsername] = useState('');
//   const [joined, setJoined] = useState(false);
//   const [error, setError] = useState('');
//   const [participants, setParticipants] = useState([]);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const localStream = useRef(null);
//   const remoteStreams = useRef({});

//   useEffect(() => {
//     socket.on('user-joined', ({ id, username }) => {
//       setParticipants((prev) => [...prev, { id, username }]);
//     });

//     socket.on('user-left', ({ id }) => {
//       setParticipants((prev) => prev.filter((p) => p.id !== id));
//     });

//     socket.on('receive-message', ({ username, message }) => {
//       setMessages((prev) => [...prev, { username, message }]);
//     });

//     return () => {
//       socket.off('user-joined');
//       socket.off('user-left');
//       socket.off('receive-message');
//     };
//   }, []);

//   const startVideo = async () => {
//     try {
//       localStream.current = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//     } catch (err) {
//       console.error('Error accessing media devices:', err);
//     }
//   };

//   const handleCreateRoom = async () => {
//     try {
//       const response = await axios.post('http://localhost:5000/room/create');
//       if (response.data && response.data.roomId) {
//         setMeetingId(response.data.roomId);
//         setError('');
//       } else {
//         setError('Failed to create room.');
//       }
//     } catch (err) {
//       setError('Failed to create room.');
//     }
//   };

//   const handleJoinMeeting = async () => {
//     if (!meetingId.trim() || !username.trim()) {
//       setError('Meeting ID and username are required');
//       return;
//     }
//     try {
//       const response = await axios.post('http://localhost:5000/room/join', { meetingId, username,userId });
//       if (response.data.success) {
//         socket.emit('join-meeting', { meetingId, username, userId });
//         setJoined(true);
//         startVideo();
//       } else {
//         setError('Failed to join the meeting.');
//       }
//     } catch (err) {
//       setError('Failed to join the meeting.');
//     }
//   };

//   const handleLeaveMeeting = () => {
//     socket.emit('leave-meeting', { meetingId });
//     setJoined(false);
//     setParticipants([]);
//   };

//   const handleSendMessage = () => {
//     if (newMessage.trim()) {
//       socket.emit('send-message', { meetingId, username, message: newMessage });
//       setNewMessage('');
//     }
//   };

//   return (
//     <Container className="mt-5 cont">
//       <Row>
//         <Col>
//           <h2 className="text-center text-primary logo">Linkipax Meeting</h2>
//           {error && <Alert variant="danger">{error}</Alert>}

//           {!joined ? (
//             <>
//               <Button variant="success" onClick={handleCreateRoom} className="me-3">
//                 Create Room
//               </Button>

//               {meetingId && (
//                 <Alert variant="info" className="mt-3">
//                   Room created! Share this Meeting ID: <strong>{meetingId}</strong>
//                 </Alert>
//               )}

//               <Form className="form">
//                 <Form.Group className="mb-3">
//                   <Form.Label>Meeting ID</Form.Label>
//                   <Form.Control
//                     type="text"
//                     placeholder="Enter Meeting ID"
//                     value={meetingId}
//                     onChange={(e) => setMeetingId(e.target.value)}
//                   />
//                 </Form.Group>

//                 <Form.Group className="mb-3">
//                   <Form.Label>Username</Form.Label>
//                   <Form.Control
//                     type="text"
//                     placeholder="Enter your name"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                   />
//                 </Form.Group>

//                 <Button variant="primary" onClick={handleJoinMeeting}>
//                   Join Meeting
//                 </Button>
//               </Form>
//             </>
//           ) : (
//             <>
//               <div className="mb-4">
//                 <h5>Participants:</h5>
//                 <ul className="list-group">
//                   {participants.map((participant) => (
//                     <li key={participant.id} className="list-group-item">
//                       {participant.username}
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               <div className="mt-4">
//                 <video ref={localStream} autoPlay muted className="w-100 mb-3"></video>
//                 <div className="remote-videos">
//                   {Object.values(remoteStreams.current).map((stream, index) => (
//                     <video key={index} srcObject={stream} autoPlay className="w-100 mb-3"></video>
//                   ))}
//                 </div>
//               </div>

//               <div className="chat mt-4">
//                 <h5>Chat</h5>
//                 <div className="chat-messages chat" >
//                   {messages.map((msg, index) => (
//                     <p key={index}>
//                       <strong>{msg.username}: </strong>
//                      <h7>{msg.message}</h7>
//                     </p>
//                   ))}
//                 </div>
//                 <Form.Control
//                   type="text"
//                   placeholder="Type your message"
//                   value={newMessage}
//                   onChange={(e) => setNewMessage(e.target.value)}
//                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
//                 />
//               </div>

//               <Button variant="danger" onClick={handleLeaveMeeting} className="mt-3">
//                 Leave Meeting
//               </Button>
//             </>
//           )}
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default MeetingApp; 
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Form,
  Container,
  Row,
  Col,
  Alert,
  Modal,
  Badge,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import axios from "axios";
import io from "socket.io-client";
import {
  FiMic,
  FiMicOff,
  FiVideo,
  FiVideoOff,
  FiShare2,
  FiCopy,
  FiMessageSquare,
  FiUsers,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";
import { BsEmojiSmile, BsRecordCircle } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";
import "./Meetingroom.css";

const socket = io("http://localhost:5000", { transports: ["websocket"] });
const userId = localStorage.getItem("userId");

const MeetingApp = () => {
  const [meetingId, setMeetingId] = useState("");
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [videoQuality, setVideoQuality] = useState("720p");
  const [showParticipants, setShowParticipants] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);

  const localStream = useRef(null);
  const remoteStreams = useRef({});
  const videoRef = useRef(null);
  const chatContainerRef = useRef(null);
  const meetingIdRef = useRef(null);

  useEffect(() => {
    socket.on("user-joined", ({ id, username }) => {
      setParticipants((prev) => [...prev, { id, username }]);
      addMessage(`${username} joined the meeting`, "system");
    });

    socket.on("user-left", ({ id, username }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      addMessage(`${username} left the meeting`, "system");
    });

    socket.on("receive-message", ({ username, message }) => {
      addMessage(message, username);
    });

    socket.on("ice-candidate", ({ candidate, senderId }) => {
      // Handle ICE candidate for WebRTC
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("receive-message");
      socket.off("ice-candidate");
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (message, username) => {
    setMessages((prev) => [
      ...prev,
      { username, message, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const startVideo = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      };

      localStream.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      if (videoRef.current) {
        videoRef.current.srcObject = localStream.current;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError("Could not access camera/microphone. Please check permissions.");
    }
  };

  const toggleMic = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(!isMicOn);
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      localStream.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    // Implement recording logic here
    addMessage("Meeting recording started", "system");
  };

  const stopRecording = () => {
    setIsRecording(false);
    // Implement recording stop logic here
    addMessage("Meeting recording stopped", "system");
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/room/create");
      if (response.data?.roomId) {
        setMeetingId(response.data.roomId);
        setRoomCreated(true);
        setError("");
      } else {
        setError("Failed to create room. Please try again.");
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingId);
    addMessage("Meeting ID copied to clipboard", "system");
  };

  const handleJoinMeeting = async () => {
    if (!meetingId.trim() || !username.trim()) {
      setError("Meeting ID and username are required");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/room/join", {
        meetingId,
        username,
        userId,
      });

      if (response.data.success) {
        socket.emit("join-meeting", { meetingId, username, userId });
        setJoined(true);
        await startVideo();
        addMessage("You joined the meeting", "system");
      } else {
        setError(response.data.message || "Failed to join the meeting.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join the meeting.");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveMeeting = () => {
    socket.emit("leave-meeting", { meetingId, username });
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
    }
    setJoined(false);
    setParticipants([]);
    setMessages([]);
    addMessage("You left the meeting", "system");
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("send-message", { meetingId, username, message: newMessage });
      addMessage(newMessage, "You");
      setNewMessage("");
      setShowEmojiPicker(false);
    }
  };

  const addEmoji = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  const shareScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      // Handle screen sharing stream
    } catch (err) {
      console.error("Error sharing screen:", err);
      setError("Could not share screen. Please try again.");
    }
  };

  return (
    <Container fluid className="meeting-container">
      {!joined ? (
        <div className="join-screen">
          <div className="join-card">
            <h1 className="text-center mb-4">
              <span className="logo-primary">Link</span>
              <span className="logo-secondary">ipax</span>
              <span className="logo-tagline">Premium Video Meetings</span>
            </h1>

            {error && (
              <Alert variant="danger" className="text-center">
                {error}
              </Alert>
            )}

            <div className="action-buttons mb-4">
              <Button
                variant="primary"
                onClick={handleCreateRoom}
                disabled={loading}
                className="action-btn"
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "New Meeting"
                )}
              </Button>
              <div className="divider">or</div>
              <Form.Control
                type="text"
                placeholder="Enter Meeting ID"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value)}
                className="meeting-id-input"
              />
            </div>

            {roomCreated && (
              <div className="meeting-id-container">
                <p className="text-muted">Your Meeting ID:</p>
                <div className="meeting-id-display">
                  <span ref={meetingIdRef}>{meetingId}</span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={copyMeetingId}
                    className="copy-btn"
                  >
                    <FiCopy /> Copy
                  </Button>
                </div>
                <p className="text-muted small mt-2">
                  Share this ID with participants to join the meeting
                </p>
              </div>
            )}

            <Form className="join-form">
              <Form.Group className="mb-3">
                <Form.Label>Your Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Form.Group>

              <Button
                variant="success"
                onClick={handleJoinMeeting}
                disabled={!meetingId || !username || loading}
                className="join-btn"
              >
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  "Join Meeting"
                )}
              </Button>
            </Form>
          </div>
        </div>
      ) : (
        <div className="meeting-room">
          <div className={`video-container ${!showChat ? "full-width" : ""}`}>
            <div className="main-video">
              <video
                ref={videoRef}
                autoPlay
                muted
                className={!isVideoOn ? "video-off" : ""}
              ></video>
              {!isVideoOn && (
                <div className="video-placeholder">
                  <div className="user-avatar">
                    {username.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="user-info">
                <span>{username}</span>
                {!isMicOn && <FiMicOff className="mic-status" />}
              </div>
            </div>

            <div className="participants-grid">
              {participants.map((participant) => (
                <div key={participant.id} className="participant-video">
                  <div className="video-placeholder">
                    <div className="user-avatar">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="user-info">
                    <span>{participant.username}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showChat && (
            <div className="chat-container">
              <div className="chat-header">
                <h5>
                  <FiMessageSquare /> Chat
                </h5>
                <Button
                  variant="link"
                  onClick={() => setShowChat(false)}
                  className="close-chat"
                >
                  &times;
                </Button>
              </div>
              <div className="chat-messages" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${
                      msg.username === "You"
                        ? "sent"
                        : msg.username === "system"
                        ? "system"
                        : "received"
                    }`}
                  >
                    {msg.username !== "system" && msg.username !== "You" && (
                      <span className="message-sender">{msg.username}</span>
                    )}
                    <div className="message-content">
                      {msg.message}
                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <Button
                  variant="link"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="emoji-btn"
                >
                  <BsEmojiSmile />
                </Button>
                {showEmojiPicker && (
                  <div className="emoji-picker">
                    <EmojiPicker
                      onEmojiClick={addEmoji}
                      width={300}
                      height={350}
                    />
                  </div>
                )}
                <Form.Control
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </div>
          )}

          <div className="meeting-controls">
            <div className="controls-left">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{isMicOn ? "Mute" : "Unmute"}</Tooltip>}
              >
                <Button
                  variant={isMicOn ? "secondary" : "danger"}
                  onClick={toggleMic}
                >
                  {isMicOn ? <FiMic /> : <FiMicOff />}
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    {isVideoOn ? "Turn off camera" : "Turn on camera"}
                  </Tooltip>
                }
              >
                <Button
                  variant={isVideoOn ? "secondary" : "danger"}
                  onClick={toggleVideo}
                >
                  {isVideoOn ? <FiVideo /> : <FiVideoOff />}
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Share screen</Tooltip>}
              >
                <Button variant="secondary" onClick={shareScreen}>
                  <FiShare2 />
                </Button>
              </OverlayTrigger>

              {isRecording ? (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Stop recording</Tooltip>}
                >
                  <Button variant="danger" onClick={stopRecording}>
                    <BsRecordCircle /> Recording
                  </Button>
                </OverlayTrigger>
              ) : (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Start recording</Tooltip>}
                >
                  <Button variant="secondary" onClick={startRecording}>
                    <BsRecordCircle /> Record
                  </Button>
                </OverlayTrigger>
              )}
            </div>

            <div className="controls-center">
              <Button variant="danger" onClick={handleLeaveMeeting}>
                <FiLogOut /> Leave
              </Button>
            </div>

            <div className="controls-right">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>Participants ({participants.length + 1})</Tooltip>
                }
              >
                <Button
                  variant={showParticipants ? "primary" : "secondary"}
                  onClick={() => setShowParticipants(!showParticipants)}
                >
                  <FiUsers />{" "}
                  <Badge bg="light" text="dark">
                    {participants.length + 1}
                  </Badge>
                </Button>
              </OverlayTrigger>

              <OverlayTrigger placement="top" overlay={<Tooltip>Chat</Tooltip>}>
                <Button
                  variant={showChat ? "primary" : "secondary"}
                  onClick={() => setShowChat(!showChat)}
                >
                  <FiMessageSquare />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Settings</Tooltip>}
              >
                <Button
                  variant="secondary"
                  onClick={() => setShowSettings(true)}
                >
                  <FiSettings />
                </Button>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Modal show={showSettings} onHide={() => setShowSettings(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Meeting Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Video Quality</Form.Label>
              <Form.Select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
              >
                <option value="480p">480p (SD)</option>
                <option value="720p">720p (HD)</option>
                <option value="1080p">1080p (Full HD)</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                label="Enable Noise Suppression"
                defaultChecked
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                label="Enable Echo Cancellation"
                defaultChecked
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettings(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowSettings(false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MeetingApp;