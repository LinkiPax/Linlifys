// import React, { useState, useEffect, useRef, useCallback } from "react";
// import {
//   Avatar,
//   Badge,
//   Button,
//   Divider,
//   Drawer,
//   Dropdown,
//   Input,
//   List,
//   Menu,
//   Modal,
//   Space,
//   Tag,
//   Tooltip,
//   Typography,
//   message as antMessage,
//   Spin,
// } from "antd";
// import {
//   AudioOutlined,
//   EllipsisOutlined,
//   PaperClipOutlined,
//   PhoneOutlined,
//   SearchOutlined,
//   SendOutlined,
//   SmileOutlined,
//   VideoCameraOutlined,
//   MenuOutlined,
//   CloseOutlined,
//   CheckOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   InfoCircleOutlined,
//   StarOutlined,
//   PictureOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons";
// import { useParams } from "react-router-dom";
// import { io } from "socket.io-client";
// import WaveSurfer from "wavesurfer.js";
// import EmojiPicker from "emoji-picker-react";
// import axios from "axios";
// import Peer from "peerjs";
// import "./ProfessionalChat.css";

// const { Text, Title } = Typography;

// const ProfessionalChat = () => {
//   // State management
//   const [messages, setMessages] = useState([]);
//   const [inputMessage, setInputMessage] = useState("");
//   const [currentUser, setCurrentUser] = useState({
//     id: localStorage.getItem("userId"),
//     name: localStorage.getItem("username") || "User",
//   });
//   const [activeContact, setActiveContact] = useState(null);
//   const [contacts, setContacts] = useState([]);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [isRecording, setIsRecording] = useState(false);
//   const [audioUrl, setAudioUrl] = useState("");
//   const [showDrawer, setShowDrawer] = useState(false);
//   const [callStatus, setCallStatus] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [pinnedMessages, setPinnedMessages] = useState([]);
//   const [showMediaViewer, setShowMediaViewer] = useState(false);
//   const [mediaType, setMediaType] = useState("images");
//   const [replyTo, setReplyTo] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [unreadCounts, setUnreadCounts] = useState({});
//   const [isInCall, setIsInCall] = useState(false);
//   const [peerInstance, setPeerInstance] = useState(null);
//   const [currentCall, setCurrentCall] = useState(null);

//   // Refs
//   const messagesEndRef = useRef(null);
//   const waveformRef = useRef(null);
//   const audioRecorderRef = useRef(null);
//   const { contactId } = useParams();
//   const typingTimeoutRef = useRef(null);
//   const socketRef = useRef(null);
//   const remoteAudioRef = useRef(null);

//   // Initialize socket and peer connections
//   useEffect(() => {
//     // Initialize socket connection
//     const socket = io("http://localhost:5000", { withCredentials: true });
//     socketRef.current = socket;

//     // Initialize PeerJS
//     const peer = new Peer(currentUser.id, {
//       host: "localhost",
//       port: 9000,
//       path: "/",
//       secure: false,
//     });

//     peer.on("open", (id) => {
//       console.log("Peer connection established with ID:", id);
//     });

//     // Handle incoming calls
//     peer.on("call", (call) => {
//       console.log("Incoming call", call);
//       setCallStatus({
//         type: "audio",
//         outgoing: false,
//         active: true,
//         with: activeContact,
//       });
//       setCurrentCall(call);
//     });

//     setPeerInstance(peer);

//     // Create audio element for remote stream
//     const audio = document.createElement("audio");
//     remoteAudioRef.current = audio;
//     document.body.appendChild(audio);

//     return () => {
//       socket.disconnect();
//       peer.destroy();
//       if (remoteAudioRef.current) {
//         document.body.removeChild(remoteAudioRef.current);
//       }
//     };
//   }, [currentUser.id]);

//   // Handle call status changes
//   useEffect(() => {
//     if (!socketRef.current) return;

//     const handleIncomingCall = (callData) => {
//       setCallStatus({
//         type: "audio",
//         outgoing: false,
//         active: true,
//         with: contacts.find((c) => c.id === callData.senderId) || {
//           id: callData.senderId,
//           name: callData.senderName,
//         },
//       });
//     };

//     socketRef.current.on("incoming_call", handleIncomingCall);

//     return () => {
//       socketRef.current.off("incoming_call", handleIncomingCall);
//     };
//   }, [contacts]);

//   // Initialize socket listeners for messages
//   useEffect(() => {
//     if (!socketRef.current || !currentUser.id) return;

//     // Join user's room
//     socketRef.current.emit("join", currentUser.id);

//     // Listen for new messages
//     const handleNewMessage = (newMessage) => {
//       if (
//         !newMessage.deletedFor?.includes(currentUser.id) &&
//         (newMessage.sender === activeContact?.id ||
//           newMessage.receiver === activeContact?.id)
//       ) {
//         setMessages((prev) => [...prev, newMessage]);
//       }

//       // Update unread counts
//       if (newMessage.receiver === currentUser.id) {
//         setUnreadCounts((prev) => ({
//           ...prev,
//           [newMessage.sender]: (prev[newMessage.sender] || 0) + 1,
//         }));
//       }
//     };

//     socketRef.current.on("new_message", handleNewMessage);

//     return () => {
//       socketRef.current.off("new_message", handleNewMessage);
//     };
//   }, [currentUser.id, activeContact]);

//   // Fetch current user data
//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const response = await axios.get(
//           `http://localhost:5000/user/${currentUser.id}`
//         );
//         setCurrentUser((prev) => ({
//           ...prev,
//           id: response.data._id,
//           name: response.data.name || response.data.username,
//           avatar: response.data.profilePicture,
//           status: response.data.isOnline ? "online" : "offline",
//           bio: response.data.bio,
//           company: response.data.company,
//           jobTitle: response.data.jobTitle,
//         }));
//       } catch (error) {
//         antMessage.error("Failed to fetch user data");
//       }
//     };

//     if (currentUser.id) {
//       fetchUserData();
//     }
//   }, [currentUser.id]);

//   // Fetch contacts
//   useEffect(() => {
//     const fetchContacts = async () => {
//       try {
//         const userResponse = await axios.get(
//           `http://localhost:5000/user/${currentUser.id}`
//         );
//         const connectionIds = [...new Set(userResponse.data.connections)];

//         const contactsWithDetails = await Promise.all(
//           connectionIds.map(async (connId) => {
//             if (connId === currentUser.id) return null;

//             try {
//               const contactResponse = await axios.get(
//                 `http://localhost:5000/user/${connId}`
//               );
//               const unreadResponse = await axios.get(
//                 `http://localhost:5000/api/messages/unread-count?userId=${currentUser.id}&targetUserId=${connId}`
//               );

//               return {
//                 id: contactResponse.data._id,
//                 name:
//                   contactResponse.data.name || contactResponse.data.username,
//                 avatar: contactResponse.data.profilePicture,
//                 status: "offline", // Will be updated by socket
//                 unread: unreadResponse.data.count,
//               };
//             } catch (error) {
//               console.error(`Error fetching contact ${connId}:`, error);
//               return null;
//             }
//           })
//         );

//         setContacts(contactsWithDetails.filter((contact) => contact !== null));

//         // Set unread counts
//         const counts = {};
//         contactsWithDetails.forEach((contact) => {
//           if (contact) counts[contact.id] = contact.unread;
//         });
//         setUnreadCounts(counts);
//       } catch (error) {
//         antMessage.error("Failed to fetch contacts");
//       }
//     };

//     if (currentUser.id) {
//       fetchContacts();
//     }
//   }, [currentUser.id]);

//   // Set active contact when contactId changes
//   useEffect(() => {
//     if (contactId && contacts.length > 0) {
//       const contact = contacts.find((c) => c.id === contactId);
//       if (contact) {
//         setActiveContact(contact);
//         markMessagesAsRead(contact.id);
//       }
//     }
//   }, [contactId, contacts]);

//   // Fetch messages when active contact changes
//   useEffect(() => {
//     const fetchMessages = async () => {
//       if (!activeContact || !currentUser.id) return;

//       setLoading(true);
//       try {
//         const response = await axios.get("http://localhost:5000/api/messages", {
//           params: {
//             userId: currentUser.id,
//             targetUserId: activeContact.id,
//           },
//         });

//         const filteredMessages = response.data.filter(
//           (msg) => !msg.deletedFor.includes(currentUser.id)
//         );

//         setMessages(filteredMessages);
//       } catch (error) {
//         antMessage.error("Failed to fetch messages");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchMessages();
//   }, [activeContact, currentUser.id]);

//   // Scroll to bottom when messages change
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const markMessagesAsRead = async (contactId) => {
//     try {
//       await axios.patch("http://localhost:5000/api/messages/mark-as-read", {
//         userId: currentUser.id,
//         targetUserId: contactId,
//       });

//       setUnreadCounts((prev) => ({
//         ...prev,
//         [contactId]: 0,
//       }));
//     } catch (error) {
//       console.error("Error marking messages as read:", error);
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!inputMessage.trim() || !activeContact) return;

//     const tempId = Date.now().toString();
//     const newMessage = {
//       _id: tempId,
//       sender: currentUser.id,
//       receiver: activeContact.id,
//       content: inputMessage,
//       replyTo: replyTo?._id || null,
//       isRead: false,
//       createdAt: new Date(),
//       replyToMessage: replyTo,
//       isOptimistic: true,
//     };

//     // Optimistic update
//     setMessages((prev) => [...prev, newMessage]);
//     setInputMessage("");
//     setReplyTo(null);
//     setShowEmojiPicker(false);

//     try {
//       // Emit via socket
//       socketRef.current.emit("send_message", {
//         senderId: currentUser.id,
//         receiverId: activeContact.id,
//         content: inputMessage,
//         replyTo: replyTo?._id || null,
//       });
//     } catch (error) {
//       antMessage.error("Failed to send message");
//       setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
//     }
//   };

//   // Audio calling functions
//   const initiateCall = async (isVideo) => {
//     if (!peerInstance || !activeContact) return;

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const call = peerInstance.call(activeContact.id, stream);

//       setCurrentCall(call);
//       setIsInCall(true);

//       setCallStatus({
//         type: isVideo ? "video" : "audio",
//         outgoing: true,
//         active: true,
//         with: activeContact,
//       });

//       call.on("stream", (remoteStream) => {
//         if (remoteAudioRef.current) {
//           remoteAudioRef.current.srcObject = remoteStream;
//           remoteAudioRef.current
//             .play()
//             .catch((e) => console.error("Error playing audio:", e));
//         }
//       });

//       call.on("close", () => {
//         setIsInCall(false);
//         setCallStatus(null);
//       });

//       // Notify the other user via socket
//       socketRef.current.emit("call_initiated", {
//         senderId: currentUser.id,
//         senderName: currentUser.name,
//         receiverId: activeContact.id,
//       });
//     } catch (error) {
//       console.error("Error initiating call:", error);
//       antMessage.error(
//         "Failed to start call. Please check your microphone permissions."
//       );
//     }
//   };

//   const answerCall = async () => {
//     if (!currentCall) return;

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       currentCall.answer(stream);
//       setIsInCall(true);

//       currentCall.on("stream", (remoteStream) => {
//         if (remoteAudioRef.current) {
//           remoteAudioRef.current.srcObject = remoteStream;
//           remoteAudioRef.current
//             .play()
//             .catch((e) => console.error("Error playing audio:", e));
//         }
//       });

//       setCallStatus((prev) => ({
//         ...prev,
//         outgoing: false,
//         active: true,
//       }));
//     } catch (error) {
//       console.error("Error answering call:", error);
//       antMessage.error(
//         "Failed to answer call. Please check your microphone permissions."
//       );
//     }
//   };

//   const endCall = () => {
//     if (currentCall) {
//       currentCall.close();
//     }
//     setIsInCall(false);
//     setCallStatus(null);
//     setCurrentCall(null);

//     if (remoteAudioRef.current) {
//       remoteAudioRef.current.srcObject = null;
//     }
//   };

//   // Voice message functions
//   const startRecording = () => {
//     if (isRecording) {
//       stopRecording();
//       return;
//     }

//     navigator.mediaDevices
//       .getUserMedia({ audio: true })
//       .then((stream) => {
//         const mediaRecorder = new MediaRecorder(stream);
//         audioRecorderRef.current = mediaRecorder;
//         const audioChunks = [];

//         mediaRecorder.ondataavailable = (e) => {
//           audioChunks.push(e.data);
//         };

//         mediaRecorder.onstop = () => {
//           const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
//           const audioUrl = URL.createObjectURL(audioBlob);
//           setAudioUrl(audioUrl);

//           // Initialize WaveSurfer
//           if (waveformRef.current) {
//             const wavesurfer = WaveSurfer.create({
//               container: waveformRef.current,
//               waveColor: "#1890ff",
//               progressColor: "#096dd9",
//               cursorColor: "transparent",
//               barWidth: 2,
//               barRadius: 3,
//               barGap: 2,
//               height: 40,
//               responsive: true,
//             });
//             wavesurfer.load(audioUrl);
//           }
//         };

//         mediaRecorder.start();
//         setIsRecording(true);

//         // Auto-stop after 60 seconds
//         setTimeout(() => {
//           if (isRecording) {
//             mediaRecorder.stop();
//             setIsRecording(false);
//           }
//         }, 60000);
//       })
//       .catch((error) => {
//         console.error("Error accessing microphone:", error);
//         antMessage.error("Microphone access denied");
//       });
//   };

//   const stopRecording = () => {
//     if (audioRecorderRef.current) {
//       audioRecorderRef.current.stop();
//       setIsRecording(false);
//       audioRecorderRef.current.stream
//         .getTracks()
//         .forEach((track) => track.stop());
//     }
//   };

//   const sendVoiceMessage = async () => {
//     if (!audioUrl || !activeContact) return;

//     try {
//       // Convert audio URL to blob
//       const blob = await fetch(audioUrl).then((r) => r.blob());
//       const formData = new FormData();
//       formData.append("audio", blob, "recording.wav");

//       // Upload audio file
//       const uploadResponse = await axios.post(
//         "http://localhost:5000/api/upload-audio",
//         formData,
//         { headers: { "Content-Type": "multipart/form-data" } }
//       );

//       // Send via socket
//       socketRef.current.emit("send_message", {
//         senderId: currentUser.id,
//         receiverId: activeContact.id,
//         audioURL: uploadResponse.data.url,
//         isAudioMessage: true,
//         replyTo: replyTo?._id || null,
//       });

//       setAudioUrl("");
//       setReplyTo(null);
//     } catch (error) {
//       antMessage.error("Failed to send voice message");
//     }
//   };

//   const renderMessageStatus = (isRead) => {
//     return isRead ? (
//       <CheckCircleOutlined style={{ color: "#1890ff", fontSize: 12 }} />
//     ) : (
//       <CheckOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
//     );
//   };

//   const pinMessage = (message) => {
//     setPinnedMessages((prev) => [...prev, message]);
//   };

//   const deleteMessage = async (messageId) => {
//     try {
//       await axios.patch(`http://localhost:5000/api/messages/${messageId}`, {
//         userId: currentUser.id,
//       });

//       // Update local state
//       setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
//       antMessage.success("Message deleted");
//     } catch (error) {
//       antMessage.error("Failed to delete message");
//     }
//   };

//   const searchMessages = async () => {
//     if (!searchQuery.trim() || !activeContact) return;

//     try {
//       const response = await axios.get(
//         "http://localhost:5000/api/messages/search",
//         {
//           params: {
//             userId: currentUser.id,
//             targetUserId: activeContact.id,
//             searchTerm: searchQuery,
//           },
//         }
//       );

//       // Filter out messages deleted for current user
//       const filteredMessages = response.data.filter(
//         (msg) => !msg.deletedFor.includes(currentUser.id)
//       );

//       setMessages(filteredMessages);
//     } catch (error) {
//       antMessage.error("Failed to search messages");
//     }
//   };

//   const filteredContacts = contacts.filter((contact) =>
//     contact.name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//     <div className="professional-chat-container">
//       {/* Sidebar */}
//       <div className="chat-sidebar">
//         <div className="sidebar-header">
//           <div className="user-profile">
//             <Badge
//               dot
//               status={currentUser.status === "online" ? "success" : "default"}
//               offset={[-5, 40]}
//             >
//               <Avatar src={currentUser.avatar} size="large" />
//             </Badge>
//             <div className="user-info">
//               <Text strong>{currentUser.name}</Text>
//               <Text type="secondary" style={{ fontSize: 12 }}>
//                 {currentUser.status === "online" ? "Online" : "Offline"}
//               </Text>
//             </div>
//           </div>
//           <Button
//             type="text"
//             icon={<MenuOutlined />}
//             onClick={() => setShowDrawer(true)}
//           />
//         </div>

//         <div className="sidebar-search">
//           <Input
//             placeholder="Search contacts"
//             prefix={<SearchOutlined />}
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//         </div>

//         <div className="contacts-list">
//           {filteredContacts.map((contact) => (
//             <div
//               key={contact.id}
//               className={`contact-item ${
//                 activeContact?.id === contact.id ? "active" : ""
//               }`}
//               onClick={() => {
//                 setActiveContact(contact);
//                 markMessagesAsRead(contact.id);
//               }}
//             >
//               <Badge
//                 dot
//                 status={contact.status === "online" ? "success" : "default"}
//                 offset={[-5, 30]}
//               >
//                 <Avatar src={contact.avatar} />
//               </Badge>
//               <div className="contact-info">
//                 <div className="contact-name">
//                   <Text strong>{contact.name}</Text>
//                   {unreadCounts[contact.id] > 0 && (
//                     <span className="unread-badge">
//                       {unreadCounts[contact.id]}
//                     </span>
//                   )}
//                 </div>
//                 <Text
//                   type="secondary"
//                   className="contact-status"
//                   style={{
//                     color: contact.status === "online" ? "#52c41a" : undefined,
//                   }}
//                 >
//                   {contact.status === "online" ? "Online" : "Offline"}
//                 </Text>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Chat Area */}
//       <div className="chat-main">
//         {activeContact ? (
//           <>
//             <div className="chat-header">
//               <div className="contact-info">
//                 <Badge
//                   dot
//                   status={
//                     activeContact.status === "online" ? "success" : "default"
//                   }
//                   offset={[-5, 30]}
//                 >
//                   <Avatar src={activeContact.avatar} size="default" />
//                 </Badge>
//                 <div>
//                   <Text strong>{activeContact.name}</Text>
//                   <Text type="secondary" style={{ fontSize: 12 }}>
//                     {activeContact.status === "online" ? "Online" : "Offline"}
//                   </Text>
//                 </div>
//               </div>

//               <Space size="middle">
//                 <Tooltip title="Voice call">
//                   <Button
//                     type="text"
//                     shape="circle"
//                     icon={<PhoneOutlined />}
//                     onClick={() => initiateCall(false)}
//                   />
//                 </Tooltip>
//                 <Tooltip title="Video call">
//                   <Button
//                     type="text"
//                     shape="circle"
//                     icon={<VideoCameraOutlined />}
//                     onClick={() => initiateCall(true)}
//                   />
//                 </Tooltip>
//                 <Tooltip title="Contact info">
//                   <Button
//                     type="text"
//                     shape="circle"
//                     icon={<InfoCircleOutlined />}
//                     onClick={() => setShowDrawer(true)}
//                   />
//                 </Tooltip>
//               </Space>
//             </div>

//             <Divider style={{ margin: 0 }} />

//             <div className="messages-container">
//               {loading ? (
//                 <div className="empty-messages">
//                   <Spin size="large" />
//                 </div>
//               ) : messages.length > 0 ? (
//                 <>
//                   {messages.map((msg) => (
//                     <div
//                       key={msg._id}
//                       className={`message ${
//                         msg.sender === currentUser.id ? "sent" : "received"
//                       }`}
//                     >
//                       <Dropdown
//                         overlay={
//                           <Menu>
//                             <Menu.Item
//                               icon={<StarOutlined />}
//                               onClick={() => pinMessage(msg)}
//                             >
//                               Pin message
//                             </Menu.Item>
//                             <Menu.Item
//                               icon={<SendOutlined />}
//                               onClick={() => setReplyTo(msg)}
//                             >
//                               Reply
//                             </Menu.Item>
//                             <Menu.Item
//                               icon={<CloseOutlined />}
//                               danger
//                               onClick={() => deleteMessage(msg._id)}
//                             >
//                               Delete
//                             </Menu.Item>
//                           </Menu>
//                         }
//                         trigger={["contextMenu"]}
//                       >
//                         <div className="message-content">
//                           {msg.replyTo && (
//                             <div className="message-reply">
//                               <Text type="secondary">
//                                 Replying to{" "}
//                                 {msg.replyTo.sender === currentUser.id
//                                   ? "yourself"
//                                   : activeContact.name}
//                               </Text>
//                               <div className="reply-content">
//                                 {msg.replyTo.content || "Audio message"}
//                               </div>
//                             </div>
//                           )}

//                           {msg.content && !msg.isAudioMessage && (
//                             <div className="message-text">{msg.content}</div>
//                           )}

//                           {msg.audioURL && (
//                             <div className="audio-message">
//                               <audio controls src={msg.audioURL} />
//                               <div ref={waveformRef} className="waveform" />
//                             </div>
//                           )}

//                           <div className="message-meta">
//                             <Text type="secondary" className="timestamp">
//                               {new Date(msg.createdAt).toLocaleTimeString([], {
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                               })}
//                             </Text>
//                             {msg.sender === currentUser.id && (
//                               <span className="status-icon">
//                                 {renderMessageStatus(msg.isRead)}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                       </Dropdown>
//                     </div>
//                   ))}
//                   <div ref={messagesEndRef} />
//                 </>
//               ) : (
//                 <div className="empty-messages">
//                   <div className="empty-content">
//                     <Avatar
//                       src={activeContact.avatar}
//                       size={64}
//                       style={{ marginBottom: 16 }}
//                     />
//                     <Title level={4}>No messages yet</Title>
//                     <Text type="secondary">
//                       Start your conversation with {activeContact.name}
//                     </Text>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Reply preview */}
//             {replyTo && (
//               <div className="reply-preview">
//                 <div className="reply-content">
//                   <Text strong>
//                     Replying to{" "}
//                     {replyTo.sender === currentUser.id
//                       ? "yourself"
//                       : activeContact.name}
//                   </Text>
//                   <Text ellipsis>{replyTo.content || "Audio message"}</Text>
//                 </div>
//                 <Button
//                   type="text"
//                   icon={<CloseOutlined />}
//                   onClick={() => setReplyTo(null)}
//                 />
//               </div>
//             )}

//             {/* Message input */}
//             <div className="message-input-container">
//               {audioUrl ? (
//                 <div className="voice-message-preview">
//                   <div className="waveform-container" ref={waveformRef} />
//                   <Space>
//                     <Button
//                       type="text"
//                       danger
//                       icon={<CloseOutlined />}
//                       onClick={() => setAudioUrl("")}
//                     />
//                     <Button
//                       type="primary"
//                       icon={<SendOutlined />}
//                       onClick={sendVoiceMessage}
//                     />
//                   </Space>
//                 </div>
//               ) : (
//                 <>
//                   <Button
//                     type="text"
//                     icon={<PaperClipOutlined />}
//                     className="input-action-btn"
//                   />

//                   <Input.TextArea
//                     value={inputMessage}
//                     onChange={(e) => {
//                       setInputMessage(e.target.value);
//                     }}
//                     placeholder="Type a message..."
//                     autoSize={{ minRows: 1, maxRows: 4 }}
//                     onPressEnter={(e) => {
//                       if (!e.shiftKey) {
//                         e.preventDefault();
//                         handleSendMessage();
//                       }
//                     }}
//                   />

//                   <Space>
//                     <Button
//                       type="text"
//                       icon={<SmileOutlined />}
//                       className="input-action-btn"
//                       onClick={() => setShowEmojiPicker(!showEmojiPicker)}
//                     />
//                     {inputMessage ? (
//                       <Button
//                         type="primary"
//                         icon={<SendOutlined />}
//                         onClick={handleSendMessage}
//                       />
//                     ) : (
//                       <Button
//                         type="text"
//                         icon={<AudioOutlined />}
//                         className={`input-action-btn ${
//                           isRecording ? "recording" : ""
//                         }`}
//                         onMouseDown={startRecording}
//                         onMouseUp={stopRecording}
//                         onTouchStart={startRecording}
//                         onTouchEnd={stopRecording}
//                       />
//                     )}
//                   </Space>

//                   {showEmojiPicker && (
//                     <div className="emoji-picker">
//                       <EmojiPicker
//                         onEmojiClick={(emoji) => {
//                           setInputMessage((prev) => prev + emoji.emoji);
//                           setShowEmojiPicker(false);
//                         }}
//                         width="100%"
//                         height={300}
//                       />
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//           </>
//         ) : (
//           <div className="no-contact-selected">
//             <div className="empty-content">
//               <Title level={3}>Select a conversation</Title>
//               <Text type="secondary">
//                 Choose from your existing conversations or start a new one
//               </Text>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Right Drawer */}
//       <Drawer
//         title="Conversation Info"
//         placement="right"
//         width={350}
//         onClose={() => setShowDrawer(false)}
//         visible={showDrawer}
//         className="info-drawer"
//       >
//         {activeContact && (
//           <>
//             <div className="drawer-header">
//               <Avatar src={activeContact.avatar} size={64} />
//               <Title level={4} style={{ marginTop: 16 }}>
//                 {activeContact.name}
//               </Title>
//               <Tag
//                 color={
//                   activeContact.status === "online" ? "success" : "default"
//                 }
//               >
//                 {activeContact.status === "online" ? "Online" : "Offline"}
//               </Tag>
//             </div>

//             <Divider />

//             <Title level={5}>Pinned Messages</Title>
//             {pinnedMessages.length > 0 ? (
//               <List
//                 dataSource={pinnedMessages}
//                 renderItem={(msg) => (
//                   <List.Item className="pinned-message">
//                     <Text type="secondary">
//                       {msg.sender === currentUser.id
//                         ? "You"
//                         : activeContact.name}
//                     </Text>
//                     <Text>{msg.content || "Audio message"}</Text>
//                   </List.Item>
//                 )}
//               />
//             ) : (
//               <Text type="secondary">No pinned messages</Text>
//             )}

//             <Divider />

//             <Title level={5}>Shared Media</Title>
//             <Space>
//               <Button
//                 type="text"
//                 icon={<PictureOutlined />}
//                 onClick={() => {
//                   setMediaType("images");
//                   setShowMediaViewer(true);
//                 }}
//               >
//                 Photos
//               </Button>
//               <Button
//                 type="text"
//                 icon={<VideoCameraOutlined />}
//                 onClick={() => {
//                   setMediaType("videos");
//                   setShowMediaViewer(true);
//                 }}
//               >
//                 Videos
//               </Button>
//             </Space>

//             <Divider />

//             <Button
//               type="text"
//               danger
//               icon={<DeleteOutlined />}
//               onClick={() => {
//                 antMessage.warning("This will delete the entire conversation");
//               }}
//             >
//               Delete Conversation
//             </Button>
//           </>
//         )}
//       </Drawer>

//       {/* Media Viewer Modal */}
//       <Modal
//         title={`Shared ${mediaType === "images" ? "Photos" : "Videos"}`}
//         visible={showMediaViewer}
//         onCancel={() => setShowMediaViewer(false)}
//         footer={null}
//         width="80%"
//       >
//         <div className="media-grid">
//           {messages
//             .filter(
//               (msg) =>
//                 (mediaType === "images" && msg.imageUrl) ||
//                 (mediaType === "videos" && msg.videoUrl)
//             )
//             .map((msg) => (
//               <div key={msg._id} className="media-item">
//                 {mediaType === "images" ? (
//                   <img src={msg.imageUrl} alt="Shared content" />
//                 ) : (
//                   <video controls>
//                     <source src={msg.videoUrl} type="video/mp4" />
//                   </video>
//                 )}
//               </div>
//             ))}
//         </div>
//       </Modal>

//       {/* Call Modal */}
//       {callStatus && (
//         <Modal
//           visible={callStatus.active}
//           onCancel={endCall}
//           footer={null}
//           centered
//           className="call-modal"
//           closable={false}
//         >
//           <div className="call-content">
//             <Avatar
//               src={callStatus.with.avatar}
//               size={100}
//               style={{ marginBottom: 24 }}
//             />
//             <Title level={3}>
//               {callStatus.outgoing ? "Calling" : "Incoming call"}
//             </Title>
//             <Text>{callStatus.with.name}</Text>

//             <div className="call-actions">
//               {callStatus.outgoing ? (
//                 <Button
//                   type="primary"
//                   danger
//                   shape="circle"
//                   size="large"
//                   icon={<PhoneOutlined />}
//                   onClick={endCall}
//                 />
//               ) : (
//                 <>
//                   <Button
//                     type="primary"
//                     danger
//                     shape="circle"
//                     size="large"
//                     icon={<PhoneOutlined />}
//                     onClick={endCall}
//                   />
//                   <Button
//                     type="primary"
//                     shape="circle"
//                     size="large"
//                     icon={<PhoneOutlined />}
//                     onClick={answerCall}
//                   />
//                 </>
//               )}
//             </div>
//           </div>
//         </Modal>
//       )}
//     </div>
//   );
// };

// export default ProfessionalChat;
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
  Upload,
} from "antd";
import {
  AudioOutlined,
  EllipsisOutlined,
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
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import WaveSurfer from "wavesurfer.js";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import Peer from "peerjs";
import "./ProfessionalChat.css";

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
  const [audioUrl, setAudioUrl] = useState("");
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
  const [peerInstance, setPeerInstance] = useState(null);
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

  // Refs
  const messagesEndRef = useRef(null);
  const waveformRef = useRef(null);
  const audioRecorderRef = useRef(null);
  const { contactId } = useParams();
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const documentInputRef = useRef(null);

  // Initialize socket and peer connections
  useEffect(() => {
    const socket = io("http://localhost:5000", { withCredentials: true });
    socketRef.current = socket;

    const peer = new Peer(currentUser.id, {
      host: "localhost",
      port: 9000,
      path: "/",
      secure: false,
    });

    peer.on("open", (id) => {
      console.log("Peer connection established with ID:", id);
    });

    peer.on("call", (call) => {
      setCallStatus({
        type: "audio",
        outgoing: false,
        active: true,
        with: activeContact,
      });
      setCurrentCall(call);
    });

    setPeerInstance(peer);

    const audio = document.createElement("audio");
    remoteAudioRef.current = audio;
    document.body.appendChild(audio);

    return () => {
      socket.disconnect();
      peer.destroy();
      if (remoteAudioRef.current) {
        document.body.removeChild(remoteAudioRef.current);
      }
    };
  }, [currentUser.id]);

  // Socket listeners
  useEffect(() => {
    if (!socketRef.current) return;

    const handleIncomingCall = (callData) => {
      setCallStatus({
        type: "audio",
        outgoing: false,
        active: true,
        with: contacts.find((c) => c.id === callData.senderId) || {
          id: callData.senderId,
          name: callData.senderName,
        },
      });
    };

    socketRef.current.on("incoming_call", handleIncomingCall);

    return () => {
      socketRef.current.off("incoming_call", handleIncomingCall);
    };
  }, [contacts]);

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

  // Fetch data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/user/${currentUser.id}`
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
        antMessage.error("Failed to fetch user data");
      }
    };

    if (currentUser.id) {
      fetchUserData();
    }
  }, [currentUser.id]);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const userResponse = await axios.get(
          `http://localhost:5000/user/${currentUser.id}`
        );
        const connectionIds = [...new Set(userResponse.data.connections)];

        const contactsWithDetails = await Promise.all(
          connectionIds.map(async (connId) => {
            if (connId === currentUser.id) return null;

            try {
              const contactResponse = await axios.get(
                `http://localhost:5000/user/${connId}`
              );
              const unreadResponse = await axios.get(
                `http://localhost:5000/api/messages/unread-count?userId=${currentUser.id}&targetUserId=${connId}`
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
        antMessage.error("Failed to fetch contacts");
      }
    };

    if (currentUser.id) {
      fetchContacts();
    }
  }, [currentUser.id]);

  useEffect(() => {
    if (contactId && contacts.length > 0) {
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        setActiveContact(contact);
        markMessagesAsRead(contact.id);
      }
    }
  }, [contactId, contacts]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeContact || !currentUser.id) return;

      setLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/api/messages", {
          params: {
            userId: currentUser.id,
            targetUserId: activeContact.id,
          },
        });

        const filteredMessages = response.data.filter(
          (msg) => !msg.deletedFor.includes(currentUser.id)
        );

        setMessages(filteredMessages);
      } catch (error) {
        antMessage.error("Failed to fetch messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [activeContact, currentUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper functions
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const markMessagesAsRead = async (contactId) => {
    try {
      await axios.patch("http://localhost:5000/api/messages/mark-as-read", {
        userId: currentUser.id,
        targetUserId: contactId,
      });

      setUnreadCounts((prev) => ({
        ...prev,
        [contactId]: 0,
      }));
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
      await axios.patch(`http://localhost:5000/api/messages/${messageId}`, {
        data: { userId: currentUser.id },
      });
      console.log(currentUser.id, messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      antMessage.success("Message deleted");
    } catch (error) {
      antMessage.error("Failed to delete message");
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

    try {
      socketRef.current.emit("send_message", {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        content: inputMessage,
        replyTo: replyTo?._id || null,
      });
    } catch (error) {
      antMessage.error("Failed to send message");
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  // New feature handlers
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

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        duration: locationDuration,
      };

      const newMessage = {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        messageType: "location",
        location: {
          ...locationData,
          live: true,
          expiresAt: new Date(Date.now() + locationDuration * 60000),
        },
        content: "Shared live location",
      };

      socketRef.current.emit("send_message", newMessage);
      setShowLocationModal(false);
      antMessage.success("Live location shared");
    } catch (error) {
      antMessage.error("Failed to get location");
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
      const newMessage = {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        messageType: "contact",
        contacts: selectedContacts.map((id) => {
          const contact = contacts.find((c) => c.id === id);
          return {
            id: contact.id,
            name: contact.name,
            avatar: contact.avatar,
          };
        }),
        content: `Shared ${selectedContacts.length} contact(s)`,
      };

      socketRef.current.emit("send_message", newMessage);
      setShowContactsModal(false);
      setSelectedContacts([]);
      antMessage.success("Contacts shared");
    } catch (error) {
      antMessage.error("Failed to share contacts");
    }
  };

  const startRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        audioRecorderRef.current = mediaRecorder;
        const audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);

          if (waveformRef.current) {
            const wavesurfer = WaveSurfer.create({
              container: waveformRef.current,
              waveColor: "#1890ff",
              progressColor: "#096dd9",
              cursorColor: "transparent",
              barWidth: 2,
              barRadius: 3,
              barGap: 2,
              height: 40,
              responsive: true,
            });
            wavesurfer.load(audioUrl);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Auto-stop after 60 seconds
        setTimeout(() => {
          if (isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
          }
        }, 60000);
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
        antMessage.error("Microphone access denied");
      });
  };

  const stopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      setIsRecording(false);
      audioRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioUrl || !activeContact) return;

    try {
      // Convert audio URL to blob
      const blob = await fetch(audioUrl).then((r) => r.blob());
      const formData = new FormData();
      formData.append("audio", blob, "recording.wav");

      // Upload audio file
      const uploadResponse = await axios.post(
        "http://localhost:5000/api/upload-audio",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // Send via socket
      socketRef.current.emit("send_message", {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        audioURL: uploadResponse.data.url,
        isAudioMessage: true,
        replyTo: replyTo?._id || null,
      });

      setAudioUrl("");
      setReplyTo(null);
    } catch (error) {
      antMessage.error("Failed to send voice message");
    }
  };

  const initiateCall = async (isVideo) => {
    if (!peerInstance || !activeContact) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      const call = peerInstance.call(activeContact.id, stream);

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

      // Notify the other user via socket
      socketRef.current.emit("call_initiated", {
        senderId: currentUser.id,
        senderName: currentUser.name,
        receiverId: activeContact.id,
        isVideo: isVideo,
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      antMessage.error(
        "Failed to start call. Please check your microphone permissions."
      );
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
      antMessage.error(
        "Failed to answer call. Please check your microphone permissions."
      );
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

  const handleDocumentUpload = async () => {
    if (!documentFile) {
      antMessage.error("Please select a document");
      return;
    }

    const formData = new FormData();
    formData.append("document", documentFile);

    try {
      const uploadResponse = await axios.post(
        "http://localhost:5000/api/messages/documents",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const newMessage = {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        messageType: "document",
        document: {
          url: uploadResponse.data.url,
          name: documentFile.name,
          size: documentFile.size,
          type: documentFile.type,
        },
        content: `Shared document: ${documentFile.name}`,
      };

      socketRef.current.emit("send_message", newMessage);
      setShowDocumentModal(false);
      setDocumentFile(null);
      antMessage.success("Document shared");
    } catch (error) {
      antMessage.error("Failed to upload document");
    }
  };

  const handleCreatePoll = async () => {
    if (!pollQuestion || pollOptions.some((opt) => !opt.trim())) {
      antMessage.error("Please fill all poll fields");
      return;
    }

    try {
      const newMessage = {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        messageType: "poll",
        poll: {
          question: pollQuestion,
          options: pollOptions.map((opt) => ({
            text: opt,
            voters: [],
          })),
          isMultiSelect,
          totalVotes: 0,
          expiresAt: pollDuration
            ? new Date(Date.now() + pollDuration * 60000)
            : null,
        },
        content: `Poll: ${pollQuestion}`,
      };

      socketRef.current.emit("send_message", newMessage);
      setShowPollModal(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setIsMultiSelect(false);
      setPollDuration(null);
      antMessage.success("Poll created");
    } catch (error) {
      antMessage.error("Failed to create poll");
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

      const newMessage = {
        senderId: currentUser.id,
        receiverId: activeContact.id,
        messageType: "event",
        event: {
          title: eventTitle,
          description: eventDescription,
          date: eventDateTime,
          location: eventLocation,
          attendees: [],
          organizer: currentUser.id,
        },
        content: `Event: ${eventTitle} on ${eventDateTime.toLocaleString()}`,
      };

      socketRef.current.emit("send_message", newMessage);
      setShowEventModal(false);
      setEventTitle("");
      setEventDescription("");
      setEventDate(null);
      setEventTime(null);
      setEventLocation("");
      antMessage.success("Event created");
    } catch (error) {
      antMessage.error("Failed to create event");
    }
  };

  const handleVoteInPoll = async (messageId, optionIndices) => {
    try {
      await axios.post(
        `http://localhost:5000/api/messages/polls/${messageId}/vote`,
        {
          userId: currentUser.id,
          optionIndices,
        }
      );

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId && msg.messageType === "poll") {
            const updatedPoll = { ...msg.poll };
            optionIndices.forEach((index) => {
              if (!updatedPoll.options[index].voters.includes(currentUser.id)) {
                updatedPoll.options[index].voters.push(currentUser.id);
              }
            });
            updatedPoll.totalVotes = updatedPoll.options.reduce(
              (total, option) => total + option.voters.length,
              0
            );
            return { ...msg, poll: updatedPoll };
          }
          return msg;
        })
      );
    } catch (error) {
      antMessage.error("Failed to vote in poll");
    }
  };

  const handleRSVPToEvent = async (messageId, status) => {
    try {
      await axios.post(
        `http://localhost:5000/api/messages/events/${messageId}/rsvp`,
        {
          userId: currentUser.id,
          status,
        }
      );

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId && msg.messageType === "event") {
            const updatedEvent = { ...msg.event };
            updatedEvent.attendees = updatedEvent.attendees.filter(
              (attendee) => attendee.userId !== currentUser.id
            );
            if (status !== "not_going") {
              updatedEvent.attendees.push({
                userId: currentUser.id,
                status,
              });
            }
            return { ...msg, event: updatedEvent };
          }
          return msg;
        })
      );
    } catch (error) {
      antMessage.error("Failed to update RSVP");
    }
  };

  // Message rendering
  const renderMessageContent = (msg) => {
    switch (msg.messageType) {
      case "location":
        return (
          <div className="location-message">
            <EnvironmentOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <div>
              <Text strong>Live Location</Text>
              <div>
                <a
                  href={`https://maps.google.com/?q=${msg.location.latitude},${msg.location.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Map
                </a>
              </div>
              {msg.location.live && (
                <Text type="secondary">
                  Expires in{" "}
                  {Math.round(
                    (new Date(msg.location.expiresAt) - Date.now()) / 60000
                  )}{" "}
                  minutes
                </Text>
              )}
            </div>
          </div>
        );
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
      case "document":
        return (
          <div className="document-message">
            <FileOutlined style={{ fontSize: 24, marginRight: 8 }} />
            <div>
              <Text strong>{msg.document.name}</Text>
              <div>
                <a
                  href={msg.document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
              </div>
              <Text type="secondary">{formatFileSize(msg.document.size)}</Text>
            </div>
          </div>
        );
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
      default:
        return msg.content && <div className="message-text">{msg.content}</div>;
    }
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
            onClick={() => documentInputRef.current?.click()}
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
                            <Menu.Item
                              icon={<CloseOutlined />}
                              danger
                              onClick={() => deleteMessage(msg._id)}
                            >
                              Delete
                            </Menu.Item>
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
              {audioUrl ? (
                <div className="voice-message-preview">
                  <div className="waveform-container" ref={waveformRef} />
                  <Space>
                    <Button
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => setAudioUrl("")}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendVoiceMessage}
                    />
                  </Space>
                </div>
              ) : (
                <>
                  <Button
                    type="text"
                    icon={<PaperClipOutlined />}
                    className="input-action-btn"
                  />

                  {renderAdditionalMessageOptions()}

                  <Input.TextArea
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
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
        title={`Shared ${mediaType === "images" ? "Photos" : "Videos"}`}
        visible={showMediaViewer}
        onCancel={() => setShowMediaViewer(false)}
        footer={null}
        width="80%"
      >
        <div className="media-grid">
          {messages
            .filter(
              (msg) =>
                (mediaType === "images" && msg.imageUrl) ||
                (mediaType === "videos" && msg.videoUrl)
            )
            .map((msg) => (
              <div key={msg._id} className="media-item">
                {mediaType === "images" ? (
                  <img src={msg.imageUrl} alt="Shared content" />
                ) : (
                  <video controls>
                    <source src={msg.videoUrl} type="video/mp4" />
                  </video>
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
    </div>
  );
};

export default ProfessionalChat;