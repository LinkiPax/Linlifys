import React from "react";
import { Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";
import { FiMessageSquare, FiX } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import EmojiPicker from "emoji-picker-react";

export default function ChatSidebar({
  messages,
  newMessage,
  setNewMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  handleSendMessage,
  addEmoji,
  chatContainerRef,
  setShowChat,
}) {
  return (
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
  );
}
