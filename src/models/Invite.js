const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  // Team being invited to
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true
  },
  
  // Who sent the invite
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  
  // Who is being invited (by email - user may not exist yet)
  inviteeEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // If the invitee is already a registered user
  inviteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  
  // Team/hackathon info for display
  teamName: { type: String, required: true },
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hackathon",
    default: null
  },
  hackathonName: { type: String, default: "" },
  
  // Invite status
  status: {
    type: String,
    enum: ["pending", "accepted", "declined", "expired"],
    default: "pending"
  },
  
  // Optional message from sender
  message: { type: String, default: "" },
  
  // Expiry date (default 7 days)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
  
}, { timestamps: true });

// Indexes for efficient queries
inviteSchema.index({ inviteeEmail: 1, status: 1 });
inviteSchema.index({ inviteeId: 1, status: 1 });
inviteSchema.index({ teamId: 1, status: 1 });
inviteSchema.index({ senderId: 1 });

module.exports = mongoose.model("Invite", inviteSchema);
