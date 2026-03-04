const Student = require("../models/StudentRegistration");
const Hackathon = require("../models/Hackathon");


// ======================
// REGISTER STUDENT
// ======================

exports.registerStudent = async (req, res) => {
  try {
    const data = req.body;

    // 🔴 Check hackathonId present
    if (!data.hackathonId) {
      return res.status(400).json({
        message: "Hackathon ID is required",
      });
    }

    // 🔴 Verify hackathon exists
    const hackathon = await Hackathon.findById(data.hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        message: "Hackathon not found",
      });
    }

    const student = new Student({
      ...data,
      resume: req.file?.path,
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      student,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ======================
// GET ALL REGISTRATIONS
// ======================

exports.getAllRegistrations = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("hackathonId", "name type") // 🔥 shows hackathon details
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching data",
    });
  }
};


// ======================
// GET REGISTRATIONS FOR ONE HACKATHON
// ======================

exports.getRegistrationsByHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const students = await Student.find({ hackathonId })
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Error fetching registrations" });
  }
};