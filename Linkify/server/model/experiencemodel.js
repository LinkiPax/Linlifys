const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: String, required: true },
  jobTitle: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date }, // Optional for ongoing roles
  description: { type: String, required: true },
});

module.exports = mongoose.model("Experience", experienceSchema);
