const express = require("express");
const router = express.Router();
const Connection = require('../model/connectionmodel');

// Check connection status between two users
router.get("/status/:user1/:user2", async (req, res) => {
  try {
    const { user1, user2 } = req.params;

    const connection = await Connection.findOne({
      $or: [
        { senderId: user1, receiverId: user2 },
        { senderId: user2, receiverId: user1 },
      ],
    });

    if (!connection) return res.json({ status: "none" });
    if (connection.status === "connected") return res.json({ status: "connected" });

    if (connection.senderId.toString() === user1)
      return res.json({ status: "pending" }); // user1 sent request

    return res.json({ status: "accept" }); // user1 received request
  } catch (err) {
    console.error('Error checking connection status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send connection request
router.post("/request", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Missing user IDs' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot connect with yourself' });
    }

    const existing = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (existing) {
      return res.status(400).json({ error: "Connection already exists" });
    }

    await Connection.create({ senderId, receiverId, status: "pending" });
    res.json({ message: "Connection request sent" });
  } catch (err) {
    console.error('Error sending connection request:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Accept connection request
router.post("/accept", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Missing user IDs' });
    }

    const connection = await Connection.findOneAndUpdate(
      { senderId, receiverId, status: "pending" },
      { status: "connected" },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Add to each other's connections list
    await User.findByIdAndUpdate(receiverId, {
      $addToSet: { connections: senderId }
    });
    
    await User.findByIdAndUpdate(senderId, {
      $addToSet: { connections: receiverId }
    });

    res.json({ message: "Connection accepted" });
  } catch (err) {
    console.error('Error accepting connection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject or withdraw connection
router.post("/withdraw", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Missing user IDs' });
    }

    const deleted = await Connection.findOneAndDelete({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    });

    if (!deleted) {
      return res.status(404).json({ error: "No connection to remove" });
    }

    // Remove from connections list if they were connected
    if (deleted.status === 'connected') {
      await User.findByIdAndUpdate(senderId, {
        $pull: { connections: receiverId }
      });
      
      await User.findByIdAndUpdate(receiverId, {
        $pull: { connections: senderId }
      });
    }

    res.json({ message: "Connection removed" });
  } catch (err) {
    console.error('Error withdrawing connection:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pending requests
router.get("/pending/:userId", async (req, res) => {
  try {
    const pendingRequests = await Connection.find({
      receiverId: req.params.userId,
      status: "pending"
    }).populate('senderId', 'username profilePicture');

    res.json(pendingRequests);
  } catch (err) {
    console.error('Error fetching pending requests:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;