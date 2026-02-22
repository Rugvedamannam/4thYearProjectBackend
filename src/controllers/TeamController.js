const Team = require("../models/Team");
const User = require("../models/User");
const mongoose = require("mongoose");

// Create a new team
exports.createTeam = async (req, res) => {
  try {
    const { name, hackathonId, projectId, members, maxSize, description } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Create team with current user as leader
    const teamMembers = [{
      userId: user._id,
      name: user.name,
      email: user.email,
      role: "leader",
      joinedAt: new Date()
    }];
    
    // Add other members if provided
    if (members && Array.isArray(members)) {
      for (const member of members) {
        const memberUser = await User.findOne({ email: member.email.toLowerCase() });
        if (memberUser && memberUser._id.toString() !== userId) {
          teamMembers.push({
            userId: memberUser._id,
            name: memberUser.name || member.name,
            email: memberUser.email,
            role: "member",
            joinedAt: new Date()
          });
        }
      }
    }
    
    const team = new Team({
      name,
      hackathonId,
      projectId: projectId || null,
      members: teamMembers,
      maxSize: maxSize || 4,
      description: description || ""
    });
    
    await team.save();
    
    res.status(201).json({
      success: true,
      team
    });
    
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ success: false, error: "Failed to create team" });
  }
};

// Get all teams for a user
exports.getUserTeams = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    const teams = await Team.find({
      memberEmails: user.email.toLowerCase(),
      status: "active"
    })
      .populate("hackathonId", "name theme")
      .populate("projectId", "projectName")
      .sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      teams
    });
    
  } catch (error) {
    console.error("Error fetching user teams:", error);
    res.status(500).json({ success: false, error: "Failed to fetch teams" });
  }
};

// Get team by ID
exports.getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const team = await Team.findById(teamId)
      .populate("hackathonId", "name theme banner")
      .populate("projectId", "projectName description");
    
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }
    
    res.status(200).json({
      success: true,
      team
    });
    
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ success: false, error: "Failed to fetch team" });
  }
};

// Get team members
exports.getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }
    
    // Get online status from socket for each member
    const membersWithStatus = team.members.map(member => ({
      ...member,
      isOnline: false // Will be updated by socket
    }));
    
    res.status(200).json({
      success: true,
      members: membersWithStatus,
      teamName: team.name,
      chatRoomId: team.chatRoomId
    });
    
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ success: false, error: "Failed to fetch team members" });
  }
};

// Add member to team
exports.addMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, name } = req.body;
    const userId = req.user.id;
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }
    
    // Check if requester is team leader
    const isLeader = team.members.some(
      m => m.userId.toString() === userId && m.role === "leader"
    );
    
    if (!isLeader) {
      return res.status(403).json({ success: false, error: "Only team leader can add members" });
    }
    
    // Check team size
    if (team.members.length >= team.maxSize) {
      return res.status(400).json({ success: false, error: "Team is full" });
    }
    
    // Check if member already exists
    if (team.memberEmails.includes(email.toLowerCase())) {
      return res.status(400).json({ success: false, error: "Member already in team" });
    }
    
    // Find user
    const memberUser = await User.findOne({ email: email.toLowerCase() });
    
    if (!memberUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Add member
    team.members.push({
      userId: memberUser._id,
      name: memberUser.name || name,
      email: memberUser.email,
      role: "member",
      joinedAt: new Date()
    });
    
    await team.save();
    
    res.status(200).json({
      success: true,
      message: "Member added successfully",
      team
    });
    
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ success: false, error: "Failed to add member" });
  }
};

// Remove member from team
exports.removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.user.id;
    
    const team = await Team.findById(teamId);
    
    if (!team) {
      return res.status(404).json({ success: false, error: "Team not found" });
    }
    
    // Check if requester is team leader
    const isLeader = team.members.some(
      m => m.userId.toString() === userId && m.role === "leader"
    );
    
    if (!isLeader && userId !== memberId) {
      return res.status(403).json({ success: false, error: "Only team leader can remove members" });
    }
    
    // Cannot remove leader
    const memberToRemove = team.members.find(m => m.userId.toString() === memberId);
    if (memberToRemove && memberToRemove.role === "leader") {
      return res.status(400).json({ success: false, error: "Cannot remove team leader" });
    }
    
    team.members = team.members.filter(m => m.userId.toString() !== memberId);
    await team.save();
    
    res.status(200).json({
      success: true,
      message: "Member removed successfully",
      team
    });
    
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ success: false, error: "Failed to remove member" });
  }
};

// Get direct message room ID between two users
exports.getDirectRoomId = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;
    
    // Create a consistent room ID for direct messages
    const sortedIds = [userId, otherUserId].sort();
    const roomId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
    
    // Get other user info
    const otherUser = await User.findById(otherUserId).select("name email");
    
    if (!otherUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      roomId,
      otherUser: {
        id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email
      }
    });
    
  } catch (error) {
    console.error("Error getting direct room ID:", error);
    res.status(500).json({ success: false, error: "Failed to get room ID" });
  }
};

// Get all conversations (teams + direct messages + hackathon chats) for chat sidebar
exports.getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id.toString();
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    
    // Get user's teams
    const teams = await Team.find({
      memberEmails: user.email.toLowerCase(),
      status: "active"
    })
      .populate("hackathonId", "name")
      .sort({ updatedAt: -1 });
    
    // Format teams as conversations
    const teamConversations = teams.map(team => ({
      id: team._id,
      roomId: team.chatRoomId || team._id.toString(),
      name: team.name,
      type: "team",
      memberCount: team.members.length,
      hackathonName: team.hackathonId?.name || "",
      hackathonId: team.hackathonId?._id || null,
      lastMessage: null,
      updatedAt: team.updatedAt
    }));
    
    // Get hackathons user is part of (via teams or as organizer)
    const Hackathon = require("../models/Hackathon");
    const hackathonIds = teams.map(t => t.hackathonId?._id).filter(Boolean);
    
    // Also get hackathons where user is organizer
    const organizerHackathons = await Hackathon.find({
      organizerEmail: user.email.toLowerCase(),
      published: true
    }).select("_id name theme banner");
    
    const allHackathonIds = [...new Set([
      ...hackathonIds.map(id => id.toString()),
      ...organizerHackathons.map(h => h._id.toString())
    ])];
    
    // Get unique hackathons
    const uniqueHackathons = await Hackathon.find({
      _id: { $in: allHackathonIds }
    }).select("_id name theme banner");
    
    // Format hackathons as conversations
    const hackathonConversations = uniqueHackathons.map(h => ({
      id: h._id,
      roomId: `hackathon_${h._id.toString()}`,
      name: h.name,
      type: "hackathon",
      theme: h.theme,
      banner: h.banner,
      lastMessage: null,
      updatedAt: h.updatedAt || new Date()
    }));
    
    // Get direct message conversations from recent messages
    const Message = require("../models/Message");
    const directChats = await Message.aggregate([
      { 
        $match: { 
          roomType: "direct",
          roomId: { $regex: `dm_.*${userId}.*|dm_${userId}_.*` }
        } 
      },
      { 
        $group: { 
          _id: "$roomId",
          lastMessage: { $last: "$text" },
          lastMessageTime: { $last: "$createdAt" },
          participants: { $addToSet: "$senderId" }
        } 
      },
      { $sort: { lastMessageTime: -1 } }
    ]);
    
    // Format direct chats
    const directConversations = [];
    for (const chat of directChats) {
      const ids = chat._id.replace("dm_", "").split("_");
      const otherUserId = ids.find(id => id !== userId);
      
      if (otherUserId) {
        try {
          const otherUser = await User.findById(otherUserId).select("name email");
          if (otherUser) {
            directConversations.push({
              id: chat._id,
              roomId: chat._id,
              name: otherUser.name || otherUser.email,
              type: "direct",
              otherUserId: otherUser._id.toString(),
              otherUserEmail: otherUser.email,
              lastMessage: chat.lastMessage,
              updatedAt: chat.lastMessageTime
            });
          }
        } catch (e) {
          console.error("Error fetching other user:", e);
        }
      }
    }
    
    // Combine and sort by last activity
    const allConversations = [...teamConversations, ...hackathonConversations, ...directConversations]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    res.status(200).json({
      success: true,
      conversations: allConversations,
      teams: teamConversations,
      hackathons: hackathonConversations,
      directMessages: directConversations
    });
    
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ success: false, error: "Failed to fetch conversations" });
  }
};
