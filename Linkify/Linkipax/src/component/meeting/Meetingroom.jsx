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
  const [recorder, setRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [iceConnectionState, setIceConnectionState] = useState("new");

  // Refs
  const localStream = useRef(null);
  const screenStream = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const peersRef = useRef({});
  const chatContainerRef = useRef(null);
  const meetingIdRef = useRef(null);
  const userVideoRefs = useRef({});
  const userId = useRef(uuidv4());
  const peerConnectionStats = useRef({});

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

  // Initialize PeerJS connection with improved error handling
  const initializePeer = () => {
    try {
      peerRef.current = new Peer(userId.current, PEER_CONFIG);

      peerRef.current.on("open", (id) => {
        console.log("PeerJS connected with ID:", id);
        setConnectionStatus("connected");
      });

      peerRef.current.on("error", (err) => {
        console.error("PeerJS error:", err);
        setError(`Peer connection error: ${err.message}. Please refresh the page.`);
        setConnectionStatus("failed");
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!peerRef.current || peerRef.current.disconnected) {
            console.log("Attempting to reconnect PeerJS...");
            initializePeer();
          }
        }, 3000);
      });

      peerRef.current.on("disconnected", () => {
        console.log("PeerJS disconnected");
        setConnectionStatus("disconnected");
        peerRef.current.reconnect();
      });

      peerRef.current.on("call", (call) => {
        console.log("Incoming call from:", call.peer);
        
        if (!localStream.current) {
          console.error("No local stream to answer call");
          call.close();
          return;
        }

        call.answer(localStream.current);
        
        // Set up ICE candidate exchange
        call.on("icecandidate", (candidate) => {
          if (candidate.candidate && socketRef.current?.connected) {
            socketRef.current.emit("ice-candidate", {
              roomId: meetingId,
              targetUserId: call.peer,
              candidate: candidate.candidate
            });
          }
        });

        call.on("stream", (remoteStream) => {
          console.log("Received stream from:", call.peer);
          handleRemoteStream(call.peer, remoteStream);
        });

        call.on("close", () => {
          console.log("Call closed with:", call.peer);
          removePeer(call.peer);
        });

        call.on("error", (err) => {
          console.error("Call error:", err);
          removePeer(call.peer);
        });

        // Track connection state changes
        call.peerConnection.oniceconnectionstatechange = () => {
          const state = call.peerConnection.iceConnectionState;
          setIceConnectionState(state);
          console.log(`ICE connection state changed to: ${state} for peer ${call.peer}`);
          
          if (state === "failed") {
            console.log("Attempting to restart ICE...");
            call.peerConnection.restartIce();
          }
        };

        peersRef.current[call.peer] = { call, userId: call.peer };
      });

      // Setup ICE candidate handling
      setupIceCandidateHandling();

    } catch (err) {
      console.error("Failed to initialize PeerJS:", err);
      setError("Failed to initialize peer connection. Please refresh the page.");
    }
  };

  // Handle remote streams more robustly
  const handleRemoteStream = (userId, remoteStream) => {
    if (!userVideoRefs.current[userId]) {
      const videoElement = document.createElement('video');
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.className = "remote-video";
      userVideoRefs.current[userId] = videoElement;
    }
    
    userVideoRefs.current[userId].srcObject = remoteStream;
    
    setParticipants(prev => 
      prev.map(p => 
        p.id === userId 
          ? { ...p, connected: true, stream: remoteStream } 
          : p
      )
    );
  };

  // Setup ICE candidate exchange
  const setupIceCandidateHandling = () => {
    if (!socketRef.current) return;

    socketRef.current.on("ice-candidate", ({ senderUserId, candidate }) => {
      if (senderUserId !== userId.current) {
        const peer = peersRef.current[senderUserId];
        if (peer) {
          try {
            peer.call.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
              .catch(err => console.error("Error adding ICE candidate:", err));
          } catch (err) {
            console.error("Failed to process ICE candidate:", err);
          }
        }
      }
    });
  };

  // Initialize Socket.io connection with better reconnection logic
  const initializeSocket = async () => {
    console.log("Initializing socket connection...");
    try {
      socketRef.current = io(API_URL, {
        transports: ["websocket"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5,
      });

      return new Promise((resolve) => {
        socketRef.current.on("connect", () => {
          setConnectionStatus("connected");
          console.log("Socket connected with ID:", socketRef.current.id);
          
          // Setup ICE candidate handling after connection
          setupIceCandidateHandling();
          
          resolve(true);
        });

        socketRef.current.on("connect_error", (err) => {
          setConnectionStatus("disconnected");
          console.error("Socket connection error:", err);
          setError("Failed to connect to server. Please check your network.");
          resolve(false);
        });

        socketRef.current.on("disconnect", (reason) => {
          setConnectionStatus("disconnected");
          console.log("Socket disconnected:", reason);
          if (reason === "io server disconnect") {
            // The server forcibly disconnected the socket, try to reconnect
            socketRef.current.connect();
          }
          setError("Disconnected from server. Attempting to reconnect...");
        });

        socketRef.current.on("reconnect", (attempt) => {
          setConnectionStatus("connected");
          console.log(`Reconnected after ${attempt} attempts`);
          setError("");
        });

        socketRef.current.on("reconnect_failed", () => {
          setConnectionStatus("failed");
          console.error("Failed to reconnect socket");
          setError("Failed to reconnect to server. Please refresh the page.");
        });
      });
    } catch (err) {
      console.error("Socket initialization error:", err);
      return false;
    }
  };

  // Setup socket event listeners with improved error handling
  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleUserJoined = (user) => {
      console.log("User joined:", user);
      if (user.id !== userId.current) {
        setParticipants(prev => [
          ...prev.filter(p => p.id !== user.id),
          {
            id: user.id,
            username: user.username || "Unknown",
            isMicOn: user.isMicOn ?? false,
            isVideoOn: user.isVideoOn ?? false,
            isScreenSharing: false,
            connected: false,
          }
        ]);

        if (peerRef.current && localStream.current) {
          // Add slight delay to ensure everything is ready
          setTimeout(() => callUser(user.id), 500);
        }
      }
    };

    const handleUserLeft = (user) => {
      console.log("User left:", user);
      setParticipants(prev => prev.filter(p => p.id !== user.id));
      removePeer(user.id);
    };

    const handleReceiveMessage = ({ username, message }) => {
      console.log("Received message:", { username, message });
      addMessage(message, username);
    };

    const handleExistingUsers = (users) => {
      console.log("Existing users:", users);
      const validUsers = users
        .filter(user => user.id && user.id !== userId.current)
        .map(user => ({
          id: user.id,
          username: user.username || "Unknown",
          isMicOn: user.isMicOn ?? false,
          isVideoOn: user.isVideoOn ?? false,
          isScreenSharing: false,
          connected: false,
        }));

      setParticipants(validUsers);

      if (peerRef.current && localStream.current) {
        // Call each existing user with staggered delays to avoid congestion
        validUsers.forEach((user, index) => {
          setTimeout(() => callUser(user.id), index * 300);
        });
      }
    };

    const handleUserStatusUpdate = ({ userId, isMicOn, isVideoOn }) => {
      console.log("User status update:", { userId, isMicOn, isVideoOn });
      setParticipants(prev =>
        prev.map(p => (p.id === userId ? { ...p, isMicOn, isVideoOn } : p))
      );
    };

    const handleConnectionQuality = ({ userId, quality }) => {
      console.log(`Connection quality for ${userId}:`, quality);
      // You could use this to show connection quality indicators
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("existing-users", handleExistingUsers);
    socket.on("user-status-update", handleUserStatusUpdate);
    socket.on("connection-quality", handleConnectionQuality);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("existing-users", handleExistingUsers);
      socket.off("user-status-update", handleUserStatusUpdate);
      socket.off("connection-quality", handleConnectionQuality);
    };
  };

  // Improved callUser function with better error handling
  const callUser = (targetUserId) => {
    if (!peerRef.current || peerRef.current.disconnected) {
      console.error("PeerJS connection not ready");
      return;
    }

    if (!localStream.current) {
      console.error("No local stream to send");
      return;
    }

    console.log(`Calling user ${targetUserId}...`);
    
    try {
      const call = peerRef.current.call(targetUserId, localStream.current);
      
      // Set up ICE candidate exchange
      call.on("icecandidate", (candidate) => {
        if (candidate.candidate && socketRef.current?.connected) {
          socketRef.current.emit("ice-candidate", {
            roomId: meetingId,
            targetUserId,
            candidate: candidate.candidate
          });
        }
      });

      call.on("stream", (remoteStream) => {
        console.log("Received stream from:", targetUserId);
        handleRemoteStream(targetUserId, remoteStream);
      });

      call.on("close", () => {
        console.log("Call closed with:", targetUserId);
        removePeer(targetUserId);
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
        removePeer(targetUserId);
      });

      // Track connection state changes
      call.peerConnection.oniceconnectionstatechange = () => {
        const state = call.peerConnection.iceConnectionState;
        setIceConnectionState(state);
        console.log(`ICE connection state changed to: ${state} for peer ${targetUserId}`);
        
        if (state === "failed") {
          console.log("Attempting to restart ICE...");
          call.peerConnection.restartIce();
        }
      };

      peersRef.current[targetUserId] = { call, userId: targetUserId };

    } catch (err) {
      console.error("Failed to call user:", err);
      setError(`Failed to connect to ${targetUserId}. Trying again...`);
      
      // Retry after a delay
      setTimeout(() => callUser(targetUserId), 2000);
    }
  };

  // Improved removePeer function
  const removePeer = (userId) => {
    console.log("Removing peer:", userId);
    
    if (peersRef.current[userId]) {
      try {
        peersRef.current[userId].call.close();
      } catch (err) {
        console.error("Error closing call:", err);
      }
      delete peersRef.current[userId];
    }

    if (userVideoRefs.current[userId]) {
      userVideoRefs.current[userId].srcObject = null;
      delete userVideoRefs.current[userId];
    }

    setParticipants(prev => prev.filter(p => p.id !== userId));
  };

  // Get media constraints with improved quality settings
  const getMediaConstraints = () => {
    const baseConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
      video: false,
    };

    if (isVideoOn) {
      const resolutions = {
        "480p": { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15 } },
        "720p": { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24 } },
        "1080p": { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
      };

      baseConstraints.video = {
        ...resolutions[videoQuality],
        facingMode: "user",
      };
    }

    return baseConstraints;
  };

  // Improved media stream handling
  const startMedia = async () => {
    try {
      // First stop any existing streams
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }

      const constraints = getMediaConstraints();
      console.log("Requesting media with constraints:", constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Monitor stream health
      monitorStreamHealth(stream);
      
      setMediaAccessGranted(true);
      return true;
    } catch (err) {
      console.error("Media access error:", err);
      
      // Try audio-only fallback if video failed
      if (isVideoOn) {
        console.log("Attempting audio-only fallback...");
        setIsVideoOn(false);
        return startMedia();
      }
      
      setError(`Could not access ${isVideoOn ? 'camera/microphone' : 'microphone'}. Please check permissions.`);
      setMediaAccessGranted(false);
      return false;
    }
  };

  // Monitor stream health
  const monitorStreamHealth = (stream) => {
    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();
    
    if (audioTracks.length > 0) {
      audioTracks[0].addEventListener("mute", () => {
        console.log("Audio track muted unexpectedly");
        setError("Microphone stopped working. Please check your microphone.");
      });
      
      audioTracks[0].addEventListener("unmute", () => {
        console.log("Audio track unmuted");
        setError("");
      });
    }
    
    if (videoTracks.length > 0) {
      videoTracks[0].addEventListener("mute", () => {
        console.log("Video track muted unexpectedly");
        setError("Camera stopped working. Please check your camera.");
      });
      
      videoTracks[0].addEventListener("unmute", () => {
        console.log("Video track unmuted");
        setError("");
      });
    }
  };

  // Toggle microphone with improved feedback
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
    
    const newMicState = !isMicOn;
    audioTracks.forEach(track => {
      track.enabled = newMicState;
    });
    
    setIsMicOn(newMicState);
    
    if (socketRef.current?.connected) {
      socketRef.current.emit("user-status-update", {
        roomId: meetingId,
        userId: userId.current,
        isMicOn: newMicState,
        isVideoOn,
      });
    }
    
    addMessage(`You ${newMicState ? "unmuted" : "muted"} your microphone`, "system");
  };

  // Toggle video with improved feedback
  const toggleVideo = () => {
    if (!localStream.current) {
      setError("No media stream available to toggle video.");
      return;
    }
    
    const videoTracks = localStream.current.getVideoTracks();
    if (videoTracks.length) {
      const newVideoState = !isVideoOn;
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
      });
      setIsVideoOn(newVideoState);
      
      if (socketRef.current?.connected) {
        socketRef.current.emit("user-status-update", {
          roomId: meetingId,
          userId: userId.current,
          isMicOn,
          isVideoOn: newVideoState,
        });
      }
      
      addMessage(`You turned ${newVideoState ? "on" : "off"} your camera`, "system");
    } else if (!isVideoOn) {
      // Video was off and we want to turn it on
      startMedia().then((success) => {
        if (success) {
          setIsVideoOn(true);
          updateAllPeerStreams();
          addMessage("You turned on your camera", "system");
        }
      });
    } else {
      setError("No video tracks available.");
    }
  };

  // Update all peer streams with better error handling
  const updateAllPeerStreams = () => {
    if (!localStream.current) return;
    
    Object.values(peersRef.current).forEach(({ call }) => {
      try {
        const videoTrack = localStream.current.getVideoTracks()[0];
        const audioTrack = localStream.current.getAudioTracks()[0];
        
        if (videoTrack) {
          const videoSender = call.peerConnection
            .getSenders()
            .find(s => s.track?.kind === "video");
            
          if (videoSender) {
            videoSender.replaceTrack(videoTrack)
              .catch(err => console.error("Error replacing video track:", err));
          }
        }
        
        if (audioTrack) {
          const audioSender = call.peerConnection
            .getSenders()
            .find(s => s.track?.kind === "audio");
            
          if (audioSender) {
            audioSender.replaceTrack(audioTrack)
              .catch(err => console.error("Error replacing audio track:", err));
          }
        }
      } catch (err) {
        console.error("Error updating peer stream:", err);
      }
    });
  };

  // Share screen with improved error handling
  const shareScreen = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStream.current) {
          screenStream.current.getTracks().forEach(track => track.stop());
          screenStream.current = null;
        }
        
        if (localStream.current) {
          localVideoRef.current.srcObject = localStream.current;
        }
        
        setIsScreenSharing(false);
        updateAllPeerStreams();
        addMessage("You stopped screen sharing", "system");
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            logicalSurface: true,
            cursor: "always"
          },
          audio: true,
        });
        
        // Handle when user stops screen sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          if (localStream.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream.current;
          }
          setIsScreenSharing(false);
          updateAllPeerStreams();
          addMessage("You stopped screen sharing", "system");
        };
        
        screenStream.current = stream;
        localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        
        // Replace video track in all peer connections
        const videoTrack = stream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(({ call }) => {
          const sender = call.peerConnection
            .getSenders()
            .find(s => s.track?.kind === "video");
            
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack)
              .catch(err => console.error("Error replacing screen share track:", err));
          }
        });
        
        addMessage("You started screen sharing", "system");
      }
    } catch (err) {
      console.error("Screen share error:", err);
      if (err.name !== "NotAllowedError") {
        setError("Failed to share screen. Please try again.");
      }
    }
  };

  // Start recording with improved error handling
  const startRecording = async () => {
    try {
      if (!localStream.current) {
        setError("No media stream available to record.");
        return;
      }

      const stream = isScreenSharing && screenStream.current 
        ? screenStream.current 
        : localStream.current;
      
      const options = { 
        mimeType: 'video/webm;codecs=vp9',
        bitsPerSecond: 2500000 // 2.5 Mbps
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `meeting-recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
      };

      mediaRecorder.onerror = (event) => {
        console.error("Recording error:", event.error);
        setError("Recording error occurred. Please try again.");
        setIsRecording(false);
        setRecorder(null);
      };

      mediaRecorder.start(1000); // Collect data every second
      setRecorder(mediaRecorder);
      setIsRecording(true);
      addMessage("Recording started", "system");
    } catch (err) {
      console.error("Recording error:", err);
      setError("Failed to start recording. Please check permissions.");
    }
  };

  // Stop recording with improved cleanup
  const stopRecording = () => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `meeting-recording-${new Date().toISOString()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        setIsRecording(false);
        setRecorder(null);
        addMessage("Recording stopped and saved", "system");
      };
      
      recorder.stop();
    }
  };

  // Add a message to chat with sanitization
  const addMessage = (message, username) => {
    const sanitizedMessage = message
      .slice(0, 500)
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    setMessages(prev => [
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

  // Send a message with validation
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

  // Add emoji to message with validation
  const addEmoji = (emojiData) => {
    setNewMessage(prev =>
      prev.length < 500 ? prev + emojiData.emoji : prev
    );
  };

  // Create a new meeting room with better error handling
  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/room/create`, {
        userId: userId.current,
        username,
      });
      
      if (!response.data?.room?.roomId) {
        throw new Error("Invalid room creation response");
      }
      
      setMeetingId(response.data.room.roomId);
      setRoomCreated(true);
      setError("");
      
      // Automatically join the created room
      await handleJoinMeeting();
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

  // Join a meeting with improved connection handling
  const handleJoinMeeting = async () => {
    if (!meetingId.trim() || !username.trim()) {
      setError("Meeting ID and username are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Initialize connections in parallel
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
        socketId: socketRef.current.id,
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
        
        // Get existing users if any
        if (response.data.room?.users?.length > 0) {
          // Call each existing user with staggered delays
          response.data.room.users.forEach((user, index) => {
            if (user.userId && user.userId !== userId.current) {
              setTimeout(() => callUser(user.userId), index * 300);
            }
          });
        }
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

  // Leave meeting with proper cleanup
  const handleLeaveMeeting = async () => {
    try {
      // Stop recording if active
      if (isRecording) {
        stopRecording();
      }

      // Notify server we're leaving
      await axios.post(`${API_URL}/api/room/leave`, {
        roomId: meetingId,
        userId: userId.current,
      }).catch(err => console.error("Error notifying server:", err));

      if (socketRef.current?.connected) {
        socketRef.current.emit("leave-meeting", {
          meetingId,
          userId: userId.current,
        });
      }

      // Clean up all resources
      cleanupMediaStreams();
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.disconnect();

      // Reset state
      setJoined(false);
      setParticipants([]);
      setMessages([]);
      setMediaAccessGranted(false);
      setIsScreenSharing(false);
      setMeetingId("");
      setRoomCreated(false);
      setConnectionStatus("disconnected");
    } catch (err) {
      console.error("Error leaving meeting:", err);
      setError(
        "Failed to leave meeting on server. You are disconnected locally."
      );
    }
  };

  // Clean up media streams with better resource management
  const cleanupMediaStreams = () => {
    console.log("Cleaning up media streams");
    
    // Clean up local streams
    [localStream, screenStream].forEach(streamRef => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            if (track.readyState === "live") track.stop();
          } catch (err) {
            console.error("Error stopping track:", err);
          }
        });
        streamRef.current = null;
      }
    });

    // Clean up peer connections
    Object.values(peersRef.current).forEach(({ call }) => {
      try {
        call.close();
      } catch (err) {
        console.error("Error closing call:", err);
      }
    });
    peersRef.current = {};
    
    // Clean up video elements
    Object.keys(userVideoRefs.current).forEach(userId => {
      if (userVideoRefs.current[userId]) {
        userVideoRefs.current[userId].srcObject = null;
      }
    });
    userVideoRefs.current = {};
  };

  // Copy meeting ID to clipboard with feedback
  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId)
        .then(() => {
          addMessage("Meeting ID copied to clipboard", "system");
        })
        .catch(err => {
          console.error("Failed to copy meeting ID:", err);
          setError("Failed to copy meeting ID. Please try again.");
        });
    }
  };

  // Set user video ref with null checks
  const setUserVideoRef = (userId, ref) => {
    if (ref) {
      userVideoRefs.current[userId] = ref;
    } else if (userVideoRefs.current[userId]) {
      userVideoRefs.current[userId].srcObject = null;
      delete userVideoRefs.current[userId];
    }
  };

  // Effect for scrolling chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
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

  // Connection status indicator component
  const ConnectionStatusIndicator = () => {
    let statusClass = "";
    let statusText = "";
    
    switch (connectionStatus) {
      case "connected":
        statusClass = "text-success";
        statusText = "Connected";
        break;
      case "connecting":
        statusClass = "text-warning";
        statusText = "Connecting...";
        break;
      case "disconnected":
        statusClass = "text-danger";
        statusText = "Disconnected";
        break;
      default:
        statusClass = "text-secondary";
        statusText = "Unknown";
    }
    
    return (
      <div className={`connection-status ${statusClass}`}>
        <span className="status-dot"></span>
        {statusText}
      </div>
    );
  };

  // Render the component with improved layout
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
                  <>
                    <Spinner animation="border" size="sm" /> Creating...
                  </>
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
                  <>
                    <Spinner animation="border" size="sm" /> Joining...
                  </>
                ) : (
                  "Join Meeting"
                )}
              </Button>
            </Form>
          </div>
        </div>
      ) : (
        <div className="meeting-room">
          <div className="connection-status-bar">
            <ConnectionStatusIndicator />
            {iceConnectionState !== "connected" && (
              <span className="ice-status">
                ICE: {iceConnectionState}
              </span>
            )}
          </div>
          
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
                <div className="user-status">
                  {!isMicOn && <FiMicOff className="mic-status" />}
                  {isScreenSharing && (
                    <FaChalkboardTeacher className="screen-share-icon" />
                  )}
                  {!mediaAccessGranted && (
                    <span className="media-warning">No media access</span>
                  )}
                </div>
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
                    ref={(ref) => {
                      if (ref && participant.stream) {
                        ref.srcObject = participant.stream;
                      }
                      setUserVideoRef(participant.id, ref);
                    }}
                    autoPlay
                    playsInline
                    className="remote-video"
                  />
                  {(!participant.stream || !participant.isVideoOn) && (
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
                  className="control-btn"
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
                  className="control-btn"
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
                  className="control-btn"
                >
                  <FiShare2 /> {isScreenSharing ? "Stop" : "Share"}
                </Button>
              </OverlayTrigger>

              {isRecording ? (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Stop recording</Tooltip>}
                >
                  <Button 
                    variant="danger" 
                    onClick={stopRecording}
                    className="control-btn"
                  >
                    <BsRecordCircle /> Recording
                  </Button>
                </OverlayTrigger>
              ) : (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Start recording</Tooltip>}
                >
                  <Button 
                    variant="secondary" 
                    onClick={startRecording}
                    className="control-btn"
                  >
                    <BsRecordCircle /> Record
                  </Button>
                </OverlayTrigger>
              )}
            </div>

            <div>
              <Button 
                variant="danger" 
                onClick={handleLeaveMeeting}
                className="leave-btn"
              >
                <FiLogOut /> Leave
              </Button>
            </div>

            <div className="utility-buttons">
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>Participants ({participants.length + 1})</Tooltip>
                }
              >
                <Button
                  variant={showParticipants ? "primary" : "secondary"}
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="utility-btn"
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
                  className="utility-btn"
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
                  className="utility-btn"
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
                onChange={(e) => {
                  setVideoQuality(e.target.value);
                  if (isVideoOn) {
                    startMedia().then(() => updateAllPeerStreams());
                  }
                }}
              >
                <option value="480p">480p (SD) - Lower bandwidth</option>
                <option value="720p">720p (HD) - Balanced</option>
                <option value="1080p">1080p (Full HD) - Best quality</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Noise Suppression"
                defaultChecked
                disabled={!mediaAccessGranted}
                onChange={(e) => {
                  if (localStream.current) {
                    const audioTracks = localStream.current.getAudioTracks();
                    audioTracks.forEach(track => {
                      track.applyConstraints({
                        noiseSuppression: e.target.checked
                      });
                    });
                  }
                }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Echo Cancellation"
                defaultChecked
                disabled={!mediaAccessGranted}
                onChange={(e) => {
                  if (localStream.current) {
                    const audioTracks = localStream.current.getAudioTracks();
                    audioTracks.forEach(track => {
                      track.applyConstraints({
                        echoCancellation: e.target.checked
                      });
                    });
                  }
                }}
              />
            </Form.Group>
            <div className="connection-info">
              <h5>Connection Information</h5>
              <p>Status: <span className={connectionStatus === "connected" ? "text-success" : "text-warning"}>{connectionStatus}</span></p>
              <p>ICE State: {iceConnectionState}</p>
              <p>Peer ID: {userId.current}</p>
            </div>
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