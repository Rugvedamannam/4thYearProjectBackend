const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
{
  /* BASIC USER INFO */

  name: {
    type: String
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  avatar: {
    type: String
  },

  role: {
    type: String
  },

  /* PROFESSIONAL DETAILS */

  location: {
    type: String,
    default: ""
  },

  linkedin: {
    type: String,
    default: ""
  },

  github: {
    type: String,
    default: ""
  },

  occupation: {
    type: String,
    enum: ["student", "company", ""],
    default: ""
  },

  college: {
    type: String,
    default: ""
  },

  company: {
    type: String,
    default: ""
  },

  /* ABOUT */

  about: {
    type: String,
    default: ""
  },

  skills: {
    type: [String],
    default: []
  }

},
{
  timestamps: true
}
);

module.exports = mongoose.model("Profile", profileSchema);