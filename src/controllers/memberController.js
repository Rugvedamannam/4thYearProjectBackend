const Team = require("../models/Team");

/* ===============================
   GET ALL MEMBERS (FROM TEAMS)
================================= */
exports.getMembers = async (req, res) => {
  try {

    const { email, search } = req.query;

    if (!email) {
      return res.status(400).json({ message: "User email required" });
    }

    /* Find team where user belongs */
    const team = await Team.findOne({
      "members.email": email
    }).lean();

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    let members = team.members.map((member) => ({
      _id: member.userId || member.email,
      name: member.name,
      email: member.email,
      role: member.role,
      github: member.github_profile || "",
      overall_score: member.overall_score || 0,

      skills: member.top_skills?.map((s) => ({
        name: s,
        value: Math.floor(Math.random() * 30) + 70
      })) || [],

      experience: [
        {
          year: "2024",
          title: "Hackathon Participant",
          company: team.name,
          desc: member.reason || "Participated in hackathon"
        }
      ]
    }));


    /* SEARCH FILTER */

    if (search) {
      const searchLower = search.toLowerCase();

      members = members.filter(
        (m) =>
          m.name.toLowerCase().includes(searchLower) ||
          m.role.toLowerCase().includes(searchLower) ||
          m.email.toLowerCase().includes(searchLower)
      );
    }

    res.status(200).json(members);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   GET SINGLE MEMBER
================================= */
exports.getMemberById = async (req, res) => {
  try {
    const teams = await Team.find().lean();

    let foundMember = null;

    teams.forEach((team) => {
      team.members.forEach((member) => {
        if (
          member.userId?.toString() === req.params.id ||
          member.email === req.params.id
        ) {
          foundMember = {
            _id: member.userId || member.email,
            name: member.name,
            email: member.email,
            role: member.role,
            github: member.github_profile || "",
            skills: member.top_skills || [],
            overall_score: member.overall_score,
            experience_score: member.experience_score,
            reason: member.reason,
            team: team.name
          };
        }
      });
    });

    if (!foundMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json(foundMember);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* ===============================
   DELETE MEMBER FROM TEAM
================================= */
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findOne({
      "members.userId": id
    });

    if (!team) {
      return res.status(404).json({ message: "Member not found in any team" });
    }

    team.members = team.members.filter(
      (m) => m.userId?.toString() !== id
    );

    await team.save();

    res.status(200).json({ message: "Member removed from team" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};