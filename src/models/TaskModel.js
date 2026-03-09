const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },

  title: {
    type: String,
    required: true
  },

  date: {
    type: Date
  },

  difficulty: {
    type: String,
    enum: ["Easy", "Intermediate", "Hard"]
  },

  status: {
    type: String,
    enum: ["todo", "inProgress", "completed"],
    default: "todo"
  }

}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);