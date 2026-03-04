const express = require("express");
const { getParticipants, addParticipant } = require("../controllers/participantController");

const router = express.Router();

router.get("/all", getParticipants);
router.post("/add", addParticipant); // ✅ NEW ROUTE

module.exports = router;