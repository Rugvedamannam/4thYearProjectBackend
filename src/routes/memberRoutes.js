const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");


router.get("/members", memberController.getMembers);
router.get("/members/:id", memberController.getMemberById);
router.delete("/members/:id", memberController.deleteMember);

module.exports = router;