import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  Form,
  Container,
  Alert,
  Modal,
  Spinner,
} from "react-bootstrap";
import Peer from "peerjs";
import axios from "axios";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import "./Meetingroom.css";

// Import custom sub-components
import ErrorBoundary from "./components/ErrorBoundary";
import JoinScreen from "./components/JoinScreen";
import VideoGrid from "./components/VideoGrid";
import ChatSidebar from "./components/ChatSidebar";
import ParticipantsSidebar from "./components/ParticipantsSidebar";
import MeetingControls from "./components/MeetingControls";

const MeetingApp = () => {
  const getInitialUsername = () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.name) return parsed.name;
        if (parsed.username) return parsed.username;
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
    }
    return localStorage.getItem("userName") || "";
  };

  // State management
  const [meetingId, setMeetingId] = useState("");
  const [username, setUsername] = useState(getInitialUsername());
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
  const userVideoRefs = useRef({});
  const userId = useRef(localStorage.getItem("userId") || uuidv4());

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
  const PEER_CONFIG = {
    host: import.meta.env.VITE_PEER_HOST || "0.peerjs.com",
    port: import.meta.env.VITE_PEER_PORT ? parseInt(import.meta.env.VITE_PEER_PORT) : 443,
    path: "/",
    secure: true,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    },
    iceTransportPolicy: "all",
  };

  // Debug function for media streams
  const debugMediaStreams = () => {
    console.log("=== MEDIA STREAMS DEBUG ===");
    console.log("Local Stream:", localStream.current ? {
      videoTracks: localStream.current.getVideoTracks().length,
      audioTracks: localStream.current.getAudioTracks().length,
      videoEnabled: localStream.current.getVideoTracks()[0]?.enabled,
      audioEnabled: localStream.current.getAudioTracks()[0]?.enabled
    } : "No local stream");
    
    console.log("Screen Stream:", screenStream.current ? {
      videoTracks: screenStream.current.getVideoTracks().length,
      audioTracks: screenStream.current.getAudioTracks().length
    } : "No screen stream");
    
    console.log("Participants:", participants.map(p => ({
      username: p.username,
      hasStream: !!p.stream,
      videoTracks: p.stream ? p.stream.getVideoTracks().length : 0,
      audioTracks: p.stream ? p.stream.getAudioTracks().length : 0,
      isVideoOn: p.isVideoOn
    })));
    
    console.log("Active Peers:", Object.keys(peersRef.current));
    console.log("===========================");
  };

  // Initialize PeerJS connection with improved error handling
  const initializePeer = () => {
    try {
      peerRef.current = new Peer(userId.current, PEER_CONFIG);

      peerRef.current.on("open", (id) => {
        console.log("PeerJS connected with ID:", id);
        setConnectionStatus("connected");
        
        // After peer is open, call existing users if any
        if (joined && participants.length > 0) {
          participants.forEach(user => {
            if (user.id !== userId.current && !peersRef.current[user.id]) {
              setTimeout(() => callUser(user.id), 500);
            }
          });
        }
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
        
        // Get the current active stream to answer with
        const streamToAnswer = isScreenSharing && screenStream.current 
          ? screenStream.current 
          : localStream.current;

        if (!streamToAnswer) {
          console.error("No local stream to answer call");
          call.close();
          return;
        }

        call.answer(streamToAnswer);

        call.on("stream", (remoteStream) => {
          console.log("✅ Received remote stream:", {
            from: call.peer,
            videoTracks: remoteStream.getVideoTracks().length,
            audioTracks: remoteStream.getAudioTracks().length
          });

          // Create a new stream to avoid reference issues
          const processedStream = new MediaStream();
          
          remoteStream.getVideoTracks().forEach(track => {
            processedStream.addTrack(track);
          });
          
          remoteStream.getAudioTracks().forEach(track => {
            processedStream.addTrack(track);
          });

          handleRemoteStream(call.peer, processedStream);
        });

        call.on("close", () => {
          console.log("Call closed with:", call.peer);
          removePeer(call.peer);
        });

        call.on("error", (err) => {
          console.error("Call error:", err);
          removePeer(call.peer);
        });

        if (call.peerConnection) {
          call.peerConnection.oniceconnectionstatechange = () => {
            const state = call.peerConnection.iceConnectionState;
            setIceConnectionState(state);
            console.log(`ICE connection state changed to: ${state} for peer ${call.peer}`);
            
            if (state === "failed") {
              console.log("Attempting to restart ICE...");
              call.peerConnection.restartIce();
            }
          };
        }

        peersRef.current[call.peer] = { call, userId: call.peer };
      });
    } catch (err) {
      console.error("Failed to initialize PeerJS:", err);
      setError("Failed to initialize peer connection. Please refresh the page.");
    }
  };

  // Handle remote streams more robustly
  const handleRemoteStream = (userId, remoteStream) => {
    console.log("🔄 Handling remote stream for user:", userId, {
      videoTracks: remoteStream.getVideoTracks().length,
      audioTracks: remoteStream.getAudioTracks().length
    });
    
    setParticipants(prev => {
      const existingParticipant = prev.find(p => p.id === userId);
      
      const currentStream = existingParticipant?.stream;
      const streamsEqual = currentStream && remoteStream && 
        currentStream.id === remoteStream.id &&
        currentStream.getVideoTracks()[0]?.id === remoteStream.getVideoTracks()[0]?.id;
      
      if (streamsEqual) {
        console.log("🔄 Stream unchanged, skipping update for:", userId);
        return prev;
      }
      
      if (existingParticipant) {
        return prev.map(p => 
          p.id === userId 
            ? { ...p, connected: true, stream: remoteStream } 
            : p
        );
      } else {
        console.warn("Received stream for unknown user:", userId);
        return prev;
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
          console.log("✅ Socket connected with ID:", socketRef.current.id);
          resolve(true);
        });

        socketRef.current.on("connect_error", (err) => {
          setConnectionStatus("disconnected");
          console.error("❌ Socket connection error:", err);
          setError("Failed to connect to server. Please check your network.");
          resolve(false);
        });

        socketRef.current.on("disconnect", (reason) => {
          setConnectionStatus("disconnected");
          console.log("🔌 Socket disconnected:", reason);
          if (reason === "io server disconnect") {
            socketRef.current.connect();
          }
          setError("Disconnected from server. Attempting to reconnect...");
        });

        socketRef.current.on("reconnect", (attempt) => {
          setConnectionStatus("connected");
          console.log(`✅ Reconnected after ${attempt} attempts`);
          setError("");
        });

        socketRef.current.on("reconnect_failed", () => {
          setConnectionStatus("failed");
          console.error("❌ Failed to reconnect socket");
          setError("Failed to reconnect to server. Please refresh the page.");
        });
      });
    } catch (err) {
      console.error("❌ Socket initialization error:", err);
      return false;
    }
  };

  // Setup socket event listeners with improved error handling
  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleUserJoined = (user) => {
      console.log("👤 User joined:", user);
      if (user.id !== userId.current) {
        setParticipants(prev => [
          ...prev.filter(p => p.id !== user.id),
          {
            id: user.id,
            username: user.username || "Unknown",
            isMicOn: user.isMicOn ?? false,
            isVideoOn: user.isVideoOn ?? false,
            isScreenSharing: user.isScreenSharing ?? false,
            connected: false,
            stream: null,
          }
        ]);

        if (peerRef.current && localStream.current) {
          setTimeout(() => callUser(user.id), 500);
        }
      }
    };

    const handleUserLeft = (user) => {
      console.log("👋 User left:", user);
      setParticipants(prev => prev.filter(p => p.id !== user.id));
      removePeer(user.id);
    };

    const handleReceiveMessage = ({ username, message }) => {
      console.log("📨 Received message:", { username, message });
      addMessage(message, username);
    };

    const handleExistingUsers = (users) => {
      console.log("👥 Existing users:", users);
      const validUsers = users
        .filter(user => user.id && user.id !== userId.current)
        .map(user => ({
          id: user.id,
          username: user.username || "Unknown",
          isMicOn: user.isMicOn ?? false,
          isVideoOn: user.isVideoOn ?? false,
          isScreenSharing: user.isScreenSharing ?? false,
          connected: false,
          stream: null,
        }));

      setParticipants(validUsers);

      if (peerRef.current && localStream.current) {
        validUsers.forEach((user, index) => {
          setTimeout(() => callUser(user.id), index * 300);
        });
      }
    };

    const handleUserStatusUpdate = ({ userId, isMicOn, isVideoOn }) => {
      console.log("🔄 User status update:", { userId, isMicOn, isVideoOn });
      setParticipants(prev =>
        prev.map(p => (p.id === userId ? { ...p, isMicOn, isVideoOn } : p))
      );
    };

    const handleScreenShareStarted = ({ userId }) => {
      console.log("🖥️ Screen share started by user:", userId);
      setParticipants(prev =>
        prev.map(p => (p.id === userId ? { ...p, isScreenSharing: true } : p))
      );
    };

    const handleScreenShareStopped = ({ userId }) => {
      console.log("🖥️ Screen share stopped by user:", userId);
      setParticipants(prev =>
        prev.map(p => (p.id === userId ? { ...p, isScreenSharing: false } : p))
      );
    };

    const handleConnectionQuality = ({ userId, quality }) => {
      console.log(`📊 Connection quality for ${userId}:`, quality);
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("existing-users", handleExistingUsers);
    socket.on("user-status-update", handleUserStatusUpdate);
    socket.on("screen-share-started", handleScreenShareStarted);
    socket.on("screen-share-stopped", handleScreenShareStopped);
    socket.on("connection-quality", handleConnectionQuality);

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("existing-users", handleExistingUsers);
      socket.off("user-status-update", handleUserStatusUpdate);
      socket.off("screen-share-started", handleScreenShareStarted);
      socket.off("screen-share-stopped", handleScreenShareStopped);
      socket.off("connection-quality", handleConnectionQuality);
    };
  };

  // Call user
  const callUser = (targetUserId) => {
    if (!peerRef.current || peerRef.current.disconnected) {
      console.error("❌ PeerJS connection not ready");
      return;
    }

    const streamToSend = isScreenSharing && screenStream.current 
      ? screenStream.current 
      : localStream.current;

    if (!streamToSend) {
      console.error("❌ No local stream to send");
      return;
    }

    console.log(`📞 Calling user ${targetUserId}`);

    try {
      const call = peerRef.current.call(targetUserId, streamToSend, {
        metadata: {
          hasVideo: streamToSend.getVideoTracks().length > 0,
          hasAudio: streamToSend.getAudioTracks().length > 0,
          userId: userId.current
        }
      });
      
      call.on("stream", (remoteStream) => {
        handleRemoteStream(targetUserId, remoteStream);
      });

      call.on("close", () => {
        removePeer(targetUserId);
      });

      call.on("error", (err) => {
        setError(`Call failed with ${targetUserId}: ${err.message}`);
        removePeer(targetUserId);
      });

      if (call.peerConnection) {
        call.peerConnection.oniceconnectionstatechange = () => {
          const state = call.peerConnection.iceConnectionState;
          setIceConnectionState(state);
        };
      }

      peersRef.current[targetUserId] = { call, userId: targetUserId };
    } catch (err) {
      setError(`Failed to connect to ${targetUserId}: ${err.message}`);
    }
  };

  // Remove peer
  const removePeer = (userId) => {
    console.log("🗑️ Removing peer:", userId);
    
    if (peersRef.current[userId]) {
      try {
        peersRef.current[userId].call.close();
      } catch (err) {
        console.error("❌ Error closing call:", err);
      }
      delete peersRef.current[userId];
    }

    if (userVideoRefs.current[userId]) {
      userVideoRefs.current[userId].srcObject = null;
      delete userVideoRefs.current[userId];
    }

    setParticipants(prev => prev.filter(p => p.id !== userId));
  };

  // Start media
  const startMedia = async () => {
    try {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 },
          facingMode: "user",
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(err => 
          console.error("❌ Local video play error:", err)
        );
      }
      
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = isVideoOn;
      }
      
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = isMicOn;
      }
      
      monitorStreamHealth(stream);
      setMediaAccessGranted(true);
      return true;
    } catch (err) {
      console.error("❌ Media access error:", err);
      if (isVideoOn) {
        setIsVideoOn(false);
        return startMedia();
      }
      setError(`Could not access microphone. Please check permissions.`);
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
        setError("Microphone stopped working. Please check your microphone.");
      });
      audioTracks[0].addEventListener("unmute", () => {
        setError("");
      });
    }
    
    if (videoTracks.length > 0) {
      videoTracks[0].addEventListener("mute", () => {
        setError("Camera stopped working. Please check your camera.");
      });
      videoTracks[0].addEventListener("unmute", () => {
        setError("");
      });
    }
  };

  // Toggle microphone
  const toggleMic = () => {
    if (!localStream.current) return;
    const audioTracks = localStream.current.getAudioTracks();
    if (!audioTracks.length) return;
    
    const newMicState = !isMicOn;
    audioTracks.forEach(track => { track.enabled = newMicState; });
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

  // Toggle video
  const toggleVideo = () => {
    if (!localStream.current) return;
    const videoTracks = localStream.current.getVideoTracks();
    
    if (videoTracks.length) {
      const newVideoState = !isVideoOn;
      videoTracks.forEach(track => { track.enabled = newVideoState; });
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
      startMedia().then((success) => {
        if (success) {
          setIsVideoOn(true);
          updateAllPeerStreams();
          addMessage("You turned on your camera", "system");
        }
      });
    }
  };

  // Update peer streams
  const updateAllPeerStreams = () => {
    if (!localStream.current) return;
    
    const streamToSend = isScreenSharing && screenStream.current 
      ? screenStream.current 
      : localStream.current;

    Object.values(peersRef.current).forEach(({ call }) => {
      try {
        const videoTrack = streamToSend.getVideoTracks()[0];
        const audioTrack = streamToSend.getAudioTracks()[0];
        
        if (videoTrack) {
          const videoSender = call.peerConnection
            ?.getSenders()
            ?.find(s => s.track?.kind === "video");
          if (videoSender) videoSender.replaceTrack(videoTrack);
        }
        
        if (audioTrack) {
          const audioSender = call.peerConnection
            ?.getSenders()
            ?.find(s => s.track?.kind === "audio");
          if (audioSender) audioSender.replaceTrack(audioTrack);
        }
      } catch (err) {
        console.error(`❌ Error updating streams for ${call.peer}:`, err);
      }
    });
  };

  // Share screen
  const shareScreen = async () => {
    try {
      if (isScreenSharing) {
        if (screenStream.current) {
          screenStream.current.getTracks().forEach(track => track.stop());
          screenStream.current = null;
        }
        if (localStream.current) {
          localVideoRef.current.srcObject = localStream.current;
        }
        setIsScreenSharing(false);
        updateAllPeerStreams();
        if (socketRef.current?.connected) {
          socketRef.current.emit("stop-screen-share", {
            roomId: meetingId,
            userId: userId.current,
          });
        }
        addMessage("You stopped screen sharing", "system");
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            logicalSurface: true,
            cursor: "always",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 15 }
          },
          audio: true,
        });
        
        stream.getVideoTracks()[0].onended = () => {
          if (localStream.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream.current;
          }
          setIsScreenSharing(false);
          updateAllPeerStreams();
          if (socketRef.current?.connected) {
            socketRef.current.emit("stop-screen-share", {
              roomId: meetingId,
              userId: userId.current,
            });
          }
          addMessage("You stopped screen sharing", "system");
        };
        
        screenStream.current = stream;
        localVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        if (socketRef.current?.connected) {
          socketRef.current.emit("start-screen-share", {
            roomId: meetingId,
            userId: userId.current,
          });
        }
        
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0] || localStream.current?.getAudioTracks()[0];
        
        Object.values(peersRef.current).forEach(({ call }) => {
          const videoSender = call.peerConnection?.getSenders()?.find(s => s.track?.kind === "video");
          const audioSender = call.peerConnection?.getSenders()?.find(s => s.track?.kind === "audio");
          
          if (videoSender && videoTrack) videoSender.replaceTrack(videoTrack);
          if (audioSender && audioTrack) audioSender.replaceTrack(audioTrack);
        });
        addMessage("You started screen sharing", "system");
      }
    } catch (err) {
      console.error("❌ Screen share error:", err);
      if (err.name !== "NotAllowedError") {
        setError("Failed to share screen. Please try again.");
      }
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      if (!localStream.current) return;
      const stream = isScreenSharing && screenStream.current ? screenStream.current : localStream.current;
      const options = { mimeType: 'video/webm;codecs=vp9', bitsPerSecond: 2500000 };
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

      mediaRecorder.start(1000);
      setRecorder(mediaRecorder);
      setIsRecording(true);
      addMessage("Recording started", "system");
    } catch (err) {
      setError("Failed to start recording. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      setIsRecording(false);
      setRecorder(null);
      addMessage("Recording stopped and saved", "system");
    }
  };

  // Add message
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
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Send message
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

  const addEmoji = (emojiData) => {
    setNewMessage(prev => prev.length < 500 ? prev + emojiData.emoji : prev);
  };

  // Create room
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
    } catch (err) {
      setError("Failed to create room. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  // Join meeting
  const handleJoinMeeting = async () => {
    if (!meetingId.trim() || !username.trim()) {
      setError("Meeting ID and username are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const mediaSuccess = await startMedia();
      if (!mediaSuccess) {
        addMessage("Joining without camera/microphone due to permission issues", "system");
      }

      const [socketConnected] = await Promise.all([
        initializeSocket(),
        initializePeer(),
      ]);

      if (!socketConnected) {
        throw new Error("Failed to connect to server");
      }

      setupSocketListeners();

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
        
        if (response.data.room?.users?.length > 0) {
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
      setError(err.message || "Failed to join the meeting. Please check your network.");
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
      if (isRecording) {
        stopRecording();
      }

      await axios.post(`${API_URL}/api/room/leave`, {
        roomId: meetingId,
        userId: userId.current,
      }).catch(err => console.error("Error leaving room:", err));

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
      setRoomCreated(false);
      setConnectionStatus("disconnected");
    } catch (err) {
      setError("Failed to leave meeting on server. You are disconnected locally.");
    }
  };

  // Clean up streams
  const cleanupMediaStreams = () => {
    [localStream, screenStream].forEach(streamRef => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            if (track.readyState === "live") track.stop();
          } catch (err) {
            console.error("❌ Error stopping track:", err);
          }
        });
        streamRef.current = null;
      }
    });

    Object.values(peersRef.current).forEach(({ call }) => {
      try {
        call.close();
      } catch (err) {
        console.error("❌ Error closing call:", err);
      }
    });
    peersRef.current = {};
    
    Object.keys(userVideoRefs.current).forEach(uid => {
      if (userVideoRefs.current[uid]) {
        userVideoRefs.current[uid].srcObject = null;
      }
    });
    userVideoRefs.current = {};
  };

  // Copy meeting ID
  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId)
        .then(() => {
          addMessage("Meeting ID copied to clipboard", "system");
        })
        .catch(() => {
          setError("Failed to copy meeting ID. Please try again.");
        });
    }
  };

  // Connection status bar
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

  const checkConnectionStatus = () => {
    console.log("=== CONNECTION STATUS ===");
    console.log("Socket connected:", socketRef.current?.connected);
    console.log("Peer connected:", peerRef.current && !peerRef.current.disconnected);
    console.log("ICE State:", iceConnectionState);
    console.log("=========================");
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      cleanupMediaStreams();
      if (peerRef.current) peerRef.current.destroy();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return (
    <Container fluid className="meeting-container">
      {!joined ? (
        <JoinScreen
          meetingId={meetingId}
          setMeetingId={setMeetingId}
          username={username}
          setUsername={setUsername}
          loading={loading}
          error={error}
          roomCreated={roomCreated}
          handleCreateRoom={handleCreateRoom}
          handleJoinMeeting={handleJoinMeeting}
          copyMeetingId={copyMeetingId}
        />
      ) : (
        <div className="meeting-room">
          <div className="connection-status-bar">
            <ConnectionStatusIndicator />
            {iceConnectionState !== "connected" && iceConnectionState !== "completed" && (
              <span className="ice-status">
                ICE: {iceConnectionState}
              </span>
            )}
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={checkConnectionStatus}
              className="debug-btn"
            >
              Debug
            </Button>
            <Button 
              variant="outline-info" 
              size="sm" 
              onClick={debugMediaStreams}
              className="debug-btn"
            >
              Debug Media
            </Button>
          </div>
          
          <VideoGrid
            localVideoRef={localVideoRef}
            isVideoOn={isVideoOn}
            mediaAccessGranted={mediaAccessGranted}
            username={username}
            isMicOn={isMicOn}
            isScreenSharing={isScreenSharing}
            participants={participants}
            activeSpeaker={activeSpeaker}
            userId={userId.current}
            userVideoRefs={userVideoRefs}
            showChat={showChat}
          />

          {showChat && (
            <ChatSidebar
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              showEmojiPicker={showEmojiPicker}
              setShowEmojiPicker={setShowEmojiPicker}
              handleSendMessage={handleSendMessage}
              addEmoji={addEmoji}
              chatContainerRef={chatContainerRef}
              setShowChat={setShowChat}
            />
          )}

          {showParticipants && (
            <ParticipantsSidebar
              participants={participants}
              username={username}
              isMicOn={isMicOn}
              isVideoOn={isVideoOn}
              isScreenSharing={isScreenSharing}
              setShowParticipants={setShowParticipants}
            />
          )}

          <MeetingControls
            isMicOn={isMicOn}
            toggleMic={toggleMic}
            mediaAccessGranted={mediaAccessGranted}
            isVideoOn={isVideoOn}
            toggleVideo={toggleVideo}
            isScreenSharing={isScreenSharing}
            shareScreen={shareScreen}
            isRecording={isRecording}
            stopRecording={stopRecording}
            startRecording={startRecording}
            handleLeaveMeeting={handleLeaveMeeting}
            showParticipants={showParticipants}
            setShowParticipants={setShowParticipants}
            participantsCount={participants.length + 1}
            showChat={showChat}
            setShowChat={setShowChat}
            setShowSettings={setShowSettings}
          />
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
                      track.applyConstraints({ noiseSuppression: e.target.checked });
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
                      track.applyConstraints({ echoCancellation: e.target.checked });
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
              <p>Participants: {participants.length + 1}</p>
              <p>Active Connections: {Object.keys(peersRef.current).length}</p>
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