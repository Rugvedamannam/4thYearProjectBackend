const express = require("express");
const authController = require("../controllers/AuthController");
const { authenticate } = require("../middlewares/auth");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.verifyOtpAndResetPassword);

// Protected routes for user search
router.get("/users/search", authenticate, authController.searchUsers);
router.get("/users", authenticate, authController.getAllUsers);

module.exports = router;
