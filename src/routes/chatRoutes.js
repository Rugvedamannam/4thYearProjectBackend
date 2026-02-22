const express = require("express");
const router = express.Router();
const ChatController = require("../controllers/ChatController");
const auth = require("../middlewares/auth");

// Get chat history for a room (paginated)
router.get("/history/:roomId", auth, ChatController.getChatHistory);

// Get recent messages for a room (initial load)
router.get("/recent/:roomId", auth, ChatController.getRecentMessages);

// Get all rooms/conversations for a user
router.get("/rooms/:userId", auth, ChatController.getUserRooms);

// Mark messages as read
router.post("/read", auth, ChatController.markMessagesAsRead);

// Delete a message (soft delete)
router.delete("/message/:messageId", auth, ChatController.deleteMessage);

// Get unread message count for a room
router.get("/unread/:roomId/:userId", auth, ChatController.getUnreadCount);

// Search messages in a room
router.get("/search/:roomId", auth, ChatController.searchMessages);

module.exports = router;
