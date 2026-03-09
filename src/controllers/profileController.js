const User = require("../models/User");
const Registration = require("../models/StudentRegistration"); // your registration model
const Profile = require("../models/Profile");

/* ================= GET PROFILE ================= */

const getProfile = async (req, res) => {
  try {

    const email = req.query.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    /* get registration details if exists */
    const registration = await Registration.findOne({ email });

    const profileData = {
      name: user.name,
      email: user.email,
      role: user.role,

      /* editable fields */
      about: registration?.about || "",
      location: registration?.location || "",
      linkedin: registration?.linkedin || "",
      github: registration?.github || "",
      skills: registration?.skills || [],

      avatar: user.name
        ? user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
        : "U"
    };

    res.status(200).json(profileData);

  } catch (error) {

    console.error("Profile fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};


/* ================= UPDATE PROFILE ================= */

const updateProfile = async (req, res) => {
  try {

    const email = req.query.email?.toLowerCase();
    console.log("Updating profile for email:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email required"
      });
    }

    const {
      about,
      location,
      linkedin,
      github,
      skills,
      occupation,
      company,
      college
    } = req.body;

    let profile = await Profile.findOne({ email });

    /* If profile doesn't exist create one */

    if (!profile) {

      profile = new Profile({
        email,
        about,
        location,
        linkedin,
        github,
        skills,
        role: occupation,
        company,
        college
      });

    } 
    else {

      profile.about = about;
      profile.location = location;
      profile.linkedin = linkedin;
      profile.github = github;
      profile.skills = skills;
      profile.role = occupation;

      if (occupation === "student") {
        profile.college = college;
        profile.company = "";
      }

      if (occupation === "company") {
        profile.company = company;
        profile.college = "";
      }

    }

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile
    });

  } catch (error) {

    console.error("Profile update error:", error);

    res.status(500).json({
      success: false,
      message: "Server error"
    });

  }
};

module.exports = {
  updateProfile
};

module.exports = {
  getProfile,
  updateProfile
};