import React, { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Badge,
  Button,
  Divider,
  Drawer,
  Dropdown,
  Input,
  List,
  Menu,
  Modal,
  Space,
  Tag,
  Tooltip,
  Typography,
  message as antMessage,
  Spin,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Checkbox,
  Radio,
  Progress,
} from "antd";
import {
  AudioOutlined,
  PaperClipOutlined,
  PhoneOutlined,
  SearchOutlined,
  SendOutlined,
  SmileOutlined,
  VideoCameraOutlined,
  MenuOutlined,
  CloseOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  StarOutlined,
  PictureOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  UserOutlined,
  FileOutlined,
  BarChartOutlined,
  CalendarOutlined,
  MoreOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  SoundOutlined,
  FileWordOutlined,
  FilePptOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import Peer from "peerjs";
import "./ProfessionalChat.css";

import CircularProgress from "@mui/material/CircularProgress";
import { FilePdfOutlined } from "@ant-design/icons";
const { Text, Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ProfessionalChat = () => {
  // State management
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUser, setCurrentUser] = useState({
    id: localStorage.getItem("userId"),
    name: localStorage.getItem("username") || "User",
  });
  const [activeContact, setActiveContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [callStatus, setCallStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [showMediaViewer, setShowMediaViewer] = useState(false);
  const [mediaType, setMediaType] = useState("images");
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isInCall, setIsInCall] = useState(false);
  const [currentCall, setCurrentCall] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationDuration, setLocationDuration] = useState(15);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [pollDuration, setPollDuration] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState(null);
  const [eventTime, setEventTime] = useState(null);
  const [eventLocation, setEventLocation] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const { contactId } = useParams();
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const documentInputRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const peerInstanceRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    const socket = io(`${import.meta.env.VITE_API_URL}`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    const audio = document.createElement("audio");
    remoteAudioRef.current = audio;
    document.body.appendChild(audio);

    return () => {
      socket.disconnect();
      if (peerInstanceRef.current) {
        peerInstanceRef.current.destroy();
      }
      if (remoteAudioRef.current) {
        document.body.removeChild(remoteAudioRef.current);
      }
    };
  }, [currentUser.id]);

  // Socket listeners
  useEffect(() => {
    if (!socketRef.current) return;
    const handleIncomingCall = (callData) => {
      // Initialize PeerJS if not already initialized
      if (!peerInstanceRef.current) {
        const peer = new Peer(currentUser.id, {
          host: "localhost",
          port: 9000,
          path: "/",
          secure: false,
        });

        peer.on("open", (id) => {
          console.log("Peer connection established with ID:", id);
          peerInstanceRef.current = peer;
          handleIncomingCallAfterPeerInit(callData);
        });

        peer.on("error", (err) => {
          console.error("PeerJS error:", err);
          antMessage.error("Failed to initialize call connection");
        });
      } else {
        handleIncomingCallAfterPeerInit(callData);
      }
    };

    const handleIncomingCallAfterPeerInit = (callData) => {
      setCallStatus({
        type: callData.isVideo ? "video" : "audio",
        outgoing: false,
        active: true,
        with: contacts.find((c) => c.id === callData.senderId) || {
          id: callData.senderId,
          name: callData.senderName,
        },
      });
    };

    const handleTypingIndicator = (data) => {
      if (data.senderId === activeContact?.id) {
        setTypingIndicator(
          data.isTyping ? `${activeContact.name} is typing...` : null
        );
      }
    };

    socketRef.current.on("incoming_call", handleIncomingCall);
    socketRef.current.on("typing_indicator", handleTypingIndicator);

    return () => {
      socketRef.current.off("incoming_call", handleIncomingCall);
      socketRef.current.off("typing_indicator", handleTypingIndicator);
    };
  }, [contacts, activeContact, currentUser.id]);

  // Join socket room when user connects
  useEffect(() => {
    if (!socketRef.current || !currentUser.id) return;

    socketRef.current.emit("join", currentUser.id);
    const handleNewMessage = (newMessage) => {
      if (
        !newMessage.deletedFor?.includes(currentUser.id) &&
        (newMessage.sender === activeContact?.id ||
          newMessage.receiver === activeContact?.id)
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }

      if (newMessage.receiver === currentUser.id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.sender]: (prev[newMessage.sender] || 0) + 1,
        }));
      }
    };
    socketRef.current.on("new_message", handleNewMessage);

    return () => {
      socketRef.current.off("new_message", handleNewMessage);
    };
  }, [currentUser.id, activeContact]);

  // Typing indicator handler
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping && activeContact) {
      socketRef.current.emit("typing_indicator", {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        isTyping: true,
      });

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketRef.current.emit("typing_indicator", {
          senderId: currentUser.id,
          receiverId: activeContact.id,
          isTyping: false,
        });
      }, 2000);
    }
  }, [isTyping, activeContact, currentUser.id]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/${currentUser.id}`
        );
        setCurrentUser((prev) => ({
          ...prev,
          id: response.data._id,
          name: response.data.name || response.data.username,
          avatar: response.data.profilePicture,
          status: response.data.isOnline ? "online" : "offline",
          bio: response.data.bio,
          company: response.data.company,
          jobTitle: response.data.jobTitle,
        }));
      } catch (error) {
        antMessage.error("Failed to fetch user data", error);
      }
    };

    if (currentUser.id) {
      fetchUserData();
    }
  }, [currentUser.id]);

  // Fetch contacts
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const userResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/user/${currentUser.id}`
        );
        const connectionIds = [...new Set(userResponse.data.connections)];

        const contactsWithDetails = await Promise.all(
          connectionIds.map(async (connId) => {
            if (connId === currentUser.id) return null;

            try {
              const contactResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/user/${connId}`
              );
              const unreadResponse = await axios.get(
                `${
                  import.meta.env.VITE_API_URL
                }/api/messages/unread-count?userId=${
                  currentUser.id
                }&targetUserId=${connId}`
              );

              return {
                id: contactResponse.data._id,
                name:
                  contactResponse.data.name || contactResponse.data.username,
                avatar: contactResponse.data.profilePicture,
                status: "offline",
                unread: unreadResponse.data.count,
              };
            } catch (error) {
              console.error(`Error fetching contact ${connId}:`, error);
              return null;
            }
          })
        );

        setContacts(contactsWithDetails.filter((contact) => contact !== null));

        const counts = {};
        contactsWithDetails.forEach((contact) => {
          if (contact) counts[contact.id] = contact.unread;
        });
        setUnreadCounts(counts);
      } catch (error) {
        antMessage.error("Failed to fetch contacts", error);
      }
    };

    if (currentUser.id) {
      fetchContacts();
    }
  }, [currentUser.id]);

  // Set active contact when contactId changes
  useEffect(() => {
    if (contactId && contacts.length > 0) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        setActiveContact(contact);
        markMessagesAsRead(contact.id);
      }
    }
  }, [contactId, contacts]);

  // Fetch messages when active contact changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeContact || !currentUser.id) return;

      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/messages`,
          {
            params: {
              userId: currentUser.id,
              targetUserId: activeContact.id,
            },
          }
        );

        const filteredMessages = response.data.filter(
          (msg) => !msg.deletedFor?.includes(currentUser.id)
        );

        setMessages(filteredMessages);
      } catch (error) {
        antMessage.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [activeContact, currentUser.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markMessagesAsRead = async (contactId) => {
    try {
      // Only pick the messages where I am the receiver and isRead is false
      const unreadMessages = messages.filter(
        (msg) => msg.receiver === currentUser.id && !msg.isRead
      );

      if (unreadMessages.length > 0) {
        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/messages/mark-as-read`,
          {
            messageIds: unreadMessages.map((msg) => msg._id),
            readerId: currentUser.id, // ← add this
          }
        );

        // Locally zero out the unread count for this contact
        setUnreadCounts((prev) => ({
          ...prev,
          [contactId]: 0,
        }));
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const pinMessage = (message) => {
    setPinnedMessages((prev) => [...prev, message]);
    antMessage.success("Message pinned");
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/messages/${messageId}`,
        {
          userId: currentUser.id,
        }
      );
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      antMessage.success("Message deleted");
    } catch (error) {
      antMessage.error("Failed to delete message", error);
    }
  };

  const renderMessageStatus = (isRead) => {
    return isRead ? (
      <CheckCircleOutlined style={{ color: "#1890ff" }} />
    ) : (
      <CheckOutlined style={{ color: "#d9d9d9" }} />
    );
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeContact) return;

    const tempId = Date.now().toString();
    const newMessage = {
      _id: tempId,
      sender: currentUser.id,
      receiver: activeContact.id,
      content: inputMessage,
      replyTo: replyTo?._id || null,
      isRead: false,
      createdAt: new Date(),
      replyToMessage: replyTo,
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setReplyTo(null);
    setShowEmojiPicker(false);
    setIsTyping(false);

    try {
      socketRef.current.emit("send_message", {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        content: inputMessage,
        replyTo: replyTo?._id || null,
      });
    } catch (error) {
      antMessage.error("Failed to send message", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  const handleSendImage = async (imageFile) => {
    if (!imageFile) return;

    setUploading(true);
    const tempId = Date.now().toString();

    const optimisticMessage = {
      _id: tempId,
      sender: currentUser.id,
      receiver: activeContact.id,
      messageType: "image",
      image: {
        url: URL.createObjectURL(imageFile),
        caption: "",
        isUploading: true,
      },
      content: "Shared an image",
      isRead: false,
      createdAt: new Date(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("senderId", currentUser.id);
    formData.append("receiverId", activeContact.id);
    formData.append("caption", "");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/images`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );
    } catch (error) {
      console.error("Error sending image:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      antMessage.error("Failed to send image");
    } finally {
      setUploading(false);
    }
  };

  const handleSendVideo = async (videoFile) => {
    if (!videoFile) return;

    setUploading(true);
    const tempId = Date.now().toString();

    const optimisticMessage = {
      _id: tempId,
      sender: currentUser.id,
      receiver: activeContact.id,
      messageType: "video",
      video: {
        url: URL.createObjectURL(videoFile),
        caption: "",
        isUploading: true,
      },
      content: "Shared a video",
      isRead: false,
      createdAt: new Date(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("senderId", currentUser.id);
    formData.append("receiverId", activeContact.id);
    formData.append("caption", "");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/videos`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );
      antMessage.success("Video sent successfully");
    } catch (error) {
      console.error("Error sending video:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      antMessage.error(error.response?.data?.message || "Failed to send video");
    } finally {
      setUploading(false);
    }
  };

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      antMessage.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/live-location`,
        {
          senderId: currentUser.id,
          receiverId: activeContact.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          duration: locationDuration,
          live: true,
          expiresAt: new Date(Date.now() + locationDuration * 60000),
          content: "Shared live location",
        }
      );

      setMessages((prev) => [...prev, response.data]);
      setShowLocationModal(false);
      antMessage.success("Live location shared");
    } catch (error) {
      antMessage.error("Failed to get location", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareContacts = async () => {
    if (selectedContacts.length === 0) {
      antMessage.error("Please select at least one contact");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/contacts`,
        {
          senderId: currentUser.id,
          receiverId: activeContact.id,
          messageType: "contact",
          contacts: selectedContacts.map((id) => ({
            id,
            name: contacts.find((c) => c.id === id).name,
            avatar: contacts.find((c) => c.id === id).avatar,
          })),
          content: `Shared ${selectedContacts.length} contact(s)`,
        }
      );

      setMessages((prev) => [...prev, response.data]);
      setShowContactsModal(false);
      setSelectedContacts([]);
      antMessage.success("Contacts shared");
    } catch (error) {
      antMessage.error("Failed to share contacts", error);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      antMessage.error("Please select a document");
      return;
    }

    setUploading(true);
    const tempId = Date.now().toString();

    const optimisticMessage = {
      _id: tempId,
      sender: currentUser.id,
      receiver: activeContact.id,
      messageType: "document",
      document: {
        name: documentFile.name,
        size: documentFile.size,
        isUploading: true,
      },
      content: `Shared document: ${documentFile.name}`,
      isRead: false,
      createdAt: new Date(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const formData = new FormData();
    formData.append("document", documentFile);
    formData.append("senderId", currentUser.id);
    formData.append("receiverId", activeContact.id);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );
      setShowDocumentModal(false);
      setDocumentFile(null);
      antMessage.success("Document shared successfully");
    } catch (error) {
      console.error("Error uploading document:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      antMessage.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion || pollOptions.some((opt) => !opt.trim())) {
      antMessage.error("Please fill all poll fields");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/polls`,
        {
          senderId: currentUser.id,
          receiverId: activeContact.id,
          question: pollQuestion,
          options: pollOptions.map((opt) => ({ text: opt })),
          isMultiSelect,
          duration: pollDuration,
        }
      );

      setMessages((prev) => [...prev, response.data]);
      setShowPollModal(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setIsMultiSelect(false);
      setPollDuration(null);
      antMessage.success("Poll created");
    } catch (error) {
      antMessage.error("Failed to create poll", error);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) {
      antMessage.error("Title and date are required");
      return;
    }

    try {
      const eventDateTime = new Date(eventDate);
      if (eventTime) {
        eventDateTime.setHours(eventTime.getHours());
        eventDateTime.setMinutes(eventTime.getMinutes());
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/events`,
        {
          senderId: currentUser.id,
          receiverId: activeContact.id,
          title: eventTitle,
          description: eventDescription,
          date: eventDateTime,
          location: eventLocation,
        }
      );

      setMessages((prev) => [...prev, response.data]);
      setShowEventModal(false);
      setEventTitle("");
      setEventDescription("");
      setEventDate(null);
      setEventTime(null);
      setEventLocation("");
      antMessage.success("Event created");
    } catch (error) {
      antMessage.error("Failed to create event", error);
    }
  };

  const handleVoteInPoll = async (messageId, optionIndices) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/polls/${messageId}/vote`,
        {
          userId: currentUser.id,
          optionIndices: Array.isArray(optionIndices)
            ? optionIndices
            : [optionIndices],
        }
      );

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId && msg.messageType === "poll") {
            return response.data;
          }
          return msg;
        })
      );
    } catch (error) {
      antMessage.error("Failed to vote in poll", error);
    }
  };

  const handleRSVPToEvent = async (messageId, status) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/events/${messageId}/rsvp`,
        {
          userId: currentUser.id,
          status,
        }
      );

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId && msg.messageType === "event") {
            return response.data;
          }
          return msg;
        })
      );
    } catch (error) {
      antMessage.error("Failed to update RSVP", error);
    }
  };

  const handleReactToMessage = async (messageId, emoji) => {
    try {
      // 1) Send to server via REST to update the DB
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/${messageId}/react`,
        {
          userId: currentUser.id,
          emoji,
        }
      );

      // 2) Immediately replace the message in state for the current user:
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            return response.data;
          }
          return msg;
        })
      );
    } catch (error) {
      antMessage.error("Failed to react to message", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      audioRecorderRef.current = {
        recorder: mediaRecorder,
        stream,
      };

      const audioChunks = [];
      mediaRecorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 300000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      antMessage.error("Microphone access denied. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (audioRecorderRef.current?.recorder?.state !== "inactive") {
      audioRecorderRef.current?.recorder?.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob || !activeContact) return;

    const tempId = Date.now().toString();
    const audioUrl = URL.createObjectURL(audioBlob);

    const optimisticMessage = {
      _id: tempId,
      sender: currentUser.id,
      receiver: activeContact.id,
      messageType: "audio",
      audio: {
        url: audioUrl,
        duration: recordingTime,
        isUploading: true,
      },
      content: "Voice message",
      isRead: false,
      createdAt: new Date(),
      isOptimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `voice_${Date.now()}.webm`);
      formData.append("senderId", currentUser.id);
      formData.append("receiverId", activeContact.id);
      formData.append("duration", recordingTime);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/messages/audio`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? response.data : msg))
      );

      setAudioBlob(null);
      setRecordingTime(0);
      antMessage.success("Voice message sent");
    } catch (error) {
      console.error("Error sending voice message:", error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      antMessage.error("Failed to send voice message");
    }
  };

  const initiateCall = async (isVideo) => {
    if (!peerInstanceRef.current || !activeContact) {
      // Initialize PeerJS if not already initialized
      const peer = new Peer(currentUser.id, {
        host: "localhost",
        port: 9000,
        path: "/",
        secure: false,
      });

      peer.on("open", (id) => {
        console.log("Peer connection established with ID:", id);
        peerInstanceRef.current = peer;
        continueCallInitiation(peer, isVideo);
      });

      peer.on("error", (err) => {
        console.error("PeerJS error:", err);
        antMessage.error("Failed to initialize call connection");
      });
    } else {
      continueCallInitiation(peerInstanceRef.current, isVideo);
    }
  };

  const continueCallInitiation = async (peer, isVideo) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      const call = peer.call(activeContact.id, stream);

      setCurrentCall(call);
      setIsInCall(true);

      setCallStatus({
        type: isVideo ? "video" : "audio",
        outgoing: true,
        active: true,
        with: activeContact,
      });

      call.on("stream", (remoteStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current
            .play()
            .catch((e) => console.error("Error playing audio:", e));
        }
      });

      call.on("close", () => {
        setIsInCall(false);
        setCallStatus(null);
      });

      socketRef.current.emit("call_initiated", {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: activeContact.id,
        isVideo: isVideo,
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      antMessage.error("Failed to start call. Please check your permissions.");
    }
  };

  const answerCall = async () => {
    if (!currentCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callStatus.type === "video",
      });
      currentCall.answer(stream);
      setIsInCall(true);

      currentCall.on("stream", (remoteStream) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current
            .play()
            .catch((e) => console.error("Error playing audio:", e));
        }
      });

      setCallStatus((prev) => ({
        ...prev,
        outgoing: false,
        active: true,
      }));
    } catch (error) {
      console.error("Error answering call:", error);
      antMessage.error("Failed to answer call. Please check your permissions.");
    }
  };

  const endCall = () => {
    if (currentCall) {
      currentCall.close();
    }
    setIsInCall(false);
    setCallStatus(null);
    setCurrentCall(null);

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  const renderMessageContent = (msg) => {
    switch (msg.messageType) {
      case "image":
        return (
          <div className="image-message-container">
            {msg.image?.url ? (
              <>
                <div
                  className="image-thumbnail"
                  style={{
                    width: "200px",
                    height: "150px",
                    position: "relative",
                    cursor: "pointer",
                    overflow: "hidden",
                    borderRadius: "8px",
                    backgroundColor: "#f0f0f0",
                  }}
                  onClick={() => setExpanded(true)}
                >
                  <img
                    src={msg.image.url}
                    alt={msg.image.caption || "Shared image"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: imageLoaded ? "block" : "none",
                    }}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-image.png";
                    }}
                  />

                  {!imageLoaded && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CircularProgress size={24} />
                    </div>
                  )}
                </div>

                {expanded && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.9)",
                      zIndex: 1000,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <img
                      src={msg.image.url}
                      alt={msg.image.caption || "Shared image"}
                      style={{
                        maxWidth: "90vw",
                        maxHeight: "90vh",
                        objectFit: "contain",
                      }}
                    />
                    <div
                      style={{
                        marginTop: "16px",
                        display: "flex",
                        gap: "16px",
                      }}
                    >
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement("a");
                          link.href = msg.image.url;
                          link.download = `image-${msg._id}.${
                            msg.image.format || "jpg"
                          }`;
                          link.click();
                        }}
                      >
                        Save Image
                      </Button>
                      <Button onClick={() => setExpanded(false)}>Close</Button>
                    </div>
                  </div>
                )}

                {msg.image.caption && (
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "0.9rem",
                      color: "#666",
                      wordBreak: "break-word",
                      maxWidth: "200px",
                    }}
                  >
                    {msg.image.caption}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  padding: "16px",
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  borderRadius: "8px",
                  width: "200px",
                }}
              >
                Image failed to load
              </div>
            )}
          </div>
        );
      case "video":
        return (
          <div
            className="video-message-container"
            style={{ maxWidth: "400px" }}
          >
            <div className="relative">
              <video
                controls
                src={msg.video?.url}
                poster={msg.video?.thumbnail}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  aspectRatio:
                    msg.video?.width && msg.video?.height
                      ? `${msg.video.width}/${msg.video.height}`
                      : "16/9",
                  backgroundColor: "#000",
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.currentTarget.parentElement.querySelector("video").play();
                  }}
                >
                  <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center"></div>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="mr-2">🎥 Video</span>
              <span>{formatFileSize(msg.video?.size)}</span>
              {msg.video?.duration > 0 && (
                <span className="ml-2">
                  {new Date(msg.video.duration * 1000)
                    .toISOString()
                    .substr(11, 8)}
                </span>
              )}
            </div>

            {msg.video?.caption && (
              <div className="mt-1 text-sm text-gray-700 break-words">
                {msg.video.caption}
              </div>
            )}

            <div className="mt-2">
              <Button
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = msg.video.url;
                  link.download = `video-${msg._id}.${
                    msg.video.format || "mp4"
                  }`;
                  link.click();
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download Video
              </Button>
            </div>
          </div>
        );
      case "audio":
        return (
          <div className="audio-message-container" aria-label="Audio message">
            <div className="audio-player-wrapper">
              <audio
                controls
                src={msg.audio?.url}
                onLoadedMetadata={(e) => {
                  if (e.target.duration && !msg.audio.duration) {
                    console.log("Audio duration:", e.target.duration);
                  }
                }}
                onError={() => {
                  console.error("Failed to load audio");
                }}
                preload="metadata"
                aria-label="Audio player"
              />
            </div>

            <div className="audio-meta">
              <div className="audio-details">
                <span className="duration" aria-label="Duration">
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {formatDuration(msg.audio?.duration || 0)}
                </span>

                <span className="size" aria-label="File size">
                  <FileOutlined style={{ marginRight: 4 }} />
                  {formatFileSize(msg.audio?.size || 0)}
                </span>

                <span className="format" aria-label="Audio format">
                  <SoundOutlined style={{ marginRight: 4 }} />
                  {msg.audio?.format?.toUpperCase() || "WEBM"}
                </span>
              </div>

              <Button
                className="download-btn"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = msg.audio?.url;
                  link.download = `voice_${msg._id}.${
                    msg.audio?.format || "webm"
                  }`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                aria-label="Download audio"
                title="Download audio"
              >
                <DownloadOutlined />
                <span className="sr-only">Download</span>
              </Button>
            </div>
          </div>
        );
      case "location": {
        // Safeguard against undefined location data
        if (
          !msg.location ||
          !msg.location.latitude ||
          !msg.location.longitude
        ) {
          return (
            <div className="location-message error">
              <EnvironmentOutlined style={{ fontSize: 24, marginRight: 8 }} />
              <Text type="danger">Location data unavailable</Text>
            </div>
          );
        }

        const mapUrl = `https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`;
        const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${msg.location.latitude},${msg.location.longitude}&zoom=15&size=300x150&maptype=roadmap&markers=color:red%7C${msg.location.latitude},${msg.location.longitude}&key=YOUR_API_KEY`;

        const expiresInMinutes = msg.location.live
          ? Math.round((new Date(msg.location.expiresAt) - Date.now()) / 60000)
          : null;

        return (
          <div className="location-message" style={{ maxWidth: "300px" }}>
            <div
              className="location-map-preview"
              onClick={() => window.open(mapUrl, "_blank")}
              style={{
                position: "relative",
                cursor: "pointer",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {/* Static map image - replace with your own implementation or API */}
              <div
                style={{
                  height: "150px",
                  background: `#f0f0f0 url(${staticMapUrl}) center/cover no-repeat`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {!staticMapUrl && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                    }}
                  >
                    <EnvironmentOutlined style={{ fontSize: 32 }} />
                  </div>
                )}
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "8px",
                  right: "8px",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                }}
              >
                <Text style={{ color: "white" }}>Tap to open in Maps</Text>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <EnvironmentOutlined
                style={{
                  fontSize: 20,
                  color: "#1890ff",
                  marginRight: "8px",
                }}
              />
              <div>
                <Text strong style={{ display: "block" }}>
                  {msg.location.live ? "Live Location" : "Shared Location"}
                </Text>

                <Space size="small">
                  <Button
                    type="link"
                    size="small"
                    onClick={() => window.open(mapUrl, "_blank")}
                    style={{ padding: 0 }}
                  >
                    Open in Maps
                  </Button>

                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${msg.location.latitude}, ${msg.location.longitude}`
                      );
                      antMessage.success("Coordinates copied to clipboard");
                    }}
                    style={{ padding: 0 }}
                  >
                    Copy Coordinates
                  </Button>
                </Space>
              </div>
            </div>

            {msg.location.live && expiresInMinutes > 0 && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ClockCircleOutlined
                  style={{
                    color: expiresInMinutes < 5 ? "#ff4d4f" : "#faad14",
                    marginRight: "6px",
                  }}
                />
                <Progress
                  percent={Math.min(
                    100,
                    (expiresInMinutes / (msg.location.duration || 15)) * 100
                  )}
                  status={expiresInMinutes < 5 ? "exception" : "active"}
                  showInfo={false}
                  strokeColor={expiresInMinutes < 5 ? "#ff4d4f" : "#1890ff"}
                  style={{ flex: 1, marginRight: "8px" }}
                />
                <Text type={expiresInMinutes < 5 ? "danger" : "secondary"}>
                  {Math.floor(expiresInMinutes)} min left
                </Text>
              </div>
            )}

            {msg.location.live && expiresInMinutes <= 0 && (
              <Tag color="red" style={{ marginTop: "8px" }}>
                Location sharing ended
              </Tag>
            )}

            {msg.location.address && (
              <div style={{ marginTop: "8px" }}>
                <Text type="secondary">{msg.location.address}</Text>
              </div>
            )}
          </div>
        );
      }
      case "contact":
        return (
          <div className="contact-message">
            <UserOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <div>
              <Text strong>Shared {msg.contacts.length} contact(s)</Text>
              {msg.contacts.map((contact, index) => (
                <div key={index} className="contact-item">
                  <Avatar src={contact.avatar} size="small" />
                  <Text>{contact.name}</Text>
                </div>
              ))}
            </div>
          </div>
        );
      case "document": {
        // Safeguard against undefined document
        if (!msg.document) {
          return (
            <div className="document-message error">
              <FileOutlined style={{ fontSize: 24, marginRight: 8 }} />
              <Text type="danger">Document unavailable</Text>
            </div>
          );
        }

        // Determine document type and icon
        const getDocumentIcon = () => {
          const type = msg.document?.type?.toLowerCase() || "";
          const name = msg.document?.name?.toLowerCase() || "";

          if (type.includes("pdf") || name.endsWith(".pdf")) {
            return { icon: <FilePdfOutlined />, color: "#f40f02" };
          }
          if (
            type.includes("word") ||
            name.endsWith(".doc") ||
            name.endsWith(".docx")
          ) {
            return { icon: <FileWordOutlined />, color: "#2b579a" };
          }
          if (
            type.includes("excel") ||
            name.endsWith(".xls") ||
            name.endsWith(".xlsx")
          ) {
            return { icon: <FileExcelOutlined />, color: "#217346" };
          }
          if (
            type.includes("powerpoint") ||
            name.endsWith(".ppt") ||
            name.endsWith(".pptx")
          ) {
            return { icon: <FilePptOutlined />, color: "#d24726" };
          }
          if (
            type.includes("zip") ||
            type.includes("compressed") ||
            name.endsWith(".zip") ||
            name.endsWith(".rar")
          ) {
            return { icon: <FileZipOutlined />, color: "#7d4b12" };
          }
          if (type.includes("text") || name.endsWith(".txt")) {
            return { icon: <FileTextOutlined />, color: "#333333" };
          }
          return { icon: <FileOutlined />, color: "#666666" };
        };

        const { icon, color } = getDocumentIcon();
        const fileType =
          msg.document?.type?.split("/")?.[1]?.toUpperCase() ||
          msg.document?.name?.split(".")?.pop()?.toUpperCase() ||
          "FILE";

        return (
          <div
            className="document-message-container"
            style={{
              maxWidth: "100%",
              border: "1px solid #f0f0f0",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              backgroundColor: "#fff",
            }}
          >
            <div
              className="document-preview"
              style={{
                width: "80px",
                minWidth: "80px",
                height: "100px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${color}10`, // Light tint of icon color
                borderRight: `1px solid #f0f0f0`,
              }}
            >
              {React.cloneElement(icon, {
                style: {
                  fontSize: 36,
                  color: color,
                },
              })}
            </div>

            <div
              className="document-info"
              style={{
                flex: 1,
                padding: "12px",
                minWidth: 0, // Important for text truncation
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  className="document-name"
                  style={{
                    fontWeight: 500,
                    fontSize: "14px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {msg.document.name || "Document"}
                </div>

                <div
                  className="document-meta"
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "4px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  <span
                    style={{
                      backgroundColor: "#f0f0f0",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontWeight: 500,
                    }}
                  >
                    {fileType}
                  </span>
                  <span>{formatFileSize(msg.document.size || 0)}</span>
                </div>
              </div>

              {msg.document.url && (
                <div
                  className="document-actions"
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => window.open(msg.document.url, "_blank")}
                    style={{
                      padding: "0 8px",
                      height: "28px",
                      fontSize: "12px",
                    }}
                  >
                    View
                  </Button>
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = msg.document.url;
                      link.download =
                        msg.document.originalName || msg.document.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    style={{
                      padding: "0 8px",
                      height: "28px",
                      fontSize: "12px",
                    }}
                  >
                    Download
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      }
      case "poll":
        return (
          <div className="poll-message">
            <BarChartOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <div>
              <Text strong>{msg.poll.question}</Text>
              {msg.poll.expiresAt &&
                new Date(msg.poll.expiresAt) < new Date() && (
                  <Tag color="red">Closed</Tag>
                )}
              {msg.poll.options.map((option, index) => {
                const hasVoted = option.voters.includes(currentUser.id);
                const percentage =
                  msg.poll.totalVotes > 0
                    ? Math.round(
                        (option.voters.length / msg.poll.totalVotes) * 100
                      )
                    : 0;

                return (
                  <div key={index} className="poll-option">
                    {msg.poll.expiresAt &&
                    new Date(msg.poll.expiresAt) > new Date() ? (
                      <Radio
                        checked={hasVoted}
                        onChange={() => handleVoteInPoll(msg._id, [index])}
                        disabled={hasVoted && !msg.poll.isMultiSelect}
                      >
                        {option.text}
                      </Radio>
                    ) : (
                      <div>
                        <Text>{option.text}</Text>
                        <Progress percent={percentage} />
                        <Text type="secondary">
                          {option.voters.length} votes
                        </Text>
                      </div>
                    )}
                  </div>
                );
              })}
              <Text type="secondary">
                {msg.poll.totalVotes} total votes •{" "}
                {msg.poll.isMultiSelect
                  ? "Multiple answers allowed"
                  : "Single answer"}
              </Text>
              {msg.poll.expiresAt && (
                <Text type="secondary">
                  {new Date(msg.poll.expiresAt) > new Date()
                    ? `Closes in ${Math.round(
                        (new Date(msg.poll.expiresAt) - Date.now()) / 60000
                      )} minutes`
                    : `Closed ${formatTimeAgo(new Date(msg.poll.expiresAt))}`}
                </Text>
              )}
            </div>
          </div>
        );
      case "event":
        return (
          <div className="event-message">
            <CalendarOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <div>
              <Text strong>{msg.event.title}</Text>
              <Text>{msg.event.description}</Text>
              <div>
                <Text type="secondary">
                  {new Date(msg.event.date).toLocaleString()}
                </Text>
              </div>
              {msg.event.location && (
                <div>
                  <EnvironmentOutlined /> {msg.event.location}
                </div>
              )}
              <div className="event-rsvp">
                <Text strong>Attendees ({msg.event.attendees.length}):</Text>
                <div className="attendees-list">
                  {msg.event.attendees.map((attendee, index) => (
                    <Tag key={index} color={getRSVPColor(attendee.status)}>
                      {attendee.userId === currentUser.id
                        ? "You"
                        : attendee.name}
                      : {attendee.status}
                    </Tag>
                  ))}
                </div>
                {new Date(msg.event.date) > new Date() && (
                  <Space>
                    <Button
                      size="small"
                      onClick={() => handleRSVPToEvent(msg._id, "going")}
                    >
                      Going
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleRSVPToEvent(msg._id, "maybe")}
                    >
                      Maybe
                    </Button>
                    <Button
                      size="small"
                      danger
                      onClick={() => handleRSVPToEvent(msg._id, "not_going")}
                    >
                      Not Going
                    </Button>
                  </Space>
                )}
              </div>
            </div>
          </div>
        );
      case "typing":
        return (
          <div className="typing-indicator">
            <div className="typing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        );
      default:
        return msg.content && <div className="message-text">{msg.content}</div>;
    }
  };

  const renderMessageReactions = (msg) => {
    if (!msg.reactions || msg.reactions.length === 0) return null;

    return (
      <div className="message-reactions">
        {msg.reactions.map((reaction, index) => (
          <Tooltip
            key={index}
            title={`${reaction.userId === currentUser.id ? "You" : "Someone"}`}
          >
            <span
              className="reaction-emoji"
              onClick={() => handleReactToMessage(msg._id, reaction.emoji)}
            >
              {reaction.emoji}
            </span>
          </Tooltip>
        ))}
      </div>
    );
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) return interval + " years ago";
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return interval + " months ago";
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return interval + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const getRSVPColor = (status) => {
    switch (status) {
      case "going":
        return "green";
      case "maybe":
        return "orange";
      case "not_going":
        return "red";
      default:
        return "blue";
    }
  };

  const renderAdditionalMessageOptions = () => (
    <Dropdown
      overlay={
        <Menu>
          <Menu.Item
            icon={<PictureOutlined />}
            onClick={() => documentInputRef.current?.click()}
          >
            Send Image
          </Menu.Item>
          <Menu.Item
            icon={<VideoCameraOutlined />}
            onClick={() => documentInputRef.current?.click()}
          >
            Send Video
          </Menu.Item>
          <Menu.Item
            icon={<EnvironmentOutlined />}
            onClick={() => setShowLocationModal(true)}
          >
            Share Location
          </Menu.Item>
          <Menu.Item
            icon={<UserOutlined />}
            onClick={() => setShowContactsModal(true)}
          >
            Share Contacts
          </Menu.Item>
          <Menu.Item
            icon={<FileOutlined />}
            onClick={() => setShowDocumentModal(true)}
          >
            Share Document
          </Menu.Item>
          <Menu.Item
            icon={<BarChartOutlined />}
            onClick={() => setShowPollModal(true)}
          >
            Create Poll
          </Menu.Item>
          <Menu.Item
            icon={<CalendarOutlined />}
            onClick={() => setShowEventModal(true)}
          >
            Create Event
          </Menu.Item>
        </Menu>
      }
      trigger={["click"]}
      placement="topRight"
    >
      <Button
        type="text"
        icon={<MoreOutlined />}
        className="input-action-btn"
      />
    </Dropdown>
  );

  const emojiList = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  return (
    <div className="professional-chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <div className="user-profile">
            <Badge
              dot
              status={currentUser.status === "online" ? "success" : "default"}
              offset={[-5, 40]}
            >
              <Avatar src={currentUser.avatar} size="large" />
            </Badge>
            <div className="user-info">
              <Text strong>{currentUser.name}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentUser.status === "online" ? "Online" : "Offline"}
              </Text>
            </div>
          </div>
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setShowDrawer(true)}
          />
        </div>

        <div className="sidebar-search">
          <Input
            placeholder="Search contacts"
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="contacts-list">
          {contacts
            .filter((contact) =>
              contact.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((contact) => (
              <div
                key={contact.id}
                className={`contact-item ${
                  activeContact?.id === contact.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveContact(contact);
                  markMessagesAsRead(contact.id);
                }}
              >
                <Badge
                  dot
                  status={contact.status === "online" ? "success" : "default"}
                  offset={[-5, 30]}
                >
                  <Avatar src={contact.avatar} />
                </Badge>
                <div className="contact-info">
                  <div className="contact-name">
                    <Text strong>{contact.name}</Text>
                    {unreadCounts[contact.id] > 0 && (
                      <span className="unread-badge">
                        {unreadCounts[contact.id]}
                      </span>
                    )}
                  </div>
                  <Text
                    type="secondary"
                    className="contact-status"
                    style={{
                      color:
                        contact.status === "online" ? "#52c41a" : undefined,
                    }}
                  >
                    {contact.status === "online" ? "Online" : "Offline"}
                  </Text>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {activeContact ? (
          <>
            <div className="chat-header">
              <div className="contact-info">
                <Badge
                  dot
                  status={
                    activeContact.status === "online" ? "success" : "default"
                  }
                  offset={[-5, 30]}
                >
                  <Avatar src={activeContact.avatar} size="default" />
                </Badge>
                <div>
                  <Text strong>{activeContact.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activeContact.status === "online" ? "Online" : "Offline"}
                  </Text>
                </div>
              </div>

              <Space size="middle">
                <Tooltip title="Voice call">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<PhoneOutlined />}
                    onClick={() => initiateCall(false)}
                  />
                </Tooltip>
                <Tooltip title="Video call">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<VideoCameraOutlined />}
                    onClick={() => initiateCall(true)}
                  />
                </Tooltip>
                <Tooltip title="Contact info">
                  <Button
                    type="text"
                    shape="circle"
                    icon={<InfoCircleOutlined />}
                    onClick={() => setShowDrawer(true)}
                  />
                </Tooltip>
              </Space>
            </div>

            <Divider style={{ margin: 0 }} />

            <div className="messages-container">
              {loading ? (
                <div className="empty-messages">
                  <Spin size="large" />
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`message ${
                        msg.sender === currentUser.id ? "sent" : "received"
                      }`}
                    >
                      <Dropdown
                        overlay={
                          <Menu>
                            <Menu.Item
                              icon={<StarOutlined />}
                              onClick={() => pinMessage(msg)}
                            >
                              Pin message
                            </Menu.Item>
                            <Menu.Item
                              icon={<SendOutlined />}
                              onClick={() => setReplyTo(msg)}
                            >
                              Reply
                            </Menu.Item>
                            {msg.sender === currentUser.id && (
                              <Menu.Item
                                icon={<DeleteOutlined />}
                                danger
                                onClick={() => deleteMessage(msg._id)}
                              >
                                Delete
                              </Menu.Item>
                            )}
                            <Menu.SubMenu
                              title="React"
                              icon={<SmileOutlined />}
                            >
                              {emojiList.map((emoji) => (
                                <Menu.Item
                                  key={emoji}
                                  onClick={() =>
                                    handleReactToMessage(msg._id, emoji)
                                  }
                                >
                                  {emoji}
                                </Menu.Item>
                              ))}
                            </Menu.SubMenu>
                          </Menu>
                        }
                        trigger={["contextMenu"]}
                      >
                        <div className="message-content">
                          {msg.replyTo && (
                            <div className="message-reply">
                              <Text type="secondary">
                                Replying to{" "}
                                {msg.replyTo.sender === currentUser.id
                                  ? "yourself"
                                  : activeContact.name}
                              </Text>
                              <div className="reply-content">
                                {msg.replyTo.content || "Audio message"}
                              </div>
                            </div>
                          )}

                          {renderMessageContent(msg)}
                          {renderMessageReactions(msg)}

                          <div className="message-meta">
                            <Text type="secondary" className="timestamp">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                            {msg.sender === currentUser.id && (
                              <span className="status-icon">
                                {renderMessageStatus(msg.isRead)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Dropdown>
                    </div>
                  ))}
                  {typingIndicator && (
                    <div className="message received">
                      <div className="message-content">
                        {renderMessageContent({
                          messageType: "typing",
                          isTyping: true,
                        })}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="empty-messages">
                  <div className="empty-content">
                    <Avatar
                      src={activeContact.avatar}
                      size={64}
                      style={{ marginBottom: 16 }}
                    />
                    <Title level={4}>No messages yet</Title>
                    <Text type="secondary">
                      Start your conversation with {activeContact.name}
                    </Text>
                  </div>
                </div>
              )}
            </div>

            {/* Reply preview */}
            {replyTo && (
              <div className="reply-preview">
                <div className="reply-content">
                  <Text strong>
                    Replying to{" "}
                    {replyTo.sender === currentUser.id
                      ? "yourself"
                      : activeContact.name}
                  </Text>
                  <Text ellipsis>{replyTo.content || "Audio message"}</Text>
                </div>
                <Button
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => setReplyTo(null)}
                />
              </div>
            )}

            {/* Message input */}
            <div className="message-input-container">
              {audioBlob ? (
                <div className="voice-message-preview">
                  <div className="recording-info">
                    <AudioOutlined />
                    <span>{formatDuration(recordingTime)}</span>
                  </div>
                  <Space>
                    <Button
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      onClick={cancelRecording}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendVoiceMessage}
                    />
                  </Space>
                </div>
              ) : isRecording ? (
                <div className="recording-indicator">
                  <div className="pulse-animation"></div>
                  <span>Recording... {formatDuration(recordingTime)}</span>
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    icon={<AudioOutlined />}
                    onClick={stopRecording}
                  />
                </div>
              ) : (
                <>
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    className="input-action-btn"
                    onClick={() => documentInputRef.current?.click()}
                  />

                  {renderAdditionalMessageOptions()}

                  <Input.TextArea
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      if (e.target.value && !isTyping) {
                        setIsTyping(true);
                      } else if (!e.target.value && isTyping) {
                        setIsTyping(false);
                      }
                    }}
                    placeholder="Type a message..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />

                  <Space>
                    <Button
                      type="text"
                      icon={<SmileOutlined />}
                      className="input-action-btn"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    />
                    {inputMessage ? (
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSendMessage}
                      />
                    ) : (
                      <Button
                        type="text"
                        icon={<AudioOutlined />}
                        className={`input-action-btn ${
                          isRecording ? "recording" : ""
                        }`}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                      />
                    )}
                  </Space>

                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      <EmojiPicker
                        onEmojiClick={(emoji) => {
                          setInputMessage((prev) => prev + emoji.emoji);
                          setShowEmojiPicker(false);
                        }}
                        width="100%"
                        height={300}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="no-contact-selected">
            <div className="empty-content">
              <Title level={3}>Select a conversation</Title>
              <Text type="secondary">
                Choose from your existing conversations or start a new one
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Right Drawer */}
      <Drawer
        title="Conversation Info"
        placement="right"
        width={350}
        onClose={() => setShowDrawer(false)}
        visible={showDrawer}
        className="info-drawer"
      >
        {activeContact && (
          <>
            <div className="drawer-header">
              <Avatar src={activeContact.avatar} size={64} />
              <Title level={4} style={{ marginTop: 16 }}>
                {activeContact.name}
              </Title>
              <Tag
                color={
                  activeContact.status === "online" ? "success" : "default"
                }
              >
                {activeContact.status === "online" ? "Online" : "Offline"}
              </Tag>
            </div>

            <Divider />

            <Title level={5}>Pinned Messages</Title>
            {pinnedMessages.length > 0 ? (
              <List
                dataSource={pinnedMessages}
                renderItem={(msg) => (
                  <List.Item className="pinned-message">
                    <Text type="secondary">
                      {msg.sender === currentUser.id
                        ? "You"
                        : activeContact.name}
                    </Text>
                    <Text>{msg.content || "Audio message"}</Text>
                  </List.Item>
                )}
              />
            ) : (
              <Text type="secondary">No pinned messages</Text>
            )}

            <Divider />

            <Title level={5}>Shared Media</Title>
            <Space>
              <Button
                type="text"
                icon={<PictureOutlined />}
                onClick={() => {
                  setMediaType("images");
                  setShowMediaViewer(true);
                }}
              >
                Photos
              </Button>
              <Button
                type="text"
                icon={<VideoCameraOutlined />}
                onClick={() => {
                  setMediaType("videos");
                  setShowMediaViewer(true);
                }}
              >
                Videos
              </Button>
              <Button
                type="text"
                icon={<FileOutlined />}
                onClick={() => {
                  setMediaType("documents");
                  setShowMediaViewer(true);
                }}
              >
                Documents
              </Button>
            </Space>

            <Divider />

            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                antMessage.warning("This will delete the entire conversation");
              }}
            >
              Delete Conversation
            </Button>
          </>
        )}
      </Drawer>

      {/* Media Viewer Modal */}
      <Modal
        title={`Shared ${
          mediaType === "images"
            ? "Photos"
            : mediaType === "videos"
            ? "Videos"
            : "Documents"
        }`}
        visible={showMediaViewer}
        onCancel={() => setShowMediaViewer(false)}
        footer={null}
        width="80%"
      >
        <div className="media-grid">
          {messages
            .filter((msg) => {
              if (mediaType === "images") return msg.image?.url;
              if (mediaType === "videos") return msg.video?.url;
              if (mediaType === "documents") return msg.document?.url;
              return false;
            })
            .map((msg) => (
              <div key={msg._id} className="media-item">
                {mediaType === "images" ? (
                  <img src={msg.image.url} alt="Shared content" />
                ) : mediaType === "videos" ? (
                  <video controls>
                    <source src={msg.video.url} type="video/mp4" />
                  </video>
                ) : (
                  <div className="document-item">
                    {msg.document?.type.includes("pdf") ? (
                      <FilePdfOutlined style={{ fontSize: 24 }} />
                    ) : msg.document?.type.includes("word") ? (
                      <FileWordOutlined style={{ fontSize: 24 }} />
                    ) : msg.document?.type.includes("excel") ? (
                      <FileExcelOutlined style={{ fontSize: 24 }} />
                    ) : msg.document?.type.includes("powerpoint") ? (
                      <FilePptOutlined style={{ fontSize: 24 }} />
                    ) : (
                      <FileOutlined style={{ fontSize: 24 }} />
                    )}
                    <Text>{msg.document.name}</Text>
                    <Text type="secondary">
                      {formatFileSize(msg.document.size)}
                    </Text>
                  </div>
                )}
              </div>
            ))}
        </div>
      </Modal>

      {/* Call Modal */}
      {callStatus && (
        <Modal
          visible={callStatus.active}
          onCancel={endCall}
          footer={null}
          centered
          className="call-modal"
          closable={false}
        >
          <div className="call-content">
            <Avatar
              src={callStatus.with.avatar}
              size={100}
              style={{ marginBottom: 24 }}
            />
            <Title level={3}>
              {callStatus.outgoing ? "Calling" : "Incoming call"}
            </Title>
            <Text>{callStatus.with.name}</Text>

            <div className="call-actions">
              {callStatus.outgoing ? (
                <Button
                  type="primary"
                  danger
                  shape="circle"
                  size="large"
                  icon={<PhoneOutlined />}
                  onClick={endCall}
                />
              ) : (
                <>
                  <Button
                    type="primary"
                    danger
                    shape="circle"
                    size="large"
                    icon={<PhoneOutlined />}
                    onClick={endCall}
                  />
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    icon={<PhoneOutlined />}
                    onClick={answerCall}
                  />
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Location Sharing Modal */}
      <Modal
        title="Share Live Location"
        visible={showLocationModal}
        onCancel={() => setShowLocationModal(false)}
        onOk={handleShareLocation}
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Form.Item label="Duration (minutes)">
            <Select value={locationDuration} onChange={setLocationDuration}>
              <Option value={15}>15 minutes</Option>
              <Option value={30}>30 minutes</Option>
              <Option value={60}>1 hour</Option>
              <Option value={180}>3 hours</Option>
              <Option value={360}>6 hours</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Contacts Sharing Modal */}
      <Modal
        title="Share Contacts"
        visible={showContactsModal}
        onCancel={() => setShowContactsModal(false)}
        onOk={handleShareContacts}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Select Contacts">
            <Select
              mode="multiple"
              placeholder="Select contacts to share"
              value={selectedContacts}
              onChange={setSelectedContacts}
              optionLabelProp="label"
              style={{ width: "100%" }}
            >
              {contacts.map((contact) => (
                <Option
                  key={contact.id}
                  value={contact.id}
                  label={contact.name}
                >
                  <Space>
                    <Avatar src={contact.avatar} size="small" />
                    {contact.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Sharing Modal */}
      <Modal
        title="Share Document"
        visible={showDocumentModal}
        onCancel={() => setShowDocumentModal(false)}
        onOk={handleDocumentUpload}
      >
        <input
          type="file"
          ref={documentInputRef}
          style={{ display: "none" }}
          onChange={(e) => setDocumentFile(e.target.files[0])}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        />
        <Button
          type="primary"
          onClick={() => documentInputRef.current?.click()}
          icon={<UploadOutlined />}
        >
          Select Document
        </Button>
        {documentFile && (
          <div style={{ marginTop: 16 }}>
            <Text strong>Selected file:</Text>
            <div>
              <FileOutlined /> {documentFile.name} (
              {formatFileSize(documentFile.size)})
            </div>
          </div>
        )}
      </Modal>

      {/* Poll Creation Modal */}
      <Modal
        title="Create Poll"
        visible={showPollModal}
        onCancel={() => setShowPollModal(false)}
        onOk={handleCreatePoll}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Question" required>
            <Input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              placeholder="Ask a question..."
            />
          </Form.Item>
          <Form.Item label="Options" required>
            {pollOptions.map((option, index) => (
              <Input
                key={index}
                value={option}
                onChange={(e) => {
                  const newOptions = [...pollOptions];
                  newOptions[index] = e.target.value;
                  setPollOptions(newOptions);
                }}
                placeholder={`Option ${index + 1}`}
                style={{ marginBottom: 8 }}
              />
            ))}
            <Button
              type="dashed"
              onClick={() => setPollOptions([...pollOptions, ""])}
              block
            >
              Add Option
            </Button>
          </Form.Item>
          <Form.Item>
            <Checkbox
              checked={isMultiSelect}
              onChange={(e) => setIsMultiSelect(e.target.checked)}
            >
              Allow multiple answers
            </Checkbox>
          </Form.Item>
          <Form.Item label="Duration (optional)">
            <Select
              value={pollDuration}
              onChange={setPollDuration}
              placeholder="No time limit"
              allowClear
            >
              <Option value={5}>5 minutes</Option>
              <Option value={15}>15 minutes</Option>
              <Option value={60}>1 hour</Option>
              <Option value={1440}>1 day</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      {/* Event Creation Modal */}
      <Modal
        title="Create Event"
        visible={showEventModal}
        onCancel={() => setShowEventModal(false)}
        onOk={handleCreateEvent}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="Title" required>
            <Input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Event title"
            />
          </Form.Item>
          <Form.Item label="Description">
            <TextArea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Event description"
              rows={3}
            />
          </Form.Item>
          <Form.Item label="Date" required>
            <DatePicker
              value={eventDate}
              onChange={setEventDate}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="Time">
            <TimePicker
              value={eventTime}
              onChange={setEventTime}
              format="HH:mm"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="Location">
            <Input
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Event location"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Hidden file input for media uploads */}
      <input
        type="file"
        ref={documentInputRef}
        style={{ display: "none" }}
        accept="image/*,video/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;

          if (file.type.startsWith("image/")) {
            handleSendImage(file);
          } else if (file.type.startsWith("video/")) {
            handleSendVideo(file);
          }
        }}
      />
    </div>
  );
};

export default ProfessionalChat;
