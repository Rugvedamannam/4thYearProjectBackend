const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    hackathonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },

    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    state: { type: String, required: true },

    github: String,
    linkedin: String,

    college: { type: String, required: true },
    degree: { type: String, required: true },
    yearOfStudy: { type: String, required: true },
    graduationYear: { type: String, required: true },

    skills: { type: String, required: true },

    hackathon: { type: String, required: true }, // participated before (Yes/No)

    resume: { type: String, required: true },

    c1: Boolean,
    c2: Boolean,
    c3: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentRegistration", studentSchema);