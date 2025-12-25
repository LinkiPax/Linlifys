const mongoose = require('mongoose');
const VisitorSchema = new mongoose.Schema({
  ip: String,
  deviceId: String,
  firstVisit: Date,
  lastVisit: Date,
});

const StatsSchema = new mongoose.Schema({
  totalVisitors: Number
});

module.exports = mongoose.model('VisitorCount', VisitorSchema);
module.exports = mongoose.model('Stats', StatsSchema);