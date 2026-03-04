const mongoose = require("mongoose");

const skillTrendSchema = new mongoose.Schema({
  month: { type: String, required: true },
  value: { type: Number, required: true },
});

module.exports = mongoose.model("SkillTrend", skillTrendSchema);