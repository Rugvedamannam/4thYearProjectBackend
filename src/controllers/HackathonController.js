const Hackathon = require("../models/Hackathon");
const path = require("path");
const parsePdfWithPython = require("../utils/parsePdfWithPython");

// CREATE HACKATHON
exports.createHackathon = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }
   console.log("📥 Received hackathon creation request from", req.user.email);
    const data = req.body;

    /* ================= FIX TYPES ================= */

    if (data.skills) {
      data.skills = JSON.parse(data.skills);
    }

    if (data.teamSize) {
      data.teamSize = Number(data.teamSize);
    }

    if (data.registrationStart)
      data.registrationStart = new Date(data.registrationStart);

    if (data.registrationEnd)
      data.registrationEnd = new Date(data.registrationEnd);

    if (data.hackathonStart)
      data.hackathonStart = new Date(data.hackathonStart);

    if (data.hackathonEnd)
      data.hackathonEnd = new Date(data.hackathonEnd);

    /* ================= VERIFY ORGANIZER EMAIL ================= */

    const tokenEmail = req.user.email.toLowerCase();

    if (data.organizerEmail.toLowerCase() !== tokenEmail) {
      return res.status(403).json({
        message: "Organizer email does not match logged-in user",
      });
    }

    data.organizerEmail = tokenEmail;

    /* ================= HANDLE FILES ================= */

    if (req.files?.banner) {
      data.banner = `/uploads/hackathons/${req.files.banner[0].filename}`;
    }

    if (req.files?.rulesPdf) {
      data.rulesPdf = `/uploads/hackathons/${req.files.rulesPdf[0].filename}`;
    }

    if (req.files?.participantsPdf) {
      const pdfFile = req.files.participantsPdf[0];
      data.participantsPdf = `/uploads/hackathons/${pdfFile.filename}`;

      const pdfPath = path.join(
        __dirname,
        "../uploads/hackathons",
        pdfFile.filename
      );

      try {
        const allowedEmails = await parsePdfWithPython(pdfPath);
        data.allowedParticipants = allowedEmails.map((e) =>
          e.toLowerCase().trim()
        );
      } catch (err) {
        console.error("PDF parsing failed:", err);
        data.allowedParticipants = [];
      }
    }

    const hackathon = new Hackathon(data);
    await hackathon.save();

    res.status(201).json({
      message: "Hackathon created successfully",
      hackathon,
    });
  } catch (err) {
    console.error("❌ Hackathon creation error:", err);
    res.status(400).json({
      message: "Creation failed",
      error: err.message,
    });
  }
};


// GET ALL HACKATHONS
// GET ALL HACKATHONS
exports.getAllHackathons = async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    console.log("📧 Current user email:", email);
    const hackathons = await Hackathon.find({ published: true }).sort({ createdAt: -1 });

    const response = hackathons.map(h => {
      let isAllowed = false;

      if (h.type === "public") {
        isAllowed = true; // public hackathon → everyone can see
      } else if (h.type === "private") {
        // private hackathon → only check if allowedParticipants includes email
        if (h.allowedParticipants?.length && email) {
          isAllowed = h.allowedParticipants.includes(email);
        } else {
          isAllowed = false; // private with no allowed participants → no access
        }
      }

      return {
        _id: h._id,
        name: h.name,
        banner: h.banner,
        type: h.type,
        participants: h.participants || 0,
        isAllowed,
      };
    });

    console.log("Allowed participants:", hackathons.map(h => h.allowedParticipants));
    console.log("Response with isAllowed:", response);

    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// GET HACKATHON BY ID
exports.getHackathonById = async (req, res) => {
  try {
    const email = req.query.email?.toLowerCase();
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return res.status(404).json({ message: "Hackathon not found" });

    if (
      hackathon.type === "private" &&
      hackathon.allowedParticipants?.length &&
      !hackathon.allowedParticipants.includes(email)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(hackathon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CHECK USER ACCESS
exports.checkUserAllowed = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const userEmail = req.user.email.toLowerCase();
    console.log("🔍 Checking access for", userEmail, "to hackathon", hackathonId);
    const hackathon = await Hackathon.findById(hackathonId);

    if (!hackathon) return res.status(404).json({ allowed: false });
    if (hackathon.type === "public") return res.json({ allowed: true });
    if (!hackathon.participantsPdf) return res.json({ allowed: false });

    const pdfPath = path.join(__dirname, "../uploads/hackathons", path.basename(hackathon.participantsPdf));
    const allowedEmails = await parsePdfWithPython(pdfPath);
    const isAllowed = allowedEmails.map(e => e.toLowerCase()).includes(userEmail);
    console.log("✅ Access check result for", userEmail, ":", isAllowed);
    res.json({ allowed: isAllowed });
  } catch (err) {
    console.error("Access check failed:", err);
    res.status(500).json({ allowed: false });
  }
};


// GET HACKATHONS CREATED BY LOGGED-IN ORGANIZER
exports.getMyHackathons = async (req, res) => {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const organizerEmail = req.user.email.toLowerCase();

    const hackathons = await Hackathon.find({
      organizerEmail: organizerEmail
    }).sort({ createdAt: -1 });
    console.log(`📋 Found ${hackathons.length} hackathons for organizer ${organizerEmail}`);

    res.json({
      count: hackathons.length,
      hackathons
    });

  } catch (err) {
    console.error("❌ Failed to fetch organizer hackathons:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


