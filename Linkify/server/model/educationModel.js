const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collegeName: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  gpa: { type: String },
  description: { type: String },
  skills: { type: String },
  // New fields for college data
  university: { type: String },
  collegeType: { type: String },
  state: { type: String },
  district: { type: String },
  createdAt: { type: Date, default: Date.now },
  logo:{type:String}
});

module.exports = mongoose.model("Education", educationSchema);