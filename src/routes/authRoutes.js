const express = require("express");
const  authController = require("../controllers/AuthController");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.verifyOtpAndResetPassword);


module.exports = router;
