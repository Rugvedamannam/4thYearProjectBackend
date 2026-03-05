const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const Project = require("../models/ProjectModel");
const User = require("../models/User");
const path = require("path");
const parsePdfWithPython = require("../utils/parsePdfWithPython");
const StudentRegistration = require("../models/StudentRegistration");
const axios = require("axios"); 
const fs = require("fs");
const FormData = require("form-data");

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


// UPDATE GENERAL INFO
exports.updateGeneralInfo = async (req, res) => {
  try {
    const hackathonId = req.params.id;

    if (!req.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: "Hackathon not found" });
    }

    // 🔐 Organizer check
    if (hackathon.organizerEmail !== req.user.email.toLowerCase()) {
      return res.status(403).json({
        message: "Only organizer can update hackathon",
      });
    }

    /* ---------- ONLY ALLOWED FIELDS ---------- */
    const { name, theme, mode, description } = req.body;

    if (name !== undefined) hackathon.name = name;
    if (theme !== undefined) hackathon.theme = theme;
    if (mode !== undefined) hackathon.mode = mode;
    if (description !== undefined) hackathon.description = description;

    /* ---------- Banner Upload ---------- */
    if (req.file) {
      hackathon.banner = `/uploads/hackathons/${req.file.filename}`;
    }

    await hackathon.save();

    res.json({
      message: "General info updated successfully",
      hackathon,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.autoFormTeams = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    // 1️⃣ Check hackathon exists
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        error: "Hackathon not found"
      });
    }

    // 2️⃣ Get registrations
    const registrations = await StudentRegistration.find({ hackathonId });

    if (!registrations.length) {
      return res.status(400).json({
        success: false,
        error: "No registrations found"
      });
    }

    // 3️⃣ Get projects
    const projects = await Project.find({ hackathonId });

    if (!projects.length) {
      return res.status(400).json({
        success: false,
        error: "No projects found"
      });
    }

    // 4️⃣ Prepare FormData
    const formData = new FormData();

    const formattedProjects = projects.map((proj) => ({
      projectId: proj._id.toString(),
      projectName: proj.projectName,
      description: proj.description || "",
      techstack: proj.techstack || []
    }));

    const formattedParticipants = registrations.map((reg) => ({
      participantId: reg._id.toString(),
      participantName: reg.name,
      githubProfile: reg.github || ""
    }));

    formData.append("projects", JSON.stringify(formattedProjects));
    formData.append("participantData", JSON.stringify(formattedParticipants));

    // 5️⃣ Attach resumes (same order as participants)
    for (let reg of registrations) {

      if (!reg.resume) {
        console.log("No resume for:", reg.email);
        continue;
      }

      const fixedPath = reg.resume.replace(/\\/g, "/");
      const resumePath = path.join(process.cwd(), fixedPath);

      console.log("Looking for resume at:", resumePath);

      if (!fs.existsSync(resumePath)) {
        console.log("Resume not found:", resumePath);
        continue;
      }

      formData.append(
        "resumes",
        fs.createReadStream(resumePath),
        path.basename(resumePath)
      );
    }

    // 6️⃣ Call AI API
    const aiResponse = await axios.post(
      "https://skillsyncai-api.onrender.com/api/v2/form-teams",
      formData,
      {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const formedTeams = aiResponse.data.teams;

    console.log("AI RESPONSE:", JSON.stringify(formedTeams, null, 2));

    // 7️⃣ Delete old teams
    await Team.deleteMany({ hackathonId });

    // 8️⃣ Save new teams
    for (const team of formedTeams) {

      const members = [];

      for (let i = 0; i < team.members.length; i++) {

        const member = team.members[i];

        // ✅ Support snake_case & camelCase
        const participantId =
          member.participant_id || member.participantId;

        if (!participantId) {
          console.log("AI returned member without participant_id:", member);
          continue;
        }

        const registration = await StudentRegistration.findById(participantId);

        if (!registration) {
          console.log("No registration found for:", participantId);
          continue;
        }

        const user = await User.findOne({
          email: registration.email.toLowerCase()
        });

        if (!user) {
          console.log("No user found for email:", registration.email);
          continue;
        }

        members.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          role: i === 0 ? "leader" : "member",
          joinedAt: new Date()
        });
      }

      // 🚨 Prevent saving empty teams
      if (members.length === 0) {
        console.log("Skipping team with no valid members:", team.team_name);
        continue;
      }

      const matchedProject = projects.find(
        p => p._id.toString() === team.project_id
      );

      await Team.create({
  name: team.team_name,
  hackathonId,
  organizerEmail: hackathon.organizerEmail, // ✅ from hackathon
  projectId: matchedProject?._id || null,
  members,
  maxSize: team.team_size || members.length,
  description: "AI Generated Team"
});
    }

    res.status(200).json({
      success: true,
      message: "Teams formed successfully"
    });

  } catch (error) {

    console.error("Auto team formation error:", error);

    if (error.response) {
      console.error("AI ERROR RESPONSE:", error.response.data);
    }

    res.status(500).json({
      success: false,
      error: "Failed to form teams"
    });
  }
};
