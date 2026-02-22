const router = require("express").Router();
const auth = require("../middlewares/auth");
const controller = require("../controllers/TimelineController");

// Create phase (Organizer only)
router.post("/", auth, controller.createPhase);

// Get timeline of a hackathon (logged users)
router.get("/:hackathonId", auth, controller.getPhasesByHackathon);

// Update phase
router.put("/:id", auth, controller.updatePhase);

// Delete phase
router.delete("/:id", auth, controller.deletePhase);

module.exports = router;