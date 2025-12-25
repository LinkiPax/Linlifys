const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema({
  ip: String,
  deviceId: String,
  firstVisit: Date,
  lastVisit: Date,
});

module.exports = mongoose.model("Visitor", VisitorSchema);
