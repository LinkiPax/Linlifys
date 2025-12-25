const mongoose = require("mongoose");

const StatsSchema = new mongoose.Schema({
  totalVisitors: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("Stats", StatsSchema);
