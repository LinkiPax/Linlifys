const express = require('express');
const router = express.Router();
const VisitorCount = require('../model/VisitorCount');
const Stats = require('../model/VisitorCount');
app.post("/visit", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const { deviceId } = req.body;

  let visitor = await Visitor.findOne({ ip, deviceId });
  let isNew = false;

  if (!visitor) {
    visitor = await Visitor.create({
      ip,
      deviceId,
      firstVisit: new Date(),
      lastVisit: new Date()
    });

    await Stats.findOneAndUpdate(
      {},
      { $inc: { totalVisitors: 1 } },
      { upsert: true }
    );

    isNew = true;
  } else {
    visitor.lastVisit = new Date();
    await visitor.save();
  }

  const stats = await Stats.findOne({});
  res.json({
    isNew,
    totalVisitors: stats.totalVisitors
  });
});
module.exports = router;