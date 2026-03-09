const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  name: { type: String, required: true },

  email: { type: String, required: true, lowercase: true },

  role: {
    type: String,
    enum: ["leader", "member", "Frontend", "Backend", "DevOps"],
    default: "member"
  },

  joinedAt: { type: Date, default: Date.now },

  /* -------- AI RESPONSE DATA -------- */

  student_id: { type: String },

  participant_id: { type: String },

  participant_name: { type: String },

  github_profile: { type: String },

  overall_score: { type: Number },

  experience_score: { type: Number },

  reason: { type: String },

  top_skills: [{ type: String }]

}, { _id: false });



const teamSchema = new mongoose.Schema({

  name: { type: String, required: true, trim: true },

  /* -------- AI TEAM ID -------- */
  team_id: { type: String },

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

  /* For quick lookup */
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

  organizerEmail: {
    type: String,
    required: true,
    lowercase: true
  },

  /* -------- AI TEAM SIZE -------- */
  team_size: { type: Number },

  /* -------- AI BALANCE SCORE -------- */

  balance_score: {
    average_score: Number,
    score_variance: Number,
    role_diversity: Number,
    overall_balance: Number
  },

  /* Store complete AI response (optional but recommended) */
  aiRawResponse: {
    type: Object,
    default: null
  },

  /* Team chat room ID */
  chatRoomId: { type: String, default: null }

}, { timestamps: true });



/* Pre-save hook to update memberEmails */

teamSchema.pre("save", function () {

  if (!this.members || this.members.length === 0) {
    throw new Error("Team must have at least one member");
  }

  this.memberEmails = this.members.map(member => member.email);

});


/* Index for efficient queries */

teamSchema.index({ hackathonId: 1, status: 1 });

module.exports = mongoose.model("Team", teamSchema);