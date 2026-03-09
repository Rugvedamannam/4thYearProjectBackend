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

// ======================
// GET PARTICIPANTS FOR PARTICIPANTS PAGE
// ======================

exports.getParticipantsForHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    if (!hackathonId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID is required",
      });
    }

    const participants = await Student.find({ hackathonId })
      .select(
        "name email college skills state degree yearOfStudy createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: participants.length,
      participants,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch participants",
    });
  }
};

// ======================
// GET HACKATHONS REGISTERED BY PARTICIPANT
// ======================

exports.getRegisteredHackathons = async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    // console.log("Fetching registered hackathons for email:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // 1️⃣ find registrations of this participant
    const registrations = await Student.find({ email });

    if (!registrations.length) {
      return res.json([]);
    }

    // 2️⃣ extract hackathon IDs
    const hackathonIds = registrations.map((r) => r.hackathonId);

    // 3️⃣ fetch hackathons
    const hackathons = await Hackathon.find({
      _id: { $in: hackathonIds },
      published: true,
    }).sort({ createdAt: -1 });

    res.json(hackathons);
  } catch (err) {
    console.error("Error fetching registered hackathons:", err);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.checkRegistration = async (req, res) => {

  try {

    const { email, hackathonId } = req.query;

    const existing = await Student.findOne({
      email,
      hackathonId,
    });

    if (existing) {
      return res.json({ registered: true });
    }

    res.json({ registered: false });

  } catch (error) {

    console.error("Check registration error:", error);

    res.status(500).json({
      message: "Server error",
    });

  }

};