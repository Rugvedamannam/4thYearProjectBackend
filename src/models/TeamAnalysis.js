const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  name: String,
  action: String,
  target: String,
  time: String,
});

const teamAnalysisSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["hackathon", "project"],
      required: true,
    },

    synergyScore: {
      value: Number,
      delta: String,
    },
    velocity: {
      value: Number,
      delta: String,
    },
    skillGap: {
      value: Number,
      delta: String,
    },
    happinessIndex: {
      value: Number,
      delta: String,
    },

    metricComparison: {
      commits: [Number],
      designTasks: [Number],
    },

    stackProficiency: [
      {
        label: String,
        value: Number,
      },
    ],

    timeAllocation: {
      coding: Number,
      meetings: Number,
      research: Number,
      planning: Number,
    },

    recentActivities: [activitySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("TeamAnalysis", teamAnalysisSchema);