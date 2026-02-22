const Message = require("../models/Message");

// Store online users: { odid: {socketId, userName, userEmail} }
const onlineUsers = new Map();

// Store typing users: { roomId: Set of userIds }
const typingUsers = new Map();

const initializeSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ================== USER AUTHENTICATION ==================
    socket.on("user_online", (userData) => {
      const { userId, userName, userEmail } = userData;
      onlineUsers.set(userId, {
        socketId: socket.id,
        userName,
        userEmail
      });
      
      // Broadcast to all users that this user is online
      io.emit("user_status_change", {
        userId,
        userName,
        status: "online"
      });
      
      console.log(`User online: ${userName} (${userId})`);
    });

    // ================== ROOM MANAGEMENT ==================
    socket.on("join_room", async (data) => {
      const { roomId, roomType, userId, userName } = data;
      
      socket.join(roomId);
      console.log(`🚪 ${userName} (${userId}) joined room: ${roomId} [${roomType}]`);
      
      // Notify others in the room
      socket.to(roomId).emit("user_joined", {
        userId,
        userName,
        roomId,
        timestamp: new Date()
      });
    });

    socket.on("leave_room", (data) => {
      const { roomId, userId, userName } = data;
      
      socket.leave(roomId);
      console.log(`${userName} left room: ${roomId}`);
      
      // Notify others in the room
      socket.to(roomId).emit("user_left", {
        userId,
        userName,
        roomId,
        timestamp: new Date()
      });
    });

    // ================== MESSAGING ==================
    socket.on("send_message", async (data) => {
      const { roomId, roomType, senderId, senderName, senderEmail, text, messageType = "text" } = data;
      
      console.log("📨 Received send_message:", { roomId, roomType, senderId, senderName, text: text?.substring(0, 50) });
      
      try {
        // Save message to database
        const newMessage = new Message({
          roomId,
          roomType: roomType || "direct",
          senderId,
          senderName,
          senderEmail,
          text,
          messageType,
          readBy: [senderId] // Sender has read their own message
        });
        
        await newMessage.save();
        console.log("✅ Message saved to DB:", newMessage._id);
        
        // Emit to all users in the room (including sender for confirmation)
        io.to(roomId).emit("receive_message", {
          _id: newMessage._id,
          roomId,
          roomType: newMessage.roomType,
          senderId,
          senderName,
          senderEmail,
          text,
          messageType,
          createdAt: newMessage.createdAt,
          readBy: newMessage.readBy
        });
        
        // Clear typing indicator for this user
        if (typingUsers.has(roomId)) {
          typingUsers.get(roomId).delete(senderId);
          socket.to(roomId).emit("user_stop_typing", {
            userId: senderId,
            userName: senderName,
            roomId
          });
        }
        
      } catch (error) {
        console.error("Error saving message:", error);
        socket.emit("message_error", {
          error: "Failed to send message",
          originalMessage: data
        });
      }
    });

    // ================== TYPING INDICATORS ==================
    socket.on("typing_start", (data) => {
      const { roomId, userId, userName } = data;
      
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      typingUsers.get(roomId).add(userId);
      
      socket.to(roomId).emit("user_typing", {
        userId,
        userName,
        roomId
      });
    });

    socket.on("typing_stop", (data) => {
      const { roomId, userId, userName } = data;
      
      if (typingUsers.has(roomId)) {
        typingUsers.get(roomId).delete(userId);
      }
      
      socket.to(roomId).emit("user_stop_typing", {
        userId,
        userName,
        roomId
      });
    });

    // ================== READ RECEIPTS ==================
    socket.on("mark_read", async (data) => {
      const { messageIds, userId, roomId } = data;
      
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { readBy: userId } }
        );
        
        socket.to(roomId).emit("messages_read", {
          messageIds,
          userId,
          roomId
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // ================== DISCONNECT ==================
    socket.on("disconnect", () => {
      // Find and remove user from online users
      let disconnectedUserId = null;
      let disconnectedUserName = null;
      
      for (const [userId, userData] of onlineUsers.entries()) {
        if (userData.socketId === socket.id) {
          disconnectedUserId = userId;
          disconnectedUserName = userData.userName;
          onlineUsers.delete(userId);
          break;
        }
      }
      
      // Clean up typing indicators
      for (const [roomId, users] of typingUsers.entries()) {
        if (disconnectedUserId && users.has(disconnectedUserId)) {
          users.delete(disconnectedUserId);
        }
      }
      
      // Broadcast user offline status
      if (disconnectedUserId) {
        io.emit("user_status_change", {
          userId: disconnectedUserId,
          userName: disconnectedUserName,
          status: "offline"
        });
        console.log(`User disconnected: ${disconnectedUserName} (${disconnectedUserId})`);
      } else {
        console.log(`Socket disconnected: ${socket.id}`);
      }
    });

    // ================== GET ONLINE USERS ==================
    socket.on("get_online_users", (callback) => {
      const users = [];
      for (const [userId, userData] of onlineUsers.entries()) {
        users.push({
          userId,
          userName: userData.userName,
          userEmail: userData.userEmail
        });
      }
      if (typeof callback === "function") {
        callback(users);
      }
    });
  });
};

module.exports = { initializeSocketHandlers, onlineUsers };
