const express = require("express");
const { getEventByType, createEvent } = require("../controllers/eventController");
const teamController = require("../controllers/teamAnalysisController");

const router = express.Router();

/* TEAM ANALYSIS ROUTES */
router.get(
  "/team-analysis/:type/:teamName",
  teamController.getTeamAnalysis
);

router.post(
  "/team-analysis",
  teamController.createTeamAnalysis
);

/* EVENT ROUTES */
router.get("/:type", getEventByType);
router.post("/create", createEvent);

module.exports = router;