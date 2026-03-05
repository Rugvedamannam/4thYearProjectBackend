const mongoose = require("mongoose");

const statSchema = new mongoose.Schema({
  value: Number,
  label: String,
});

const hackathonSchema = new mongoose.Schema({
  tier: String,
  title: String,
  date: String,
  role: String,
  pending: Boolean,
});

const projectSchema = new mongoose.Schema({
  status: String,
  title: String,
  description: String,
  role: String,
  pending: Boolean,
});

const profileSchema = new mongoose.Schema({
  name: String,
  role: String,
  location: String,
  plan: String,
  avatar: String,
  email: String,
  linkedin: String,
  github: String,

  about: String,
  skills: [String],
  stats: [statSchema],

  hackathons: [hackathonSchema],
  hackathonHighlight: {
    title: String,
    description: String,
    progress: String,
  },

  projects: [projectSchema],
  projectHighlight: {
    title: String,
    description: String,
    progress: String,
  },
});

module.exports = mongoose.model("Profile", profileSchema);