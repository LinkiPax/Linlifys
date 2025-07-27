import Peer from "peerjs";
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
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MeetingApp Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with the video call.</h2>
          <p>
            Error:{" "}
            {this.state.error instanceof Error
              ? this.state.error.message
              : String(this.state.error) || "Unknown error occurred"}
          </p>
          <p>Please retry or refresh the page to continue.</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-secondary"
            aria-label="Retry joining meeting"
          >
            Retry
          </button>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [loading, setLoading] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [mediaAccessGranted, setMediaAccessGranted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const localStream = useRef(null);
  const screenStream = useRef(null);
  const localVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef([]);
  const chatContainerRef = useRef(null);
  const meetingIdRef = useRef(null);
  const userVideoRefs = useRef({});
  const userId = useRef(uuidv4());

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const logPeers = () => {
    console.log(
      "Current peers:",
      peersRef.current.map((p) => ({
        userId: p.userId,
        peer: p.peer
          ? { destroyed: p.peer.destroyed, connected: p.peer.connected }
          : "No peer object",
      }))
    );
  };

  const initializeSocket = async () => {
    console.log("Initializing socket connection...");
    try {
      socketRef.current = io(API_URL, {
        transports: ["websocket"],
        withCredentials: true,
        secure: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      return new Promise((resolve) => {
        socketRef.current.on("connect", () => {
          setConnectionStatus("connected");
          console.log("Socket connected with ID:", socketRef.current.id);
          setIsConnecting(false);
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

        socketRef.current.on("reconnecting", () => {
          setConnectionStatus("reconnecting");
        });

        socketRef.current.on("reconnect", () => {
          setConnectionStatus("connected");
          console.log("Socket reconnected");
          setError("");
        });
      });
    } catch (err) {
      console.error("Socket initialization error:", err);
      return false;
    }
  };

  const setupSocketListeners = () => {
    if (!socketRef.current) return;

    const socket = socketRef.current;

    const handleUserJoined = ({
      id,
      username,
      socketId,
      isMicOn = false,
      isVideoOn = false,
    }) => {
      console.log("User joined:", {
        id,
        username,
        socketId,
        isMicOn,
        isVideoOn,
      });
      if (id !== userId.current) {
        setParticipants((prev) => [
          ...prev.filter((p) => p.socketId !== socketId),
          {
            id,
            username: username || "Unknown",
            socketId,
            isMicOn,
            isVideoOn,
            isScreenSharing: false,
          },
        ]);
        if (localStream.current) {
          callUser(socketId, id);
        } else {
          console.error(
            "Cannot connect to new user: No media stream available."
          );
        }
      }
    };

    const handleUserLeft = ({ id, username }) => {
      console.log("User left:", { id, username });
      setParticipants((prev) => prev.filter((p) => p.id !== id));
      removePeer(id);
    };

    const handleReceiveMessage = ({ username, message }) => {
      console.log("Received message:", { username, message });
      addMessage(message, username);
    };

    const handleScreenShareStarted = ({ userId: sharerId }) => {
      console.log("Screen share started by:", sharerId);
      setActiveSpeaker(sharerId);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === sharerId ? { ...p, isScreenSharing: true } : p
        )
      );
    };

    const handleScreenShareStopped = ({ userId: sharerId }) => {
      console.log("Screen share stopped by:", sharerId);
      setActiveSpeaker(null);
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === sharerId ? { ...p, isScreenSharing: false } : p
        )
      );
    };

    const handleExistingUsers = (users) => {
      console.log("Existing users:", users);
      if (!localStream.current) {
        console.error("Cannot connect to existing users: No media stream.");
        return;
      }

      const validUsers = users
        .filter(
          (user) =>
            user.userId && user.userId !== userId.current && user.socketId
        )
        .map((user) => ({
          id: user.userId,
          username: user.username || "Unknown",
          socketId: user.socketId,
          isMicOn: user.isMicOn ?? false,
          isVideoOn: user.isVideoOn ?? false,
          isScreenSharing: false,
        }));

      setParticipants(validUsers);

      users.forEach((user) => {
        if (user.userId && user.userId !== userId.current && user.socketId) {
          callUser(user.socketId, user.userId);
        }
      });
    };

    const handleSignal = ({ from, signal, userId: remoteUserId }) => {
      console.log("Handling signal from:", from, "for user:", remoteUserId);

      if (!remoteUserId) {
        console.error("No remoteUserId in signal");
        return;
      }

      const peerObj = peersRef.current.find((p) => p.userId === remoteUserId);
      if (peerObj && !peerObj.peer.destroyed) {
        peerObj.peer.signal(signal);
        return;
      }

      if (!localStream.current) {
        console.error("Cannot answer peer: No media stream available.");
        return;
      }

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: localStream.current,
        config: {
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:global.stun.twilio.com:3478" },
          ],
        },
      });

      peer.on("signal", (answerSignal) => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit("signal", {
          to: from,
          from: socketRef.current.id,
          signal: answerSignal,
          userId: userId.current,
        });
      });

      peer.on("stream", (stream) => {
        console.log("Received stream from:", remoteUserId);
        if (userVideoRefs.current[remoteUserId]) {
          userVideoRefs.current[remoteUserId].srcObject = stream;
        }
      });

      peer.on("error", (err) => {
        console.error("Answering peer error:", err);
        removePeer(remoteUserId);
      });

      peer.on("close", () => {
        console.log("Answering peer connection closed with:", remoteUserId);
        removePeer(remoteUserId);
      });

      peer.on("icecandidate", (event) => {
        if (event.candidate && socketRef.current?.connected) {
          socketRef.current.emit("ice-candidate", {
            to: from,
            candidate: event.candidate,
            userId: userId.current,
          });
        }
      });

      peer.on("connect", () => {
        console.log("Peer connected with:", remoteUserId);
      });

      peersRef.current.push({ peer, userId: remoteUserId, socketId: from });
      peer.signal(signal);
      logPeers();
    };

    const handleIceCandidate = ({ from, candidate, userId: remoteUserId }) => {
      console.log("Handling ICE candidate from:", from);
      const peerObj = peersRef.current.find((p) => p.userId === remoteUserId);
      if (peerObj && peerObj.peer && candidate && !peerObj.peer.destroyed) {
        peerObj.peer
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch((err) => {
            console.error("Error adding ICE candidate:", err);
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
    socket.on("signal", handleSignal);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("screen-share-started", handleScreenShareStarted);
    socket.on("screen-share-stopped", handleScreenShareStopped);
    socket.on("existing-users", handleExistingUsers);
    socket.on("user-status-update", handleUserStatusUpdate);

    return () => {
      console.log("Cleaning up socket event listeners");
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("signal", handleSignal);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("screen-share-started", handleScreenShareStarted);
      socket.off("screen-share-stopped", handleScreenShareStopped);
      socket.off("existing-users", handleExistingUsers);
      socket.off("user-status-update", handleUserStatusUpdate);
    };
  };

  useEffect(() => {
    let isMounted = true;

    const setupSocket = async () => {
      try {
        const connected = await initializeSocket();
        if (!connected && isMounted) {
          setError("Failed to connect to server. Please refresh the page.");
        } else if (connected) {
          setupSocketListeners();
        }
      } catch (err) {
        console.error("Socket setup error:", err);
        if (isMounted) {
          setError("Failed to initialize connection. Please refresh the page.");
        }
      }
    };

    setupSocket();

    return () => {
      isMounted = false;
      console.log("Cleaning up socket connection...");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      cleanupMediaStreams();
      userId.current = uuidv4();
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      peersRef.current = peersRef.current.filter((p) => !p.peer.destroyed);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const callUser = (socketId, userId) => {
    console.log("Attempting to call user:", { socketId, userId });

    if (!socketId || !userId) {
      console.error("Invalid parameters for callUser:", { socketId, userId });
      return;
    }

    peersRef.current = peersRef.current.filter((p) => !p.peer.destroyed);
    if (peersRef.current.some((p) => p.userId === userId)) {
      console.log("Peer already exists for user:", userId);
      return;
    }

    if (!socketRef.current?.connected) {
      console.error("Socket not connected for signaling");
      setError("Cannot connect to peer: Server disconnected.");
      return;
    }

    if (!localStream.current?.getTracks().some((track) => track.enabled)) {
      console.error("No active tracks in local stream");
      setError("No active media tracks available.");
      return;
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream.current,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      if (!socketRef.current?.connected) return;
      socketRef.current.emit("signal", {
        to: socketId,
        from: socketRef.current.id,
        signal,
        userId: userId.current,
      });
    });

    peer.on("stream", (stream) => {
      console.log("Received stream from peer for user:", userId);
      if (userVideoRefs.current[userId]) {
        userVideoRefs.current[userId].srcObject = stream;
      }
    });

    peer.on("error", (err) => {
      console.error("Peer error:", err);
      setError("Failed to connect to peer. Please try again.");
      removePeer(userId);
    });

    peer.on("close", () => {
      console.log("Peer connection closed with:", userId);
      removePeer(userId);
    });

    peer.on("icecandidate", (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit("ice-candidate", {
          to: socketId,
          candidate: event.candidate,
          userId: userId.current,
        });
      }
    });

    peer.on("connect", () => {
      console.log("Peer connected with:", userId);
    });

    peersRef.current.push({ peer, userId, socketId });
    logPeers();
  };

  const removePeer = (userId) => {
    console.log("Removing peer:", userId);
    const peerIndex = peersRef.current.findIndex((p) => p.userId === userId);
    if (peerIndex !== -1) {
      try {
        if (!peersRef.current[peerIndex].peer.destroyed) {
          peersRef.current[peerIndex].peer.destroy();
        }
      } catch (err) {
        console.error("Error destroying peer:", err);
      }
      peersRef.current.splice(peerIndex, 1);
      if (userVideoRefs.current[userId]) {
        userVideoRefs.current[userId].srcObject = null;
        delete userVideoRefs.current[userId];
      }
      setParticipants((prev) => prev.filter((p) => p.id !== userId));
      logPeers();
    }
  };

  const startVideo = async () => {
    console.log("Attempting to start video with quality:", videoQuality);
    const resolutions = {
      "1080p": { width: { ideal: 1920 }, height: { ideal: 1080 } },
      "720p": { width: { ideal: 1280 }, height: { ideal: 720 } },
      "480p": { width: { ideal: 640 }, height: { ideal: 480 } },
    };
    const qualities = ["1080p", "720p", "480p"];

    for (const quality of qualities) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { ...resolutions[quality], frameRate: { ideal: 30 } },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (localStream.current) {
          localStream.current.getTracks().forEach((track) => {
            if (track.readyState === "live") track.stop();
          });
        }

        localStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setVideoQuality(quality);
        setMediaAccessGranted(true);
        console.log("Local stream initialized at", quality);
        return true;
      } catch (err) {
        console.warn(`Failed to get stream at ${quality}:`, err);
      }
    }

    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!audioStream.getAudioTracks().length) {
        throw new Error("No audio tracks available");
      }

      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => {
          if (track.readyState === "live") track.stop();
        });
      }

      localStream.current = audioStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = audioStream;
      }
      setIsVideoOn(false);
      setMediaAccessGranted(true);
      console.log("Audio-only stream initialized");
      return true;
    } catch (audioErr) {
      console.error("Couldn't access audio either:", audioErr);
      setError("No audio or video access. Please check permissions.");
      setMediaAccessGranted(false);
      return false;
    }
  };

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

  const toggleVideo = () => {
    if (!localStream.current) {
      setError("No media stream available to toggle video.");
      return;
    }
    const videoTracks = localStream.current.getVideoTracks();
    if (!videoTracks.length) {
      setError("No video tracks available.");
      return;
    }
    videoTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsVideoOn(!isVideoOn);
    if (socketRef.current?.connected) {
      socketRef.current.emit("user-status-update", {
        roomId: meetingId,
        userId: userId.current,
        isMicOn,
        isVideoOn: !isVideoOn,
      });
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    addMessage("Meeting recording started", "system");
  };

  const stopRecording = () => {
    setIsRecording(false);
    addMessage("Meeting recording stopped", "system");
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/room/create`);
      console.log("Room creation response:", response.data.room.roomId);
      if (!response.data || typeof response.data.room.roomId !== "string") {
        throw new Error("Invalid room creation response");
      }
      setMeetingId(response.data.room.roomId);
      setRoomCreated(true);
      setError("");
    } catch (err) {
      console.error("Error creating room:", err);
      const message =
        err.response?.status === 429
          ? "Too many requests. Please try again later."
          : "Failed to create room. Please check your network.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyMeetingId = () => {
    if (meetingId) {
      navigator.clipboard.writeText(meetingId).then(() => {
        addMessage("Meeting ID copied to clipboard", "system");
      });
    }
  };

  const handleJoinMeeting = async () => {
    if (!meetingId.trim() || !username.trim()) {
      setError("Meeting ID and username are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!socketRef.current || !socketRef.current.connected) {
        const socketConnected = await initializeSocket();
        if (!socketConnected) {
          throw new Error("Failed to connect to server");
        }
        setupSocketListeners();
      }

      const response = await axios.post(`${API_URL}/api/room/join`, {
        meetingId,
        username,
        userId: userId.current,
        socketId: socketRef.current.id,
        isMicOn: true,
        isVideoOn: true,
      });

      if (response.data.success) {
        const mediaSuccess = await startVideo();
        if (!mediaSuccess) {
          addMessage(
            "Joining without camera/microphone due to permission issues",
            "system"
          );
        }
        socketRef.current.emit("join-meeting", {
          meetingId,
          username,
          userId: userId.current,
          socketId: socketRef.current.id,
          isMicOn: mediaSuccess ? isMicOn : false,
          isVideoOn: mediaSuccess ? isVideoOn : false,
        });
        setJoined(true);
        addMessage("You joined the meeting", "system");
        if (response.data.users && response.data.users.length > 0) {
          socketRef.current.emit("get-existing-users", { meetingId });
        }
      } else {
        setError(response.data.message || "Failed to join the meeting.");
      }
    } catch (err) {
      console.error("Error joining meeting:", err);
      setError(
        err.message || "Failed to join the meeting. Please check your network."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      await axios.post(`${API_URL}/api/room/leave`, {
        roomId: meetingId,
        userId: userId.current,
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit("leave-meeting", {
          meetingId,
          username,
          userId: userId.current,
          socketId: socketRef.current.id,
        });
      }

      cleanupMediaStreams();
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

    peersRef.current.forEach(({ peer, userId }) => {
      try {
        if (!peer.destroyed) {
          peer.destroy();
          console.log("Destroyed peer connection for user:", userId);
        }
      } catch (err) {
        console.error("Error destroying peer:", err);
      }
    });
    peersRef.current = [];
    userVideoRefs.current = {};
  };

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
    setNewMessage((prev) =>
      prev.length < 500 ? prev + emojiData.emoji : prev
    );
  };

  const shareScreen = async () => {
    try {
      if (!socketRef.current?.connected) {
        throw new Error("Cannot update screen share: Server disconnected");
      }
      if (isScreenSharing) {
        if (screenStream.current) {
          screenStream.current.getTracks().forEach((track) => {
            if (track.readyState === "live") track.stop();
          });
          screenStream.current = null;
        }
        if (
          localStream.current &&
          localStream.current.getVideoTracks().length
        ) {
          localVideoRef.current.srcObject = localStream.current;
        } else {
          setError("No video track available to restore.");
        }
        setIsScreenSharing(false);
        socketRef.current.emit("stop-screen-share", {
          roomId: meetingId,
          userId: userId.current,
        });

        peersRef.current.forEach(({ peer }) => {
          if (peer.destroyed || !localStream.current) return;
          const videoTrack = localStream.current.getVideoTracks()[0];
          const sender = peer
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack).catch((err) => {
              console.error("Error replacing track:", err);
            });
          }
        });
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        if (!stream.getVideoTracks().length) {
          throw new Error("No video track in screen share stream");
        }

        screenStream.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socketRef.current.emit("start-screen-share", {
          roomId: meetingId,
          userId: userId.current,
        });

        setIsScreenSharing(true);
        setActiveSpeaker(userId.current);

        stream.getVideoTracks()[0].onended = () => {
          if (localVideoRef.current && localStream.current) {
            localVideoRef.current.srcObject = localStream.current;
          }
          setIsScreenSharing(false);
          setActiveSpeaker(null);
          if (socketRef.current?.connected) {
            socketRef.current.emit("stop-screen-share", {
              roomId: meetingId,
              userId: userId.current,
            });
          }

          peersRef.current.forEach(({ peer }) => {
            if (peer.destroyed || !localStream.current) return;
            const videoTrack = localStream.current.getVideoTracks()[0];
            const sender = peer
              .getSenders()
              .find((s) => s.track?.kind === "video");
            if (sender && videoTrack) {
              sender.replaceTrack(videoTrack).catch((err) => {
                console.error("Error replacing track:", err);
              });
            }
          });
        };

        peersRef.current.forEach(({ peer }) => {
          if (peer.destroyed) return;
          const videoTrack = stream.getVideoTracks()[0];
          const sender = peer
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack).catch((err) => {
              console.error("Error replacing track:", err);
            });
          } else {
            peer.addTrack(videoTrack, stream);
          }
        });
      }
    } catch (err) {
      console.error("Error sharing screen:", err);
      setError(
        "Failed to share screen. Please grant permissions or try again."
      );
    }
  };

  const setUserVideoRef = (userId, ref) => {
    if (ref) {
      userVideoRefs.current[userId] = ref;
      console.log("Set video ref for userId:", userId);
    } else if (userVideoRefs.current[userId]) {
      userVideoRefs.current[userId].srcObject = null;
      delete userVideoRefs.current[userId];
      console.log("Cleared video ref for userId:", userId);
    }
  };

  return (
    <Container fluid className="meeting-container">
      {isConnecting && (
        <div className="connecting-overlay">
          <Spinner animation="border" />
          <span>Connecting to peers...</span>
        </div>
      )}
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
                aria-label="Create new meeting"
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
                aria-label="Meeting ID"
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
                      aria-label="Copy meeting ID"
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
                  aria-label="Username"
                />
              </Form.Group>

              <Button
                variant="success"
                onClick={handleJoinMeeting}
                disabled={!meetingId || !username || loading}
                className="join-btn"
                aria-label="Join meeting"
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
                aria-label="Local video"
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
                {!isMicOn && (
                  <FiMicOff
                    className="mic-status"
                    aria-label="Microphone off"
                  />
                )}
                {isScreenSharing && (
                  <FaChalkboardTeacher
                    className="screen-share-icon"
                    aria-label="Screen sharing"
                  />
                )}
                {!mediaAccessGranted && (
                  <span className="media-warning">No media access</span>
                )}
              </div>
            </div>

            <div className="participants-grid">
              {participants.map((participant) => (
                <div
                  key={`participant-${participant.id}-${participant.socketId}`}
                  className={`participant-video ${
                    participant.id === activeSpeaker ? "active-speaker" : ""
                  }`}
                >
                  <video
                    ref={(ref) => setUserVideoRef(participant.id, ref)}
                    autoPlay
                    playsInline
                    className="remote-video"
                    aria-label={`Video for ${participant.username}`}
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
                        <FiMic size={12} aria-label="Microphone on" />
                      ) : (
                        <FiMicOff size={12} aria-label="Microphone off" />
                      )}
                      {participant.isVideoOn ? (
                        <FiVideo size={12} aria-label="Video on" />
                      ) : (
                        <FiVideoOff size={12} aria-label="Video off" />
                      )}
                      {participant.isScreenSharing && (
                        <FaChalkboardTeacher
                          size={12}
                          aria-label="Screen sharing"
                        />
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
                  aria-label="Close chat"
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
                    role="listitem"
                    aria-label={`Message from ${msg.username} at ${msg.timestamp}`}
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
                    aria-label="Toggle emoji picker"
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
                  aria-label="Chat input"
                />
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  aria-label="Send message"
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
                  aria-label="Close participants"
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
                      {isMicOn ? (
                        <FiMic size={12} aria-label="Microphone on" />
                      ) : (
                        <FiMicOff size={12} aria-label="Microphone off" />
                      )}
                      {isVideoOn ? (
                        <FiVideo size={12} aria-label="Video on" />
                      ) : (
                        <FiVideoOff size={12} aria-label="Video off" />
                      )}
                      {isScreenSharing && (
                        <FaChalkboardTeacher
                          size={12}
                          aria-label="Screen sharing"
                        />
                      )}
                    </div>
                  </div>
                </div>
                {participants.map((participant) => (
                  <div
                    key={`participant-${participant.id}-${participant.socketId}`}
                    className="participant-item"
                  >
                    <div className="participant-avatar">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="participant-info">
                      <span>{participant.username}</span>
                      <div className="participant-status">
                        {participant.isMicOn ? (
                          <FiMic size={12} aria-label="Microphone on" />
                        ) : (
                          <FiMicOff size={12} aria-label="Microphone off" />
                        )}
                        {participant.isVideoOn ? (
                          <FiVideo size={12} aria-label="Video on" />
                        ) : (
                          <FiVideoOff size={12} aria-label="Video off" />
                        )}
                        {participant.isScreenSharing && (
                          <FaChalkboardTeacher
                            size={12}
                            aria-label="Screen sharing"
                          />
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
                  className={
                    isMicOn
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                  aria-label={isMicOn ? "Mute mic" : "Unmute mic"}
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
                  className={
                    isVideoOn
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                  aria-label={isVideoOn ? "Stop video" : "Start video"}
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
                  className={
                    isScreenSharing
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-gray-600 hover:bg-gray-700"
                  }
                  aria-label={isScreenSharing ? "Stop sharing" : "Share screen"}
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
                    className="bg-red-600 hover:bg-red-700"
                    aria-label="Stop recording"
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
                    className="bg-gray-600 hover:bg-gray-700"
                    aria-label="Start recording"
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
                className="bg-red-600 hover:bg-red-700"
                aria-label="Leave meeting"
              >
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
                  className={
                    showParticipants
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  }
                  aria-label={`Show participants (${participants.length + 1})`}
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
                  className={
                    showChat
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-600 hover:bg-gray-700"
                  }
                  aria-label="Toggle chat"
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
                  className="bg-gray-600 hover:bg-gray-700"
                  aria-label="Open settings"
                >
                  <FiSettings />
                </Button>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      )}

      <Modal
        show={showSettings}
        onHide={() => setShowSettings(false)}
        centered
        className="modal"
        aria-labelledby="modal-label"
      >
        <Modal.Header closeButton>
          <Modal.Title id="modal-label">Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Video Quality</Form.Label>
              <Form.Select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                aria-label="Select video quality"
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
                aria-label="Toggle noise suppression"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Enable Echo Cancellation"
                defaultChecked
                disabled={!mediaAccessGranted}
                aria-label="Toggle echo cancellation"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="light"
            onClick={() => setShowSettings(false)}
            className="bg-gray-600 hover:bg-gray-700"
            aria-label="Close settings"
          >
            Close
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowSettings(false)}
            className="bg-blue-500 hover:bg-blue-600"
            aria-label="Save settings"
          >
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
