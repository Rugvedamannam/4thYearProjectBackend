const TeamAnalysis = require("../models/TeamAnalysis");

/* GET TEAM ANALYSIS BY TEAM NAME + TYPE */
exports.getTeamAnalysis = async (req, res) => {
  try {
    const { teamName, type } = req.params;

    const data = await TeamAnalysis.findOne({
      teamName,
      type,
    });

    if (!data) {
      return res.status(404).json(null);
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* CREATE TEAM ANALYSIS */
exports.createTeamAnalysis = async (req, res) => {
  try {
    const newData = await TeamAnalysis.create(req.body);
    res.status(201).json(newData);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};