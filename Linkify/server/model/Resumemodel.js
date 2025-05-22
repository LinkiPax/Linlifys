const mongoose = require("mongoose");

// Define Resume Schema
const resumeSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // To associate resumes with specific users
  fileName: { type: String, required: true },
  filePath: { type: String, required: true }, // Path or URL of the uploaded file
  jobDescription: { type: String, required: false }, // Job description to compare skills
  analysisResult: {
    matchPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // Ensure matchPercentage is between 0 and 100
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100, // Ensure atsScore is between 0 and 100
    },
    skillsMatch: {
      Programming: {
        type: [String],
        required: true,
        validate: [array => array.every(item => typeof item === 'string'), 'Programming skills must be an array of strings'], 
      },
      DataScience: {
        type: [String],
        required: true,
        validate: [array => array.every(item => typeof item === 'string'), 'Data Science skills must be an array of strings'],
      },
      DevOps: {
        type: [String],
        required: true,
        validate: [array => array.every(item => typeof item === 'string'), 'DevOps skills must be an array of strings'],
      },
    },
    recommendations: { type: [String], required: true }, // Suggestions to improve the resume
  },
  createdAt: { type: Date, default: Date.now }, // Date when the resume was uploaded
  updatedAt: { type: Date, default: Date.now }, // Date when the resume was last updated
});

// Pre-save hook to transform data before saving
resumeSchema.pre('save', function (next) {
  // Ensure that skillsMatch is in the correct format
  if (this.analysisResult.skillsMatch) {
    // Ensure each skill category is an array of strings
    ['Programming', 'DataScience', 'DevOps'].forEach(category => {
      if (!Array.isArray(this.analysisResult.skillsMatch[category])) {
        this.analysisResult.skillsMatch[category] = [];
      } else {
        this.analysisResult.skillsMatch[category] = this.analysisResult.skillsMatch[category].map(item => String(item));
      }
    });
  }
  // Update the updatedAt field before saving
  this.updatedAt = Date.now();
  next();
});

// Ensure proper validation on matchPercentage and atsScore
resumeSchema.path('analysisResult.matchPercentage').validate(function (value) {
  return value >= 0 && value <= 100; // Match percentage must be between 0 and 100
}, 'matchPercentage must be between 0 and 100');

resumeSchema.path('analysisResult.atsScore').validate(function (value) {
  return value >= 0 && value <= 100; // ATS score must be between 0 and 100
}, 'atsScore must be between 0 and 100');

// Create model
const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
