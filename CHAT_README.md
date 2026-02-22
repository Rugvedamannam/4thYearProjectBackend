# WebSocket Live Chat Implementation

## Overview

This implementation adds real-time chat functionality to your SkillSync project using Socket.io.

## Files Created

1. **`src/models/Message.js`** - MongoDB schema for chat messages
2. **`src/socket/socketHandlers.js`** - Socket.io event handlers
3. **`src/controllers/ChatController.js`** - REST API controllers for chat history
4. **`src/routes/chatRoutes.js`** - Chat API routes

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `user_online` | `{userId, userName, userEmail}` | Register user as online |
| `join_room` | `{roomId, roomType, userId, userName}` | Join a chat room |
| `leave_room` | `{roomId, userId, userName}` | Leave a chat room |
| `send_message` | `{roomId, roomType, senderId, senderName, senderEmail, text}` | Send a message |
| `typing_start` | `{roomId, userId, userName}` | User started typing |
| `typing_stop` | `{roomId, userId, userName}` | User stopped typing |
| `mark_read` | `{messageIds, userId, roomId}` | Mark messages as read |
| `get_online_users` | `callback(users)` | Get list of online users |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user_status_change` | `{userId, userName, status}` | User online/offline status |
| `user_joined` | `{userId, userName, roomId, timestamp}` | User joined room |
| `user_left` | `{userId, userName, roomId, timestamp}` | User left room |
| `receive_message` | `{_id, roomId, senderId, senderName, text, createdAt}` | New message received |
| `user_typing` | `{userId, userName, roomId}` | User is typing |
| `user_stop_typing` | `{userId, userName, roomId}` | User stopped typing |
| `messages_read` | `{messageIds, userId, roomId}` | Messages were read |
| `message_deleted` | `{messageId, roomId}` | Message was deleted |
| `message_error` | `{error, originalMessage}` | Error sending message |

## REST API Endpoints

All endpoints require authentication (JWT token in Authorization header).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/history/:roomId` | Get paginated chat history |
| GET | `/api/chat/recent/:roomId` | Get recent messages (initial load) |
| GET | `/api/chat/rooms/:userId` | Get user's chat rooms |
| POST | `/api/chat/read` | Mark messages as read |
| DELETE | `/api/chat/message/:messageId` | Delete a message |
| GET | `/api/chat/unread/:roomId/:userId` | Get unread count |
| GET | `/api/chat/search/:roomId?query=...` | Search messages |

## React Frontend Example

### Install socket.io-client

```bash
npm install socket.io-client
```

### Create Socket Context (src/context/SocketContext.js)

```javascript
import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io("http://localhost:8003", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Socket connected");
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Socket disconnected");
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
```

### Chat Component (src/components/Chat.js)

```javascript
import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const Chat = ({ roomId, roomType = "team", currentUser }) => {
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `http://localhost:8003/api/chat/recent/${roomId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data.messages);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [roomId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Register user online
    socket.emit("user_online", {
      userId: currentUser._id,
      userName: currentUser.name,
      userEmail: currentUser.email,
    });

    // Join the room
    socket.emit("join_room", {
      roomId,
      roomType,
      userId: currentUser._id,
      userName: currentUser.name,
    });

    // Listen for new messages
    socket.on("receive_message", (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socket.on("user_typing", ({ userId, userName }) => {
      if (userId !== currentUser._id) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === userId)) {
            return [...prev, { userId, userName }];
          }
          return prev;
        });
      }
    });

    socket.on("user_stop_typing", ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    // Listen for message deletion
    socket.on("message_deleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    });

    // Cleanup
    return () => {
      socket.emit("leave_room", {
        roomId,
        userId: currentUser._id,
        userName: currentUser.name,
      });
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("message_deleted");
    };
  }, [socket, isConnected, roomId, roomType, currentUser]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socket) return;

    socket.emit("typing_start", {
      roomId,
      userId: currentUser._id,
      userName: currentUser.name,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", {
        roomId,
        userId: currentUser._id,
        userName: currentUser.name,
      });
    }, 2000);
  }, [socket, roomId, currentUser]);

  // Send message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit("send_message", {
      roomId,
      roomType,
      senderId: currentUser._id,
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      text: newMessage.trim(),
    });

    setNewMessage("");

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("typing_stop", {
      roomId,
      userId: currentUser._id,
      userName: currentUser.name,
    });
  };

  if (loading) {
    return <div className="loading">Loading messages...</div>;
  }

  return (
    <div className="chat-container">
      {/* Connection status */}
      <div className={`status ${isConnected ? "online" : "offline"}`}>
        {isConnected ? "Connected" : "Disconnected"}
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${
              message.senderId === currentUser._id ? "own" : "other"
            }`}
          >
            <div className="sender">{message.senderName}</div>
            <div className="text">{message.text}</div>
            <div className="time">
              {new Date(message.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.map((u) => u.userName).join(", ")}{" "}
          {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Message input */}
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
```

### Usage in App

```javascript
import { SocketProvider } from "./context/SocketContext";
import Chat from "./components/Chat";

function App() {
  const currentUser = {
    _id: "user123",
    name: "John Doe",
    email: "john@example.com"
  };

  return (
    <SocketProvider>
      <Chat 
        roomId="team-marketing" 
        roomType="team"
        currentUser={currentUser}
      />
    </SocketProvider>
  );
}
```

## CSS Styles (optional)

```css
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.status {
  padding: 8px;
  text-align: center;
  font-size: 12px;
}

.status.online { background: #4caf50; color: white; }
.status.offline { background: #f44336; color: white; }

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  max-width: 70%;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 8px;
}

.message.own {
  margin-left: auto;
  background: #007bff;
  color: white;
}

.message.other {
  background: #e9ecef;
}

.sender {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
}

.time {
  font-size: 10px;
  opacity: 0.7;
  text-align: right;
}

.typing-indicator {
  padding: 8px 16px;
  font-style: italic;
  color: #666;
}

.message-form {
  display: flex;
  padding: 16px;
  gap: 8px;
  border-top: 1px solid #ddd;
}

.message-form input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.message-form button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.message-form button:disabled {
  background: #ccc;
}
```

## Room ID Conventions

For SkillSync, use these patterns for `roomId`:

- **Team chat**: `team-${teamId}`
- **Project chat**: `project-${projectId}`
- **Hackathon chat**: `hackathon-${hackathonId}`
- **Direct messages**: `dm-${sorted(userId1, userId2).join('-')}`

## Testing

1. Start the backend: `npm run dev`
2. Open multiple browser tabs
3. Connect to the same room
4. Send messages and see real-time updates

## Production Considerations

1. **Redis Adapter**: For horizontal scaling, use `@socket.io/redis-adapter`
2. **Authentication**: Validate JWT token on socket connection
3. **Rate Limiting**: Implement message rate limiting
4. **Message Queue**: Consider using a message queue for high traffic
