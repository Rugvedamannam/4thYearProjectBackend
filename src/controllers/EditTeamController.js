const Team = require("../models/Team");

const getTeamsForEdit = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("members.userId", "name email")
      .select("name members hackathonId");

    res.status(200).json({
      success: true,
      teams
    });

  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch teams"
    });
  }
};

module.exports = {
  getTeamsForEdit
};