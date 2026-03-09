const StudentRegistration = require("../models/StudentRegistration");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Project = require("../models/ProjectModel"); // You said you have this


// =====================================================
// ✅ GET WORKPLACE DASHBOARD
// =====================================================
exports.getWorkplaceDashboard = async (req, res) => {
  try {

    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    /* 1️⃣ Find teams where user is a member */
    const teams = await Team.find({
      memberEmails: email.toLowerCase(),
      status: "active",
    });

    console.log("Teams found:", teams);

    /* 2️⃣ Extract projectIds from teams */
    const projectIds = teams
      .filter(team => team.projectId) // remove null projects
      .map(team => team.projectId);

    /* 3️⃣ Get projects using projectId */
    const projects = await Project.find({
      _id: { $in: projectIds }
    })
      .populate("hackathonId", "name")
      .sort({ createdAt: -1 })
      .limit(10);

      console.log("Projects found:", projects);
    res.json({
      success: true,
      teamsCount: teams.length,
      projectsCount: projects.length,
      projects,
    });

  } catch (err) {
    console.error("Workplace dashboard error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// =====================================================
// ✅ GET WORKPLACE DETAILS PAGE DATA
// (Project Details Page)
// =====================================================
exports.getWorkplaceDetails = async (req, res) => {
  try {
   const userEmail = req.query.email;

    // 1️⃣ Find registration
    const registration = await StudentRegistration.findOne({
      email: userEmail,
    });

    if (!registration) {
      return res.status(404).json({
        message: "Registration not found",
      });
    }

    // 2️⃣ Get hackathon
    const hackathon = await Hackathon.findById(
      registration.hackathonId
    );

    // 3️⃣ Find team
    const team = await Team.findOne({
      hackathonId: hackathon._id,
      memberEmails: userEmail,
      status: "active",
    });

    if (!team) {
      return res.status(404).json({
        message: "Team not found",
      });
    }

    // 4️⃣ Get project
    let project = null;

    if (team.projectId) {
      project = await Project.findById(team.projectId);
    }

    // =====================================================
    // ✅ RESPONSE FOR TASKBOARD / DETAILS PAGE
    // =====================================================

    res.json({
      hackathon: {
        name: hackathon.name,
        theme: hackathon.theme,
        mode: hackathon.mode,
      },

      team: {
        name: team.name,
        members: team.members,
      },

      project: project
        ? {
            id: project._id,
            title: project.projectName,
            description: project.description,
            submissionDeadline:project.submissionDeadline,
          }
        : null,
    });
  } catch (err) {
    console.error("Workplace details error:", err);
    res.status(500).json({ message: "Server error" });
  }
};