// models/Project.js
const mongoose = require("mongoose");

const prizeSchema = new mongoose.Schema({
  position: { type: String, required: true }, // First, Second, etc.
  amount: { type: Number, required: true }
}, { _id: false });

const benefitsSchema = new mongoose.Schema({
  certificates: {
    participation: { type: Boolean, default: false },
    winner: { type: Boolean, default: false }
  },

  cashPrize: {
    enabled: { type: Boolean, default: false },
    prizes: { type: [prizeSchema], default: [] }
  },

  internshipOpportunity: { type: Boolean, default: false },
  jobOpportunity: { type: Boolean, default: false },
  mentorship: { type: Boolean, default: false },
  swag: { type: Boolean, default: false },
  networking: { type: Boolean, default: false }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hackathon",
    required: true
  },

  organizerEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },

  projectName: { type: String, required: true },
  techStack: { type: [String], default: [] },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ["draft", "published", "closed"],
    default: "draft"
  },

  submissionDeadline: { type: Date, default: null },

  assets: {
    problemStatementPdf: { type: String, default: null },
    dataset: { type: String, default: null },
    starterCode: { type: String, default: null }
  },

  benefits: benefitsSchema

}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);