import React, { useState, useEffect, useRef } from "react";
import { Button, ListGroup, Form, InputGroup } from "react-bootstrap";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setMessages } from "../../MessageSlice";
import axios from "axios";
import { useParams } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";  // Correct import
import ReactAudioPlayer from 'react-audio-player'; 
import { Peer } from "peerjs"; // Import PeerJS for audio calling // To play the audio
import "./Messages.css";

let socket;
let peer;
let currentCall;
const ChatPage = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.messages);
  const [messageContent, setMessageContent] = useState("");
  const [userData, setUserData] = useState(null);
  const [connections, setConnections] = useState([]);
  const [error, setError] = useState("");
  const messagesContainerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);  // State for showing the emoji picker
  const [isRecording, setIsRecording] = useState(false);
  const [audioURLs, setAudioURL] = useState("");
  const { targetUserId } = useParams(); // Get targetUserId from URL params
  const [isInCall, setIsInCall] = useState(false);  // Track whether in a call
  console.log("uploadurl", audioURLs);
  // Fetch user data and connections
  useEffect(() => {
    const userId = localStorage.getItem("userId");

    if (userId) {
      const fetchUserData = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/user/${userId}`);
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

  // Setup socket connection
  useEffect(() => {
    if (!userData) return;

    socket = io("http://localhost:5000", { withCredentials: true });

    socket.emit("join", userData._id);
   // Listen for incoming calls
   socket.on("incoming_call", (callData) => {
    // Handle incoming call
    if (window.confirm(`Incoming call from ${callData.senderName}. Accept?`)) {
      initiateCall(callData.senderId);
    }
  });
    // Listen for new messages
    socket.on("new_message", (newMessage) => {
      console.log("New message received:", newMessage);
      dispatch(addMessage(newMessage)); // Update Redux state with the new message
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
      secure: false, // Change to `true` if you're using https
    });

    peer.on("open", (id) => {
      console.log("Peer connection established with ID:", id);
    });

    // Handle incoming audio calls
    peer.on("call", (call) => {
      console.log("Incoming call", call);
      call.answer();
      setIsInCall(true);

      // Attach media stream to audio element
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
      // Ensure local stream is available
      if (!window.localStream) {
        // Attempt to get the local media stream if not already available
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        window.localStream = stream;  // Store the stream globally to use in the call
      }
  
      // Make the call using the local stream
      const call = peer.call(receiverId, window.localStream);
      setIsInCall(true);
  
      // Handle the remote stream when the call is established
      call.on("stream", (stream) => {
        const audio = document.createElement("audio");
        audio.srcObject = stream;
        audio.play();
      });
  
      // Optionally store the current call for later use
      currentCall = call;
    } catch (error) {
      console.error("Error initiating call:", error);
      alert("An error occurred while initiating the call. Please check your camera and microphone settings.");
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
        const response = await axios.get("http://localhost:5000/api/messages", {
          params: { userId: userData._id, targetUserId },
        });
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
    e.preventDefault();

    if (!messageContent.trim() || !targetUserId) return;

    const newMessages = {
      senderId: userData._id,
      receiverId: targetUserId,
      content: messageContent.trim(),
      
    };
    try {
      console.log("Sending voice message:", newMessages);
      // Emit message via socket
      socket.emit("send_message", newMessages);

      // Optimistic UI update
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
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        
        // Stop recording after 60 seconds
        setTimeout(() => {
          mediaRecorder.stop();
        }, 3000);
      };
      
      start();
    }
  };
  // Stop recording voice
  const stopRecording = () => {
    setIsRecording(false);
  };
  // Handle sending a voice message
  const handleSendVoiceMessage = async () => {
     if (!audioURLs || !targetUserId){
       console.error("Cannot send voice message: Missing audioURL or targetUserId.");
        return;
       }
     console.log("Sending voice message with audio URL:", audioURLs);
     const newMessage = {
       senderId: userData._id,
       receiverId: targetUserId,
       content: "1", // Leave content empty for audio messages
       audioURL: "2", // Send the audio URL as part of the message
     };
     try {
       console.log("Attempting to send voice message with data:", newMessage);
       socket.emit("send_message", newMessage);
       dispatch(addMessage(newMessage));
       setAudioURL("");  // Reset audio URL after sending
     } catch (err) {
       setError("Error sending voice message.");
       console.error(err);
     }
   };
   
  

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom(); // Scroll to the bottom whenever messages change
  }, [messages]);

  // Handle emoji selection
  const handleEmojiClick = (emoji) => {
    setMessageContent(messageContent + emoji.emoji);
    setShowEmojiPicker(false);  // Close the emoji picker after selecting an emoji
  };

  if (error) return <div>{error}</div>;

  return (
    <div>
      <h4>Messages</h4>
       {/* Audio Call Controls */}
      <div className="audio-call-controls">
        {!isInCall ? (
          <Button onClick={() => initiateCall(targetUserId)} variant="success">Start Audio Call</Button>
        ) : (
          <Button onClick={endCall} variant="danger">End Call</Button>
        )} 
      </div>
      {/* Display messages */}
      <ListGroup className="list-group" ref={messagesContainerRef}>
        {messages.map((message) => {
          console.log("message:", message);
          // Retrieve sender's name or 'You' for the current user
          const senderName = (message.sender || message.senderId) === userData._id ? "You" : "Other";
          console.log("senderName:", (message.sender || message.senderId));
          console.log("userData._id:", userData._id);

          return (
            <ListGroup.Item
              key={message._id + message.createdAt} // Combine _id and createdAt to make the key unique
              className={
                  (message.sender || message.senderId) === userData._id
                  ? "bg-primary text-white text-end"
                  : "bg-light text-dark text-start"
              }
            >
              <strong>{senderName}:</strong> {message.content}
              {message.audioURL && (
                <ReactAudioPlayer
                  src={message.audioURL}
                  controls
                  className="audio-player"
                />
              )}
            </ListGroup.Item>
          );
        })}
      </ListGroup>

      {/* Message input */}
      <Form onSubmit={handleSendMessage}>
        <InputGroup>
          <Form.Control
            type="text"
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            placeholder="Type your message..."
          />
          <Button variant="light" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
            😊
          </Button>
          <Button type="submit" variant="primary">
            Send
          </Button>
        </InputGroup>
      </Form>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
          {/* Voice message controls */}
          <div className="voice-controls">
        <Button onClick={startRecording} variant={isRecording ? "danger" : "success"}>
          {isRecording ? "Stop Recording" : "Record Voice"}
        </Button>
        {audioURLs && (
          <div>
            <Button onClick={handleSendVoiceMessage} variant="primary">
              Send Voice Message
            </Button>
            <ReactAudioPlayer
              src={audioURLs}
              controls
              className="audio-player"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
