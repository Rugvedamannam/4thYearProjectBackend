// controllers/ProjectController.js
const Project = require("../models/ProjectModel");

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
    const projects = await Project.find({
      organizerEmail: req.user.email
    })
      .populate("hackathonId", "name")   // ⭐ IMPORTANT
      .sort({ createdAt: -1 });

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