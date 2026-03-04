const express = require("express");
const router = express.Router();
const {
  getMembers,
  getMemberById,
  createMember,
  deleteMember,
} = require("../controllers/memberController");

router.get("/", getMembers);
router.get("/:id", getMemberById);
router.post("/", createMember);
router.delete("/:id", deleteMember);

module.exports = router;