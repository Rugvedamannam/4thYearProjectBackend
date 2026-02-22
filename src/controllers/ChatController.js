const Message = require("../models/Message");

// Get chat history for a room with pagination
exports.getChatHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    
    const query = { 
      roomId, 
      isDeleted: false 
    };
    
    // If 'before' timestamp is provided, get messages before that time
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate("senderId", "name email")
      .lean();
    
    // Reverse to get chronological order
    messages.reverse();
    
    const totalMessages = await Message.countDocuments({ roomId, isDeleted: false });
    
    res.status(200).json({
      success: true,
      messages,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / parseInt(limit)),
        totalMessages,
        hasMore: parseInt(page) * parseInt(limit) < totalMessages
      }
    });
    
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch chat history"
    });
  }
};

// Get recent messages (for initial load)
exports.getRecentMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 30 } = req.query;
    
    const messages = await Message.find({ 
      roomId, 
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "name email")
      .lean();
    
    // Reverse to get chronological order
    messages.reverse();
    
    res.status(200).json({
      success: true,
      messages
    });
    
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent messages"
    });
  }
};

// Get all rooms/conversations for a user
exports.getUserRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require("mongoose");
    
    // Get distinct rooms where user has participated
    const rooms = await Message.aggregate([
      { 
        $match: { 
          senderId: new mongoose.Types.ObjectId(userId),
          isDeleted: false 
        } 
      },
      { 
        $group: { 
          _id: "$roomId",
          roomType: { $first: "$roomType" },
          lastMessage: { $last: "$text" },
          lastMessageTime: { $last: "$createdAt" }
        } 
      },
      { $sort: { lastMessageTime: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      rooms
    });
    
  } catch (error) {
    console.error("Error fetching user rooms:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch user rooms"
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { messageIds, userId } = req.body;
    
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $addToSet: { readBy: userId } }
    );
    
    res.status(200).json({
      success: true,
      message: "Messages marked as read"
    });
    
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark messages as read"
    });
  }
};

// Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found"
      });
    }
    
    // Only allow sender to delete their own message
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own messages"
      });
    }
    
    message.isDeleted = true;
    await message.save();
    
    // Emit socket event for real-time deletion (if io is available)
    const io = req.app.get("io");
    if (io) {
      io.to(message.roomId).emit("message_deleted", {
        messageId,
        roomId: message.roomId
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });
    
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete message"
    });
  }
};

// Get unread message count for a room
exports.getUnreadCount = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    
    const unreadCount = await Message.countDocuments({
      roomId,
      isDeleted: false,
      readBy: { $ne: userId }
    });
    
    res.status(200).json({
      success: true,
      unreadCount
    });
    
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get unread count"
    });
  }
};

// Search messages in a room
exports.searchMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { query, limit = 20 } = req.query;
    
    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "Search query is required"
      });
    }
    
    const messages = await Message.find({
      roomId,
      isDeleted: false,
      text: { $regex: query, $options: "i" }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "name email")
      .lean();
    
    res.status(200).json({
      success: true,
      messages,
      searchQuery: query
    });
    
  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search messages"
    });
  }
};
