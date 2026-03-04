const SkillTrend = require("../models/SkillTrend");

const getSkillTrends = async (req, res) => {
  try {
    const trends = await SkillTrend.find();
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ New controller
const addSkillTrend = async (req, res) => {
  try {
    const trend = new SkillTrend(req.body);
    const saved = await trend.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSkillTrends, addSkillTrend };