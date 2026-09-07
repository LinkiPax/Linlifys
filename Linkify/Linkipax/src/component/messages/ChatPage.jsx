import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setMessages } from "../../MessageSlice";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import ReactAudioPlayer from "react-audio-player";
import { Peer } from "peerjs";
import NavbarComponent from "../navbar/Navbar";
import {
  FiSend,
  FiMic,
  FiSquare,
  FiPhone,
  FiPhoneOff,
  FiSmile,
  FiArrowLeft,
  FiCheckCheck,
  FiMusic,
  FiTrash2,
  FiShield,
  FiRadio,
} from "react-icons/fi";
import "./Messages.css";

let socket;
let peer;
let currentCall;

const ChatPage = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.messages);
  const [messageContent, setMessageContent] = useState("");
  const [userData, setUserData] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURLs, setAudioURL] = useState("");
  const { targetUserId } = useParams();
  const [isInCall, setIsInCall] = useState(false);

  console.log("uploadurl", audioURLs);

  // Fetch user data and connections
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId) {
      const fetchUserData = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/user/${userId}`
          );
          setUserData(response.data);
          setConnections(response.data.connections);
        } catch (err) {
          setError("Error fetching user data.");
          console.error(err);
        }
      };

      fetchUserData();
    } else {
      setError("User ID not found in local storage.");
    }
  }, []);

  // Fetch target user profile for display info
  useEffect(() => {
    if (!targetUserId) return;
    const fetchTargetUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/${targetUserId}`
        );
        setTargetUser(response.data);
      } catch (err) {
        console.error("Error fetching target user data:", err);
      }
    };
    fetchTargetUser();
  }, [targetUserId]);

  // Setup socket connection
  useEffect(() => {
    if (!userData) return;

    socket = io(`${import.meta.env.VITE_API_URL}`, { withCredentials: true });

    socket.emit("join", userData._id);

    // Listen for incoming calls
    socket.on("incoming_call", (callData) => {
      if (
        window.confirm(`Incoming call from ${callData.senderName}. Accept?`)
      ) {
        initiateCall(callData.senderId);
      }
    });

    // Listen for new messages
    socket.on("new_message", (newMessage) => {
      console.log("New message received:", newMessage);
      dispatch(addMessage(newMessage));
    });

    return () => {
      socket.disconnect();
    };
  }, [userData, dispatch]);

  // Initialize PeerJS when the component mounts
  useEffect(() => {
    if (!userData) return;

    peer = new Peer(userData._id, {
      host: "localhost",
      port: 9000,
      path: "/",
      secure: false,
    });

    peer.on("open", (id) => {
      console.log("Peer connection established with ID:", id);
    });

    // Handle incoming audio calls
    peer.on("call", (call) => {
      console.log("Incoming call", call);
      call.answer();
      setIsInCall(true);

      call.on("stream", (stream) => {
        const audio = document.createElement("audio");
        audio.srcObject = stream;
        audio.play();
      });

      currentCall = call;
    });

    return () => {
      peer.destroy();
    };
  }, [userData]);

  const initiateCall = async (receiverId) => {
    if (isInCall) {
      alert("Already in a call.");
      return;
    }

    try {
      if (!window.localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        window.localStream = stream;
      }

      const call = peer.call(receiverId, window.localStream);
      setIsInCall(true);

      call.on("stream", (stream) => {
        const audio = document.createElement("audio");
        audio.srcObject = stream;
        audio.play();
      });

      currentCall = call;
    } catch (error) {
      console.error("Error initiating call:", error);
      alert(
        "An error occurred while initiating the call. Please check your camera and microphone settings."
      );
    }
  };

  const endCall = () => {
    if (currentCall) {
      currentCall.close();
      setIsInCall(false);
      alert("Call ended.");
    }
  };

  // Fetch messages for the selected user
  useEffect(() => {
    if (!targetUserId || !userData) return;

    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/messages`,
          {
            params: { userId: userData._id, targetUserId },
          }
        );
        dispatch(setMessages(response.data));
      } catch (err) {
        setError("Error fetching messages.");
        console.error(err);
      }
    };

    fetchMessages();
  }, [userData, targetUserId, dispatch]);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    if (!messageContent.trim() || !targetUserId) return;

    const newMessages = {
      senderId: userData._id,
      receiverId: targetUserId,
      content: messageContent.trim(),
    };
    try {
      console.log("Sending voice message:", newMessages);
      socket.emit("send_message", newMessages);
      dispatch(addMessage(newMessages));
      setMessageContent("");
    } catch (err) {
      setError("Error sending message.");
      console.error(err);
    }
  };

  // Start/stop recording voice
  const startRecording = () => {
    if (isRecording) {
      console.log("Stopping recording...");
      stopRecording();
    } else {
      console.log("Starting recording...");
      const start = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          console.log("Recording stopped. Processing audio...");
          const audioBlob = new Blob(chunks, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioURL(audioUrl);
          console.log("Audio URL generated:", audioUrl);
        };

        mediaRecorder.start();
        setIsRecording(true);

        setTimeout(() => {
          mediaRecorder.stop();
        }, 3000);
      };

      start();
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  // Handle sending a voice message
  const handleSendVoiceMessage = async () => {
    if (!audioURLs || !targetUserId) {
      console.error(
        "Cannot send voice message: Missing audioURL or targetUserId."
      );
      return;
    }
    console.log("Sending voice message with audio URL:", audioURLs);
    const newMessage = {
      senderId: userData._id,
      receiverId: targetUserId,
      content: "1",
      audioURL: "2",
    };
    try {
      console.log("Attempting to send voice message with data:", newMessage);
      socket.emit("send_message", newMessage);
      dispatch(addMessage(newMessage));
      setAudioURL("");
    } catch (err) {
      setError("Error sending voice message.");
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle emoji selection
  const handleEmojiClick = (emoji) => {
    setMessageContent((prev) => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  if (error) {
    return (
      <div className="chatpage-ultra-wrapper">
        <NavbarComponent />
        <div className="chatpage-error-container">
          <div className="chatpage-error-card">
            <h4>Notice</h4>
            <p>{error}</p>
            <Link to="/messages" className="chatpage-btn-primary">
              Return to Messages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const targetDisplayName =
    targetUser?.name || targetUser?.username || "Direct Chat";
  const targetInitials = (targetDisplayName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="chatpage-ultra-wrapper">
      <NavbarComponent />

      <div className="chatpage-main-container">
        <div className="chatpage-shell">
          {/* Header */}
          <header className="chatpage-header">
            <div className="chatpage-header-left">
              <Link
                to="/messages"
                className="chatpage-back-button"
                title="Back to conversations"
              >
                <FiArrowLeft size={20} />
              </Link>

              <div className="chatpage-user-pill">
                <div className="chatpage-avatar-wrap">
                  {targetUser?.profilePicture ? (
                    <img
                      src={targetUser.profilePicture}
                      alt={targetDisplayName}
                      className="chatpage-avatar-img"
                    />
                  ) : (
                    <div className="chatpage-avatar-fallback">
                      {targetInitials}
                    </div>
                  )}
                  <span
                    className={`chatpage-status-dot ${
                      isInCall ? "dot-calling" : "dot-active"
                    }`}
                  />
                </div>

                <div className="chatpage-user-meta">
                  <h2 className="chatpage-user-name">{targetDisplayName}</h2>
                  <div className="chatpage-user-sub">
                    {isInCall ? (
                      <span className="status-call-active">
                        <FiRadio className="pulse-icon" /> Audio Call Active
                      </span>
                    ) : (
                      <span className="status-idle">
                        {targetUser?.jobTitle || "Direct Conversation"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="chatpage-header-actions">
              {!isInCall ? (
                <button
                  type="button"
                  onClick={() => initiateCall(targetUserId)}
                  className="chatpage-call-btn call-start"
                  title="Start encrypted audio call"
                >
                  <FiPhone size={17} />
                  <span>Start Call</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={endCall}
                  className="chatpage-call-btn call-end"
                  title="Disconnect audio call"
                >
                  <FiPhoneOff size={17} />
                  <span>End Call</span>
                </button>
              )}
            </div>
          </header>

          {/* Messages Stream */}
          <div className="chatpage-stream-area" ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <div className="chatpage-empty-state">
                <div className="chatpage-empty-badge">
                  <FiShield size={28} />
                </div>
                <h3>Private & Secure Conversation</h3>
                <p>
                  Start messaging <strong>{targetDisplayName}</strong>. Messages
                  and audio calls are routed in real-time.
                </p>
              </div>
            ) : (
              <div className="chatpage-stream-inner">
                {messages.map((message, idx) => {
                  const isSentByMe =
                    (message.sender || message.senderId) === userData?._id;
                  const senderLabel = isSentByMe ? "You" : targetDisplayName;
                  const messageTime = message.createdAt
                    ? new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";

                  return (
                    <div
                      key={
                        message._id
                          ? `${message._id}_${message.createdAt || idx}`
                          : `msg_${idx}`
                      }
                      className={`chatpage-msg-row ${
                        isSentByMe ? "row-sent" : "row-received"
                      }`}
                    >
                      <div
                        className={`chatpage-bubble ${
                          isSentByMe ? "bubble-sent" : "bubble-received"
                        }`}
                      >
                        {!isSentByMe && (
                          <div className="bubble-sender-name">
                            {senderLabel}
                          </div>
                        )}

                        {message.content && (
                          <div className="bubble-text">{message.content}</div>
                        )}

                        {message.audioURL && (
                          <div className="bubble-audio-wrapper">
                            <div className="bubble-audio-header">
                              <FiMusic size={15} />
                              <span>Voice message</span>
                            </div>
                            <ReactAudioPlayer
                              src={message.audioURL}
                              controls
                              className="chatpage-audio-player"
                            />
                          </div>
                        )}

                        <div className="bubble-meta-info">
                          {messageTime && (
                            <span className="bubble-timestamp">
                              {messageTime}
                            </span>
                          )}
                          {isSentByMe && (
                            <span
                              className="bubble-check-icon"
                              title="Delivered"
                            >
                              <FiCheckCheck size={14} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Voice Preview Banner */}
          {audioURLs && (
            <div className="chatpage-voice-bar">
              <div className="chatpage-voice-info">
                <FiMusic className="chatpage-voice-icon" />
                <span>Recorded voice message ready</span>
              </div>
              <div className="chatpage-voice-actions">
                <ReactAudioPlayer
                  src={audioURLs}
                  controls
                  className="chatpage-voice-player"
                />
                <button
                  type="button"
                  onClick={handleSendVoiceMessage}
                  className="chatpage-voice-send-btn"
                >
                  <FiSend size={14} />
                  <span>Send Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudioURL("")}
                  className="chatpage-voice-discard-btn"
                  title="Discard recording"
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Recording Status Bar */}
          {isRecording && (
            <div className="chatpage-recording-bar">
              <div className="recording-signal">
                <span className="recording-pulse-circle"></span>
                <span>Recording audio...</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="recording-stop-btn"
              >
                <FiSquare size={13} />
                <span>Stop</span>
              </button>
            </div>
          )}

          {/* Input Dock */}
          <footer className="chatpage-input-dock">
            {showEmojiPicker && (
              <div className="chatpage-emoji-container">
                <div
                  className="chatpage-emoji-overlay"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="chatpage-emoji-box">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="chatpage-input-form">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`chatpage-tool-btn ${
                  showEmojiPicker ? "active-tool" : ""
                }`}
                title="Insert emoji"
              >
                <FiSmile size={20} />
              </button>

              <button
                type="button"
                onClick={startRecording}
                className={`chatpage-tool-btn mic-btn ${
                  isRecording ? "is-recording" : ""
                }`}
                title={isRecording ? "Stop recording" : "Record voice message"}
              >
                <FiMic size={20} />
              </button>

              <input
                type="text"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder={`Message ${targetDisplayName}...`}
                className="chatpage-input-field"
              />

              <button
                type="submit"
                disabled={!messageContent.trim()}
                className="chatpage-submit-btn"
                title="Send message"
              >
                <FiSend size={18} />
              </button>
            </form>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

