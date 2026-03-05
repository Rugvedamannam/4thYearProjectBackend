const Profile = require("../models/Profile");

/* =========================
   GET PROFILE BY EMAIL
   ========================= */
exports.getProfile = async (req, res) => {
  try {
    let { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }


    const profile = await Profile.findOne({ email });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


/* =========================
   CREATE PROFILE
   ========================= */
exports.createProfile = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 🔥 remove mailto if exists
    email = email.replace("mailto:", "").toLowerCase();

    const existingProfile = await Profile.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ message: "Profile already exists" });
    }

    const newProfile = new Profile({
      ...req.body,
      email
    });

    await newProfile.save();
    res.status(201).json(newProfile);

  } catch (error) {
    res.status(500).json({ message: "Error Creating Profile" });
  }
};


/* =========================
   UPDATE PROFILE
   ========================= */
exports.updateProfile = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required for update" });
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { email },          // find by email instead of ID
      req.body,
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(updatedProfile);
  } catch (error) {
    res.status(500).json({ message: "Update Failed" });
  }
};