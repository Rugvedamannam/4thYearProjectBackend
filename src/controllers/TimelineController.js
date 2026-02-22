const Timeline = require("../models/TimeLinePhase");
const Hackathon = require("../models/Hackathon");


/* ================= CREATE PHASE ================= */

exports.createPhase = async (req, res) => {
  try {
    const { hackathonId, title, description, startDate, endDate, icon, order } =
      req.body;

    // 🔐 Verify organizer owns this hackathon
    const hackathon = await Hackathon.findById(hackathonId);

    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    if (hackathon.organizerEmail !== req.user.email) {
      return res.status(403).json({
        message: "Only organizer can add timeline phases",
      });
    }

    const phase = new Timeline({
      hackathonId,
      title,
      description,
      startDate,
      endDate,
      icon,
      order,
    });

    await phase.save();

    res.status(201).json({
      message: "Phase created successfully",
      phase,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



/* ================= GET PHASES ================= */

exports.getPhasesByHackathon = async (req, res) => {
  try {
    const phases = await Timeline.find({
      hackathonId: req.params.hackathonId,
    }).sort({ order: 1 });

    res.json(phases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



/* ================= UPDATE PHASE ================= */

exports.updatePhase = async (req, res) => {
  try {
    const phase = await Timeline.findById(req.params.id);

    if (!phase) {
      return res.status(404).json({ message: "Phase not found" });
    }

    // 🔐 Check organizer ownership
    const hackathon = await Hackathon.findById(phase.hackathonId);

    if (hackathon.organizerEmail !== req.user.email) {
      return res.status(403).json({
        message: "Only organizer can update timeline",
      });
    }

    Object.assign(phase, req.body);
    await phase.save();

    res.json({
      message: "Phase updated successfully",
      phase,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



/* ================= DELETE PHASE ================= */

exports.deletePhase = async (req, res) => {
  try {
    const phase = await Timeline.findById(req.params.id);

    if (!phase) {
      return res.status(404).json({ message: "Phase not found" });
    }

    const hackathon = await Hackathon.findById(phase.hackathonId);

    if (hackathon.organizerEmail !== req.user.email) {
      return res.status(403).json({
        message: "Only organizer can delete timeline",
      });
    }

    await phase.deleteOne();

    res.json({ message: "Phase deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};