const mongoose = require("mongoose");

const skillSchema = new mongoose.Schema({
  name: String,
  value: Number,
});

const experienceSchema = new mongoose.Schema({
  year: String,
  title: String,
  company: String,
  desc: String,
});

const memberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: String,
  location: String,
  isYou: {
    type: Boolean,
    default: false,
  },
  linkedin: String,
  github: String,
  skills: [skillSchema],
  experience: [experienceSchema],
});

module.exports = mongoose.model("Member", memberSchema);