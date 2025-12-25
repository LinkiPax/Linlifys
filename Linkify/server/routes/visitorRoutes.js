const express = require("express");
const router = express.Router();

const Visitor = require("../model/VisitorCount");
const Stats = require("../model/Stats");

router.post("/visit", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID required" });
    }

    let visitor = await Visitor.findOne({ ip, deviceId });
    let isNew = false;

    if (!visitor) {
      await Visitor.create({
        ip,
        deviceId,
        firstVisit: new Date(),
        lastVisit: new Date(),
      });

      await Stats.findOneAndUpdate(
        {},
        { $inc: { totalVisitors: 1 } },
        { upsert: true, new: true }
      );

      isNew = true;
    } else {
      visitor.lastVisit = new Date();
      await visitor.save();
    }

    const stats = await Stats.findOne({});

    res.json({
      isNew,
      totalVisitors: stats?.totalVisitors || 0,
    });
  } catch (err) {
    console.error("Visit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
