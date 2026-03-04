const express = require("express");
const { getSkillTrends, addSkillTrend } = require("../controllers/skillTrendController");

const router = express.Router();

router.get("/all", getSkillTrends);
router.post("/add", addSkillTrend); // ✅ NEW

module.exports = router;