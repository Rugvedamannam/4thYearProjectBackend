const Team = require("../models/EditTeam");

// Get all teams
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createTeams = async (req, res) => {
    try {
      const teams = req.body; // expect an array of objects
      if (!Array.isArray(teams)) return res.status(400).json({ error: "Expected an array" });
  
      const insertedTeams = await Team.insertMany(teams);
      res.status(201).json(insertedTeams);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };