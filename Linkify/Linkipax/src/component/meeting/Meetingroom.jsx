import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Form,
  Container,
  Alert,
  Modal,
  Spinner,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import Peer from "peerjs";
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
  FiX,
} from "react-icons/fi";
import { BsEmojiSmile, BsRecordCircle } from "react-icons/bs";
import { FaChalkboardTeacher } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { v4 as uuidv4 } from "uuid";
import "./Meetingroom.css";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MeetingApp Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with the video call.</h2>
          <p>
            {this.state.error?.message || "Unknown error occurred"}
          </p>
          <div className="error-actions">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Refresh Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="btn btn-secondary"
            >
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === "development" && (
            <details className="error-details">
              <summary>Error Details</summary>
              <pre>
                {this.state.error?.stack}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

const MeetingApp = () => {
  // State management
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
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [mediaAccessGranted, setMediaAccessGranted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  // Refs
  const localStream = useRef(null);
  const screenStream = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const peersRef = useRef([]);
  const chatContainerRef = useRef(null);
  const meetingIdRef = useRef(null);
  const userVideoRefs = useRef({});
  const userId = useRef(uuidv4());

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const PEER_CONFIG = {
    host: import.meta.env.VITE_PEER_HOST || "0.peerjs.com",
    port: import.meta.env.VITE_PEER_PORT ? parseInt(import.meta.env.VITE_PEER_PORT) : 443,
    path: "/",
    secure: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
        // Add your TURN server credentials here if needed
      ],
    },
  };

  // Initialize PeerJS connection
  const initializePeer = () => {
    peerRef.current = new Peer(userId.current, PEER_CONFIG);

    peerRef.current.on("open", (id) => {
      console.log("PeerJS connected with ID:", id);
    });

    peerRef.current.on("error", (err) => {
      console.error("PeerJS error:", err);
      setError("Peer connection error. Please refresh the page.");
    });

    peerRef.current.on("call", (call) => {
      if (!localStream.current) {
        console.error("No local stream to answer call");
        call.close();
        return;
      }

      call.answer(localStream.current);
      
      call.on("stream", (remoteStream) => {
        console.log("Received stream from:", call.peer);
        if (userVideoRefs.current[call.peer]) {
          userVideoRefs.current[call.peer].srcObject = remoteStream;
        }
        
        setParticipants(prev => 
          prev.map(p => p.id === call.peer ? {...p, connected: true} : p)
        );
      });

      call.on("close", () => {
        console.log("Call closed with:", call.peer);
        removePeer(call.peer);
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
        removePeer(call.peer);
      });

      peersRef.current.push({ call, userId: call.peer });
    });
  };

  // Initialize Socket.io connection
  const initializeSocket = async () => {
    console.log("Initializing socket connection...");
    try {
      socketRef.current = io(API_URL, {
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      return new Promise((resolve) => {
        socketRef.current.on("connect", () => {
          setConnectionStatus("connected");
          console.log("Socket connected with ID:", socketRef.current.id);
          resolve(true);
        });

        socketRef.current.on("connect_error", (err) => {
          setConnectionStatus("disconnected");
          console.error("Socket connection error:", err);
          setError("Failed to connect to server. Please try again.");
          resolve(false);
        });

        socketRef.current.on("disconnect", () => {
          setConnectionStatus("disconnected");
          console.log("Socket disconnected");
          setError("Disconnected from server. Attempting to reconnect...");
        });
      });
    } catch (err) {
      console.error("Socket initialization error:", err);
      return false;
    }
  };

  // Setup socket event listeners
  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleUserJoined = (user) => {
      console.log("User joined:", user);
      if (user.id !== userId.current) {
        setParticipants((prev) => [
          ...prev.filter((p) => p.id !== user.id),
          {
            id: user.id,
            username: user.username || "Unknown",
            isMicOn: user.isMicOn ?? false,
            isVideoOn: user.isVideoOn ?? false,
            isScreenSharing: false,
            connected: false,
          },
        ]);

        if (peerRef.current && localStream.current) {
          callUser(user.id);
        }
      }
    };

    const handleUserLeft = (user) => {
      console.log("User left:", user);
      setParticipants((prev) => prev.filter((p) => p.id !== user.id));
      removePeer(user.id);
    };

    const handleReceiveMessage = ({ username, message }) => {
      console.log("Received message:", { username, message });
      addMessage(message, username);
    };

    const handleExistingUsers = (users) => {
      console.log("Existing users:", users);
      const validUsers = users
        .filter((user) => user.id && user.id !== userId.current)
        .map((user) => ({
          id: user.id,
          username: user.username || "Unknown",
          isMicOn: user.isMicOn ?? false,
          isVideoOn: user.isVideoOn ?? false,
          isScreenSharing: false,
          connected: false,
        }));

      setParticipants(validUsers);

      if (peerRef.current && localStream.current) {
        validUsers.forEach((user) => {
          callUser(user.id);
        });
      }
    };

    const handleUserStatusUpdate = ({ userId, isMicOn, isVideoOn }) => {
      console.log("User status update:", { userId, isMicOn, isVideoOn });
      setParticipants((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, isMicOn, isVideoOn } : p))
      );
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("existing-users", handleExistingUsers);
    socket.on("user-status-update", handleUserStatusUpdate);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("existing-users", handleExistingUsers);
      socket.off("user-status-update", handleUserStatusUpdate);
    };
  };

  // Call a user
  const callUser = (userId) => {
    if (!peerRef.current || peerRef.current.disconnected) {
      console.error("PeerJS connection not ready");
      return;
    }

    if (!localStream.current) {
      console.error("No local stream to send");
      return;
    }

    const call = peerRef.current.call(userId, localStream.current);
    
    call.on("stream", (remoteStream) => {
      console.log("Received stream from:", userId);
      if (userVideoRefs.current[userId]) {
        userVideoRefs.current[userId].srcObject = remoteStream;
      }
      
      setParticipants(prev => 
        prev.map(p => p.id === userId ? {...p, connected: true} : p)
      );
    });

    call.on("close", () => {
      console.log("Call closed with:", userId);
      removePeer(userId);
    });

    call.on("error", (err) => {
      console.error("Call error:", err);
      removePeer(userId);
    });

    peersRef.current.push({ call, userId });
  };

  // Remove a peer connection
  const removePeer = (userId) => {
    console.log("Removing peer:", userId);
    const peerIndex = peersRef.current.findIndex((p) => p.userId === userId);
    if (peerIndex !== -1) {
      try {
        peersRef.current[peerIndex].call.close();
      } catch (err) {
        console.error("Error closing call:", err);
      }
      peersRef.current.splice(peerIndex, 1);
    }

    if (userVideoRefs.current[userId]) {
      userVideoRefs.current[userId].srcObject = null;
      delete userVideoRefs.current[userId];
    }

    setParticipants((prev) => prev.filter((p) => p.id !== userId));
  };

  // Get media constraints based on settings
  const getMediaConstraints = () => {
    const baseConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    };

    if (isVideoOn) {
      const resolutions = {
        "1080p": { width: { ideal: 1920 }, height: { ideal: 1080 } },
        "720p": { width: { ideal: 1280 }, height: { ideal: 720 } },
        "480p": { width: { ideal: 640 }, height: { ideal: 480 } },
      };

      baseConstraints.video = {
        ...resolutions[videoQuality],
        frameRate: { ideal: 30 },
      };
    }

    return baseConstraints;
  };

  // Start media stream
  const startMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        getMediaConstraints()
      );
      
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaAccessGranted(true);
      return true;
    } catch (err) {
      console.error("Media access error:", err);
      
      // Try audio-only fallback
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        
        localStream.current = audioStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = audioStream;
        }
        setMediaAccessGranted(true);
        setIsVideoOn(false);
        return true;
      } catch (audioErr) {
        console.error("Audio-only fallback failed:", audioErr);
        setError("Could not access microphone. Please check permissions.");
        setMediaAccessGranted(false);
        return false;
      }
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (!localStream.current) {
      setError("No media stream available to toggle microphone.");
      return;
    }
    
    const audioTracks = localStream.current.getAudioTracks();
    if (!audioTracks.length) {
      setError("No audio tracks available.");
      return;
    }
    
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    
    setIsMicOn(!isMicOn);
    
    if (socketRef.current?.connected) {
      socketRef.current.emit("user-status-update", {
        roomId: meetingId,
        userId: userId.current,
        isMicOn: !isMicOn,
        isVideoOn,
      });
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (!localStream.current) {
      setError("No media stream available to toggle video.");
      return;
    }
    
    const videoTracks = localStream.current.getVideoTracks();
    if (videoTracks.length) {
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    } else if (!isVideoOn) {
      // Video was off and we want to turn it on
      startMedia().then((success) => {
        if (success) {
          setIsVideoOn(true);
          updateAllPeerStreams();
        }
      });
      return;
    } else {
      setError("No video tracks available.");
      return;
    }
    
    if (socketRef.current?.connected) {
      socketRef.current.emit("user-status-update", {
        roomId: meetingId,
        userId: userId.current,
        isMicOn,
        isVideoOn: !isVideoOn,
      });
    }
  };

  // Update all peer streams when local stream changes
  const updateAllPeerStreams = () => {
    if (!localStream.current) return;
    
    peersRef.current.forEach(({ call }) => {
      const videoTrack = localStream.current.getVideoTracks()[0];
      const audioTrack = localStream.current.getAudioTracks()[0];
      
      if (videoTrack) {
        const videoSender = call.peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
          
        if (videoSender) {
          videoSender.replaceTrack(videoTrack).catch(console.error);
        }
      }
      
      if (audioTrack) {
        const audioSender = call.peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "audio");
          
        if (audioSender) {
          audioSender.replaceTrack(audioTrack).catch(console.error);
        }
      }
    });
  };

  // Share screen
  const shareScreen = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStream.current) {
          screenStream.current.getTracks().forEach((track) => track.stop());
          screenStream.current = null;
        }
        
        if (localStream.current) {
          localVideoRef.current.srcObject = localStream.current;
        }
        
        setIsScreenSharing(false);
        updateAllPeerStreams();
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        screenStream.current = stream;
        localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        
        // Replace video track in all peer connections
        const videoTrack = stream.getVideoTracks()[0];
        peersRef.current.forEach(({ call }) => {
          const sender = call.peerConnection
            .getSenders()
            .find((s) => s.track?.kind === "video");
            
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack).catch(console.error);
          }
        });
        
        // Handle when user stops screen sharing
        videoTrack.onended = () => {
          if (localStream.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream.current;
          }
          setIsScreenSharing(false);
          updateAllPeerStreams();
        };
      }
    } catch (err) {
      console.error("Screen share error:", err);
      setError("Failed to share screen. Please try again.");
    }
  };

  // Add a message to chat
  const addMessage = (message, username) => {
    const sanitizedMessage = message.slice(0, 500);
    setMessages((prev) => [
      ...prev,
      {
        username,
        message: sanitizedMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
  };

  // Send a message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    if (!socketRef.current?.connected) {
      setError("Cannot send message: Server disconnected.");
      return;
    }

    addMessage(newMessage, "You");
    socketRef.current.emit("send-message", {
      roomId: meetingId,
      username,
      message: newMessage,
    });
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  // Add emoji to message
  const addEmoji = (emojiData) => {
    setNewMessage((prev) =>
      prev.length < 500 ? prev + emojiData.emoji : prev
    );
  };

  // Create a new meeting room
  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/room/create`);
      if (!response.data?.room?.roomId) {
        throw new Error("Invalid room creation response");
      }
      setMeetingId(response.data.room.roomId);
      setRoomCreated(true);
      setError("");
    } catch (err) {
      console.error("Error creating room:", err);
      setError(
        err.response?.status === 429
          ? "Too many requests. Please try again later."
          : "Failed to create room. Please check your network."
      );
    } finally {
      setLoading(false);
    }
  };

  // Join a meeting
  const handleJoinMeeting = async () => {
    if (!meetingId.trim() || !username.trim()) {
      setError("Meeting ID and username are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Initialize connections
      const [socketConnected] = await Promise.all([
        initializeSocket(),
        initializePeer(),
      ]);

      if (!socketConnected) {
        throw new Error("Failed to connect to server");
      }

      setupSocketListeners();

      // Get media access
      const mediaSuccess = await startMedia();
      if (!mediaSuccess) {
        addMessage(
          "Joining without camera/microphone due to permission issues",
          "system"
        );
      }

      // Join the room
      const response = await axios.post(`${API_URL}/api/room/join`, {
        meetingId,
        username,
        userId: userId.current,
        isMicOn: mediaSuccess ? isMicOn : false,
        isVideoOn: mediaSuccess ? isVideoOn : false,
      });

      if (response.data.success) {
        socketRef.current.emit("join-meeting", {
          meetingId,
          username,
          userId: userId.current,
          isMicOn: mediaSuccess ? isMicOn : false,
          isVideoOn: mediaSuccess ? isVideoOn : false,
        });

        setJoined(true);
        addMessage("You joined the meeting", "system");
      } else {
        throw new Error(response.data.message || "Failed to join the meeting");
      }
    } catch (err) {
      console.error("Error joining meeting:", err);
      setError(
        err.message || "Failed to join the meeting. Please check your network."
      );
      cleanupMediaStreams();
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.disconnect();
    } finally {
      setLoading(false);
    }
  };

  // Leave meeting
  const handleLeaveMeeting = async () => {
    try {
      await axios.post(`${API_URL}/api/room/leave`, {
        roomId: meetingId,
        userId: userId.current,
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit("leave-meeting", {
          meetingId,
          userId: userId.current,
        });
      }

      cleanupMediaStreams();
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.disconnect();

      setJoined(false);
      setParticipants([]);
      setMessages([]);
      setMediaAccessGranted(false);
      setIsScreenSharing(false);
      setMeetingId("");
    } catch (err) {
      console.error("Error leaving meeting:", err);
      setError(
        "Failed to leave meeting on server. You are disconnected locally."
      );
    }
  };

  // Clean up media streams
  const cleanupMediaStreams = () => {
    console.log("Cleaning up media streams");
    [localStream, screenStream].forEach((streamRef) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            if (track.readyState === "live") track.stop();
          } catch (err) {
            console.error("Error stopping track:", err);
          }
        });
        streamRef.current = null;
      }
    });

    peersRef.current.forEach(({ call }) => {
      try {
        call.close();
      } catch (err) {
        console.error("Error closing call:", err);
      }
    });
    peersRef.current = [];
    userVideoRefs.current = {};
  };

  // Copy meeting ID to clipboard
  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId).then(() => {
        addMessage("Meeting ID copied to clipboard", "system");
      });
    }
  };

  // Set user video ref
  const setUserVideoRef = (userId, ref) => {
    if (ref) {
      userVideoRefs.current[userId] = ref;
    } else if (userVideoRefs.current[userId]) {
      userVideoRefs.current[userId].srcObject = null;
      delete userVideoRefs.current[userId];
    }
  };

  // Effect for scrolling chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Effect for cleaning up on unmount
  useEffect(() => {
    return () => {
      cleanupMediaStreams();
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Render the component
  return (
    <Container fluid className="meeting-container">
      {!joined ? (
        <div className="join-screen">
          <div className="join-card">
            <h1 className="text-center mb-4">
              <span className="logo-primary">Meeting</span>
              <span className="logo-secondary">Room</span>
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
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Copy to clipboard</Tooltip>}
                  >
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={copyMeetingId}
                      className="copy-btn"
                    >
                      <FiCopy />
                    </Button>
                  </OverlayTrigger>
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
                  required
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
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={!isVideoOn ? "video-off" : ""}
              ></video>
              {(!isVideoOn || !mediaAccessGranted) && (
                <div className="video-placeholder">
                  <div className="user-avatar">
                    {username.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
              <div className="user-info">
                <span>{username} (You)</span>
                {!isMicOn && <FiMicOff className="mic-status" />}
                {isScreenSharing && (
                  <FaChalkboardTeacher className="screen-share-icon" />
                )}
                {!mediaAccessGranted && (
                  <span className="media-warning">No media access</span>
                )}
              </div>
            </div>

            <div className="participants-grid">
              {participants.map((participant) => (
                <div
                  key={`participant-${participant.id}`}
                  className={`participant-video ${
                    participant.id === activeSpeaker ? "active-speaker" : ""
                  }`}
                >
                  <video
                    ref={(ref) => setUserVideoRef(participant.id, ref)}
                    autoPlay
                    playsInline
                    className="remote-video"
                  />
                  {!participant.isVideoOn && (
                    <div className="video-placeholder">
                      <div className="user-avatar">
                        {participant.username.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  )}
                  <div className="user-info">
                    <span>{participant.username}</span>
                    <div className="participant-status">
                      {participant.isMicOn ? (
                        <FiMic size={12} />
                      ) : (
                        <FiMicOff size={12} />
                      )}
                      {participant.isVideoOn ? (
                        <FiVideo size={12} />
                      ) : (
                        <FiVideoOff size={12} />
                      )}
                      {participant.isScreenSharing && (
                        <FaChalkboardTeacher size={12} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {showChat && (
            <div className="chat-container">
              <div className="chat-header">
                <h3>
                  <FiMessageSquare /> Chat
                </h3>
                <Button
                  variant="link"
                  onClick={() => setShowChat(false)}
                  className="close-btn"
                >
                  <FiX />
                </Button>
              </div>
              <div className="chat-messages" ref={chatContainerRef}>
                {messages.map((msg, index) => (
                  <div
                    key={`message-${index}`}
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
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Add emoji</Tooltip>}
                >
                  <Button
                    variant="link"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="emoji-btn"
                  >
                    <BsEmojiSmile />
                  </Button>
                </OverlayTrigger>
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

          {showParticipants && (
            <div className="participants-sidebar">
              <div className="sidebar-header">
                <h3>
                  <FiUsers /> Participants ({participants.length + 1})
                </h3>
                <Button
                  variant="link"
                  onClick={() => setShowParticipants(false)}
                  className="close-btn"
                >
                  <FiX />
                </Button>
              </div>
              <div className="participants-list">
                <div className="participant-item you">
                  <div className="participant-avatar">
                    {username.charAt(0).toUpperCase()}
                  </div>
                  <div className="participant-info">
                    <span>{username} (You)</span>
                    <div className="participant-status">
                      {isMicOn ? <FiMic size={12} /> : <FiMicOff size={12} />}
                      {isVideoOn ? (
                        <FiVideo size={12} />
                      ) : (
                        <FiVideoOff size={12} />
                      )}
                      {isScreenSharing && <FaChalkboardTeacher size={12} />}
                    </div>
                  </div>
                </div>
                {participants.map((participant) => (
                  <div
                    key={`participant-${participant.id}`}
                    className="participant-item"
                  >
                    <div className="participant-avatar">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-info">
                      <span>{participant.username}</span>
                      <div className="participant-status">
                        {participant.isMicOn ? (
                          <FiMic size={12} />
                        ) : (
                          <FiMicOff size={12} />
                        )}
                        {participant.isVideoOn ? (
                          <FiVideo size={12} />
                        ) : (
                          <FiVideoOff size={12} />
                        )}
                        {participant.isScreenSharing && (
                          <FaChalkboardTeacher size={12} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="controls-container">
            <div className="control-buttons">
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>{isMicOn ? "Mute" : "Unmute"}</Tooltip>}
              >
                <Button
                  variant={isMicOn ? "secondary" : "danger"}
                  onClick={toggleMic}
                  disabled={!mediaAccessGranted}
                >
                  {isMicOn ? <FiMic /> : <FiMicOff />}
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>{isVideoOn ? "Stop video" : "Start video"}</Tooltip>
                }
              >
                <Button
                  variant={isVideoOn ? "secondary" : "danger"}
                  onClick={toggleVideo}
                  disabled={!mediaAccessGranted}
                >
                  {isVideoOn ? <FiVideo /> : <FiVideoOff />}
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    {isScreenSharing ? "Stop sharing" : "Share screen"}
                  </Tooltip>
                }
              >
                <Button
                  variant={isScreenSharing ? "danger" : "secondary"}
                  onClick={shareScreen}
                >
                  <FiShare2 /> {isScreenSharing ? "Stop" : "Share"}
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

            <div>
              <Button variant="danger" onClick={handleLeaveMeeting}>
                <FiLogOut /> Leave
              </Button>
            </div>

            <div className="flex space-x-2">
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
                  <FiUsers />
                </Button>
              </OverlayTrigger>

              <OverlayTrigger
                placement="top"
                overlay={<Tooltip>Toggle chat</Tooltip>}
              >
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

      <Modal show={showSettings} onHide={() => setShowSettings(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Settings</Modal.Title>
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
                type="checkbox"
                label="Enable Noise Suppression"
                defaultChecked
                disabled={!mediaAccessGranted}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Echo Cancellation"
                defaultChecked
                disabled={!mediaAccessGranted}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettings(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => setShowSettings(false)}>
            Save Settings
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default function MeetingRoom() {
  return (
    <ErrorBoundary>
      <MeetingApp />
    </ErrorBoundary>
  );
}