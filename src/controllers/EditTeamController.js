const Team = require("../models/Team");

const getTeamsForEdit = async (req, res) => {
  try {

    const organizerEmail = req.query.email?.toLowerCase();

    if (!organizerEmail) {
      return res.status(400).json({
        success: false,
        error: "Organizer email is required"
      });
    }

    const teams = await Team.find({ organizerEmail })
      .populate("members.userId", "name email")
      .select("name members hackathonId organizerEmail");

    res.status(200).json({
      success: true,
      count: teams.length,
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

const updateTeamDetails = async (req, res) => {
  try {

    const { _id } = req.params;
    const { name, description } = req.body;

    const updatedTeam = await Team.findByIdAndUpdate(
      _id,
      {
        name,
        description
      },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team: updatedTeam
    });

  } catch (error) {

    console.error("Error updating team:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update team"
    });

  }
};


const getTeamDetails = async (req, res) => {
  try {

    const { _id } = req.params;

    const team = await Team.findById(_id)
      .populate("members.userId", "name email")
      .select("_id name description members");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.status(200).json({
      success: true,
      team
    });

  } catch (error) {

    console.error("Error fetching team details:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch team details"
    });

  }
};

const updateTeamMember = async (req, res) => {
  try {

    const { _id, memberEmail } = req.params;
    const { name, role } = req.body;

    const updatedTeam = await Team.findOneAndUpdate(
      {
        _id: _id,
        "members.email": memberEmail
      },
      {
        $set: {
          "members.$.name": name,
          "members.$.role": role
        }
      },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      team: updatedTeam
    });

  } catch (error) {

    console.error("Error updating member:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update member"
    });

  }
};

const deleteTeamMember = async (req, res) => {

  try {

    const { _id, memberEmail } = req.params;

    const updatedTeam = await Team.findByIdAndUpdate(
      _id,
      {
        $pull: {
          members: { email: memberEmail }
        }
      },
      { new: true }
    );

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        message: "Team not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      team: updatedTeam
    });

  } catch (error) {

    console.error("Error deleting member:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete member"
    });

  }

};

module.exports = {
  getTeamsForEdit,
  updateTeamDetails,
  getTeamDetails,
  updateTeamMember,
  deleteTeamMember
};