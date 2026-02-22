const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  // Room identifier - can be teamId, projectId, or hackathonId
  roomId: { 
    type: String, 
    required: true, 
    index: true 
  },
  
  // Room type for flexibility
  roomType: {
    type: String,
    enum: ["team", "project", "hackathon", "direct"],
    default: "team"
  },
  
  // Sender information
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  senderName: { 
    type: String, 
    required: true 
  },
  senderEmail: {
    type: String,
    required: true
  },
  
  // Message content
  text: { 
    type: String, 
    required: true 
  },
  
  // Message type for future extensibility (text, file, image, etc.)
  messageType: {
    type: String,
    enum: ["text", "file", "image", "system"],
    default: "text"
  },
  
  // For file/image messages
  attachmentUrl: {
    type: String,
    default: null
  },
  
  // Read receipts (array of user IDs who have read the message)
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  }
  
}, { timestamps: true });

// Compound index for efficient queries
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, roomType: 1 });

module.exports = mongoose.model("Message", messageSchema);
