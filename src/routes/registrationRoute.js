const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  registerStudent,
  getAllRegistrations,
  getRegistrationsByHackathon,
} = require("../controllers/RegistrationController");

const router = express.Router();


// ======================
// MULTER CONFIG
// ======================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });


// ======================
// ROUTES
// ======================

// Register student
router.post("/", upload.single("resume"), registerStudent);

// All registrations
router.get("/", getAllRegistrations);

// Registrations for a specific hackathon
router.get("/hackathon/:hackathonId", getRegistrationsByHackathon);

module.exports = router;