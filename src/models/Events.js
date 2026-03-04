const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: String,
  status: String,
  synergy: Number,
  frontend: Number,
  backend: Number,
  design: Number,
});

const eventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["hackathon", "project"],
    required: true,
  },
  title: String,
  progress: String,
  size: String,
  teams: [teamSchema],
});

module.exports = mongoose.model("Event", eventSchema);