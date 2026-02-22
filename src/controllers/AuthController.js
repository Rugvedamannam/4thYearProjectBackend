const User = require("../models/User");
const sendMail = require("../utils/sendMail");
const jwt = require("jsonwebtoken");

// ✅ OTP Email template
const otpEmailTemplate = (otp) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial; background:#f4f6f8; padding:20px;">
  <div style="max-width:500px; margin:auto; background:#fff; padding:20px; border-radius:8px;">
    <h2 style="text-align:center;">Password Reset OTP For Your Account</h2>
    <p style="text-align:center;">Use the OTP below to reset your password</p>
    <h1 style="text-align:center; letter-spacing:6px;">${otp}</h1>
    <p style="text-align:center;">Valid for <b>5 minutes</b></p>
  </div>
</body>
</html>
`;

// 🔑 Helper: generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: "7d" } // Extended to 7 days
  );
};

// -------------------- SIGNUP --------------------
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!role || !["participant", "organizer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role });

    // 🔑 Generate token on signup
    const token = generateToken(user);

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- LOGIN --------------------
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!role || !["participant", "organizer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.role !== role) {
      return res.status(403).json({
        message: `You are registered as ${user.role}. Please login from ${user.role} portal.`,
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- FORGOT PASSWORD --------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    const html = otpEmailTemplate(otp);
    await sendMail(email, "Password Reset OTP", html);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- VERIFY OTP & RESET PASSWORD --------------------
exports.verifyOtpAndResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// -------------------- SEARCH USERS --------------------
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id || req.user._id;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: "Search query must be at least 2 characters" 
      });
    }
    
    // Search by name or email (case insensitive)
    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
      .select("name email role createdAt")
      .limit(20);
    
    res.status(200).json({
      success: true,
      users,
      count: users.length
    });
    
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ success: false, error: "Failed to search users" });
  }
};

// -------------------- GET ALL USERS (for chat) --------------------
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id || req.user._id;
    
    const users = await User.find({
      _id: { $ne: currentUserId }
    })
      .select("name email role createdAt")
      .sort({ name: 1 })
      .limit(100);
    
    res.status(200).json({
      success: true,
      users,
      count: users.length
    });
    
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
};
