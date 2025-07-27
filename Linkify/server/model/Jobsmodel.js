const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, required: true },
  Company: { type: String, required: true },
  Location: { type: String, required: true },
  Salary: { type: String, required: true },
  Experience: { type: String, required: true },
  Skills: { type: [String], required: true },
  Email: { type: String, required: true },
  Phone: { type: String },
  Website: { type: String },
  Type: { 
    type: String, 
    required: true,
    enum: ['fulltime', 'parttime', 'internship', 'remote']
  },
  Requirements: { type: [String] },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);