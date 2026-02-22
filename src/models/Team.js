const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  role: {
    type: String,
    enum: ["leader", "member"],
    default: "member"
  },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hackathon",
    required: true
  },
  
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null
  },
  
  members: {
    type: [teamMemberSchema],
    validate: {
      validator: function(arr) {
        return arr.length >= 1;
      },
      message: "Team must have at least one member"
    }
  },
  
  // For quick lookup
  memberEmails: {
    type: [String],
    default: [],
    index: true
  },
  
  maxSize: { type: Number, default: 4 },
  
  description: { type: String, default: "" },
  
  status: {
    type: String,
    enum: ["active", "disbanded", "completed"],
    default: "active"
  },
  
  // Team chat room ID (same as team _id for simplicity)
  chatRoomId: { type: String, default: null }
  
}, { timestamps: true });

// Pre-save hook to update memberEmails
teamSchema.pre("save", function(next) {
  this.memberEmails = this.members.map(m => m.email.toLowerCase());
  if (!this.chatRoomId) {
    this.chatRoomId = this._id.toString();
  }
  next();
});

// Index for efficient queries
teamSchema.index({ hackathonId: 1, status: 1 });
// memberEmails index is already defined inline with "index: true"

module.exports = mongoose.model("Team", teamSchema);
