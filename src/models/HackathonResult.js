// models/HackathonResult.js
const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hackathon",
    required: true
  },
  rank: Number,             
  team: String,             
  email: String,            
  project: String,          
  score: Number,            
  round: {
    type: Number,
    default: 1
  },
  scoringBreakdown: {       
    innovation: Number,
    technicalComplexity: Number,
    presentation: Number,
    marketPotential: Number
  }
});

module.exports = mongoose.model("HackathonResult", resultSchema);