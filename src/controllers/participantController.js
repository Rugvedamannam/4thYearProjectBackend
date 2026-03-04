const Participant = require("../models/Participant");

const getParticipants = async (req, res) => {
  try {
    const participants = await Participant.find();
    res.json(participants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ New controller
const addParticipant = async (req, res) => {
  try {
    const participant = new Participant(req.body);
    const saved = await participant.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getParticipants, addParticipant };