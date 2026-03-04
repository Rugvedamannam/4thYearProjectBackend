const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: { type: Number, required: true }
});

module.exports = mongoose.model("EditTeam", teamSchema);