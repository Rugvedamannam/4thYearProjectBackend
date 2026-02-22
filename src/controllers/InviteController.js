const Invite = require("../models/Invite");
const Team = require("../models/Team");
const User = require("../models/User");

// Send an invite to join a team
exports.sendInvite = async (req, res) => {
  try {
    const { teamId, inviteeEmail, message } = req.body;
    const senderId = req.user.id || req.user._id;
    const sender = await User.findById(senderId);
    
    if (!sender) {
      return res.status(404).json({ success: false, error: "Sender not found" });
    }
    
    // Get team details
    const team = await Team.findById(teamId).populate("hackathonId", "name");
    
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }
    
    // Check if sender is a member of the team (preferably leader)
    const isMember = team.memberEmails.includes(sender.email.toLowerCase());
    if (!isMember) {
      return res.status(403).json({ success: false, error: "You must be a team member to send invites" });
    }
    
    // Check if invitee is already a team member
    if (team.memberEmails.includes(inviteeEmail.toLowerCase())) {
      return res.status(400).json({ success: false, error: "This person is already a team member" });
    }
    
    // Check if there's already a pending invite
    const existingInvite = await Invite.findOne({
      teamId,
      inviteeEmail: inviteeEmail.toLowerCase(),
      status: "pending"
    });
    
    if (existingInvite) {
      return res.status(400).json({ success: false, error: "An invite is already pending for this email" });
    }
    
    // Check if invitee is a registered user
    const invitee = await User.findOne({ email: inviteeEmail.toLowerCase() });
    
    // Create the invite
    const invite = new Invite({
      teamId: team._id,
      senderId: sender._id,
      senderName: sender.name,
      senderEmail: sender.email,
      inviteeEmail: inviteeEmail.toLowerCase(),
      inviteeId: invitee ? invitee._id : null,
      teamName: team.name,
      hackathonId: team.hackathonId?._id || null,
      hackathonName: team.hackathonId?.name || "",
      message: message || ""
    });
    
    await invite.save();
    
    // Emit socket event if io is available (real-time notification)
    const io = req.app.get("io");
    if (io && invitee) {
      io.emit("new_invite", {
        inviteId: invite._id,
        inviteeId: invitee._id.toString(),
        teamName: team.name,
        senderName: sender.name
      });
    }
    
    res.status(201).json({
      success: true,
      message: "Invite sent successfully",
      invite
    });
    
  } catch (error) {
    console.error("Error sending invite:", error);
    res.status(500).json({ success: false, error: "Failed to send invite" });
  }
};

// Get pending invites for current user
exports.getMyInvites = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Get invites by email (since invites may have been sent before user registered)
    const invites = await Invite.find({
      inviteeEmail: user.email.toLowerCase(),
      status: "pending",
      expiresAt: { $gt: new Date() }
    })
      .populate("teamId", "name members")
      .populate("hackathonId", "name theme")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      invites,
      count: invites.length
    });
    
  } catch (error) {
    console.error("Error fetching invites:", error);
    res.status(500).json({ success: false, error: "Failed to fetch invites" });
  }
};

// Accept an invite
exports.acceptInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    const invite = await Invite.findById(inviteId);
    
    if (!invite) {
      return res.status(404).json({ success: false, error: "Invite not found" });
    }
    
    // Verify this invite is for the current user
    if (invite.inviteeEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: "This invite is not for you" });
    }
    
    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, error: `Invite has already been ${invite.status}` });
    }
    
    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();
      return res.status(400).json({ success: false, error: "Invite has expired" });
    }
    
    // Get the team
    const team = await Team.findById(invite.teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, error: "Team no longer exists" });
    }
    
    // Check team size
    if (team.members.length >= team.maxSize) {
      return res.status(400).json({ success: false, error: "Team is full" });
    }
    
    // Add user to team
    team.members.push({
      userId: user._id,
      name: user.name,
      email: user.email,
      role: "member",
      joinedAt: new Date()
    });
    
    await team.save();
    
    // Update invite status
    invite.status = "accepted";
    invite.inviteeId = user._id;
    await invite.save();
    
    // Notify team members via socket
    const io = req.app.get("io");
    if (io) {
      io.to(team.chatRoomId || team._id.toString()).emit("member_joined", {
        userId: user._id,
        userName: user.name,
        teamId: team._id
      });
    }
    
    res.status(200).json({
      success: true,
      message: "You have joined the team!",
      team
    });
    
  } catch (error) {
    console.error("Error accepting invite:", error);
    res.status(500).json({ success: false, error: "Failed to accept invite" });
  }
};

// Decline an invite
exports.declineInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    const invite = await Invite.findById(inviteId);
    
    if (!invite) {
      return res.status(404).json({ success: false, error: "Invite not found" });
    }
    
    // Verify this invite is for the current user
    if (invite.inviteeEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: "This invite is not for you" });
    }
    
    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, error: `Invite has already been ${invite.status}` });
    }
    
    invite.status = "declined";
    await invite.save();
    
    res.status(200).json({
      success: true,
      message: "Invite declined"
    });
    
  } catch (error) {
    console.error("Error declining invite:", error);
    res.status(500).json({ success: false, error: "Failed to decline invite" });
  }
};

// Get invites sent by current user
exports.getSentInvites = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const invites = await Invite.find({ senderId: userId })
      .populate("teamId", "name")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      invites
    });
    
  } catch (error) {
    console.error("Error fetching sent invites:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sent invites" });
  }
};

// Cancel a sent invite
exports.cancelInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const userId = req.user.id || req.user._id;
    
    const invite = await Invite.findById(inviteId);
    
    if (!invite) {
      return res.status(404).json({ success: false, error: "Invite not found" });
    }
    
    if (invite.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: "You can only cancel your own invites" });
    }
    
    if (invite.status !== "pending") {
      return res.status(400).json({ success: false, error: `Cannot cancel - invite has been ${invite.status}` });
    }
    
    await Invite.findByIdAndDelete(inviteId);
    
    res.status(200).json({
      success: true,
      message: "Invite cancelled"
    });
    
  } catch (error) {
    console.error("Error cancelling invite:", error);
    res.status(500).json({ success: false, error: "Failed to cancel invite" });
  }
};
