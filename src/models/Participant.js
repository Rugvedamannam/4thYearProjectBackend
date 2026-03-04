const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    archetype: { type: String, required: true },
    initials: { type: String, required: true },
    skill: { type: String, required: true },
    skillPercent: { type: Number, required: true },
    compatibility: { type: Number, required: true },
    color: { type: String, default: "#20E0D1" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Participant", participantSchema);