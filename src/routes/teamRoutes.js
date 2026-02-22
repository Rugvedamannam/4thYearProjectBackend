const express = require("express");
const router = express.Router();
const TeamController = require("../controllers/TeamController");
const auth = require("../middlewares/auth");

// Create a new team
router.post("/create", auth, TeamController.createTeam);

// Get all teams for logged-in user
router.get("/my-teams", auth, TeamController.getUserTeams);

// Get all conversations (teams + direct messages) for chat sidebar
router.get("/conversations", auth, TeamController.getAllConversations);

// Get team by ID
router.get("/:teamId", auth, TeamController.getTeamById);

// Get team members
router.get("/:teamId/members", auth, TeamController.getTeamMembers);

// Add member to team
router.post("/:teamId/members", auth, TeamController.addMember);

// Remove member from team
router.delete("/:teamId/members/:memberId", auth, TeamController.removeMember);

// Get direct message room ID with another user
router.get("/dm/:otherUserId", auth, TeamController.getDirectRoomId);

module.exports = router;
