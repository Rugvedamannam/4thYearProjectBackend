const express = require("express");
const router = express.Router();
const teamController = require("../controllers/EditTeamController");
router.get("/", teamController.getTeams);


router.post("/bulk", teamController.createTeams);
module.exports = router;