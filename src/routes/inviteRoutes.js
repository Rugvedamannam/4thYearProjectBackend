const express = require("express");
const router = express.Router();
const InviteController = require("../controllers/InviteController");
const auth = require("../middlewares/auth");

// Send an invite to join a team
router.post("/send", auth, InviteController.sendInvite);

// Get pending invites for current user
router.get("/my-invites", auth, InviteController.getMyInvites);

// Get invites sent by current user
router.get("/sent", auth, InviteController.getSentInvites);

// Accept an invite
router.post("/accept/:inviteId", auth, InviteController.acceptInvite);

// Decline an invite
router.post("/decline/:inviteId", auth, InviteController.declineInvite);

// Cancel a sent invite
router.delete("/cancel/:inviteId", auth, InviteController.cancelInvite);

module.exports = router;
