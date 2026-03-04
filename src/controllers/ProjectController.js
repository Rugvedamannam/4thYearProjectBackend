// controllers/ProjectController.js
const Project = require("../models/ProjectModel");
const StudentRegistration = require("../models/StudentRegistration");

exports.createProject = async (req, res) => {
  try {
    const organizerEmail = req.user.email;

    const projectData = {
      ...req.body,
      organizerEmail,
      assets: {
        problemStatementPdf: req.files?.problemStatementPdf?.[0]?.path || null,
        dataset: req.files?.dataset?.[0]?.path || null,
        starterCode: req.files?.starterCode?.[0]?.path || null
      }
    };

    const project = new Project(projectData);
    await project.save();

    res.status(201).json({
      message: "Project created successfully",
      project
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // 1️⃣ Find hackathons where this user registered
    const registrations = await StudentRegistration.find({
      email: userEmail
    });

    const hackathonIds = registrations.map(r => r.hackathonId);
    console.log("Hackathon IDs from registrations:", hackathonIds);

    // 2️⃣ Get projects from those hackathons
    const projects = await Project.find({
      hackathonId: { $in: hackathonIds }
    }).populate("hackathonId", "name");
    console.log("Projects found for user:", projects);

    res.json(projects);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: "published" })
      .populate("hackathonId", "name");

    res.json(projects);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 📌 Get single project details by ID
exports.getProjectDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id)
      .populate("hackathonId", "name startDate endDate");
      // remove if you don't have teamMembers field
      console.log("Project details fetched:", project);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};