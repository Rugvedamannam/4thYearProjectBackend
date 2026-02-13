const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema({
  type: { type: String, enum: ["public", "private"], required: true },
  name: { type: String, required: true, trim: true },
  organizer: { type: String, required: true, trim: true },
  mode: { type: String, enum: ["online", "offline"], required: true },
  location: { type: String, required: function() { return this.mode === "offline"; }, default: null },
  theme: { type: String, required: true },
  skills: { type: [String], default: [] },
  participantsPdf: { type: String, default: null },
  allowedParticipants: {
    type: [String],
    default: [],
    set: emails => emails.map(e => e.toLowerCase().trim())
  },
   organizerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
  banner: { type: String, default: null },
  rulesPdf: { type: String, default: null },
  eligibilityExcel: { type: String, default: null },
  descriptionPdf: { type: String, default: null },
  registrationStart: { type: Date, default: null },
  registrationEnd: { type: Date, default: null },
  hackathonStart: { type: Date, default: null },
  hackathonEnd: { type: Date, default: null },
  teamSize: { type: Number, default: null },
  difficulty: { type: String, default: null },
  audience: { type: String, default: null },
  eligibilityText: { type: String, default: null },
  published: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Hackathon", hackathonSchema);
