const express = require("express");
const router = express.Router();
const { getTeamsForEdit } = require("../controllers/EditTeamController");
router.get("/", getTeamsForEdit);


// router.post("/bulk", teamController.createTeams);
module.exports = router;