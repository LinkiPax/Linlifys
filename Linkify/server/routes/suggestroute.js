const express = require('express');
const mongoose = require('mongoose');
const { getUserSuggestions } = require('../controller/controller');
const User = require('../model/usermodel');
const router = express.Router();
// Utility functions
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const getMutualConnections = async (userId, targetUserId) => {
  const [user, targetUser] = await Promise.all([
    User.findById(userId).select('connections'),
    User.findById(targetUserId).select('connections')
  ]);
  
  if (!user || !targetUser) return 0;
  
  return user.connections.filter(connId => 
    targetUser.connections.some(targetConnId => 
      targetConnId.equals(connId)
  ).length);
};

// Get connection suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .select('connections pendingRequests blockedUsers industry skills');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Exclude existing connections, pending requests, and blocked users
    const excludedIds = [
      ...user.connections,
      ...user.pendingRequests,
      ...user.blockedUsers,
      userId
    ];

    // Find users with similar industry or skills
    const suggestions = await User.aggregate([
      { $match: { _id: { $nin: excludedIds } } },
      { $addFields: { 
        score: {
          $add: [
            { $cond: [{ $in: ["$industry", [user.industry]] }, 5, 0] },
            {
              $size: {
                $setIntersection: [
                  { $ifNull: ["$skills", []] }, // <-- fix here
                  user.skills || []
                ]
              }
            }
          ]
        }
      }},
      { $sort: { score: -1, createdAt: -1 } },
      { $limit: 10 },
      { $project: { name: 1, profilePicture: 1, jobTitle: 1, company: 1 } }
    ]);
    
    // Add mutual connection count
    const suggestionsWithMutuals = await Promise.all(
      suggestions.map(async suggestion => {
        const mutuals = await getMutualConnections(userId, suggestion._id);
        return { ...suggestion, mutualConnections: mutuals };
      })
    );

    res.json(suggestionsWithMutuals);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Connection request
router.post('/request', async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!isValidObjectId(userId) || !isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already connected or request exists
    if (user.connections.includes(targetUserId)) {
      return res.status(400).json({ message: 'Already connected' });
    }

    if (user.pendingRequests.includes(targetUserId)) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    if (targetUser.blockedUsers.includes(userId)) {
      return res.status(403).json({ message: 'Cannot send request' });
    }

    // Add to pending requests
    user.pendingRequests.push(targetUserId);
    targetUser.connectionRequests.push(userId);
    
    await Promise.all([user.save(), targetUser.save()]);

    res.json({ 
      message: 'Request sent',
      user: { 
        id: user._id, 
        pendingRequests: user.pendingRequests 
      },
      targetUser: { 
        id: targetUser._id, 
        connectionRequests: targetUser.connectionRequests 
      }
    });
  } catch (error) {
    console.error('Error sending request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept connection
router.post('/accept', async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!isValidObjectId(userId) || !isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    const [user, targetUser] = await Promise.all([
      User.findById(userId),
      User.findById(targetUserId)
    ]);

    if (!user || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify request exists
    if (!user.connectionRequests.includes(targetUserId)) {
      return res.status(400).json({ message: 'No pending request' });
    }

    // Update both users
    user.connectionRequests = user.connectionRequests.filter(id => !id.equals(targetUserId));
    user.connections.push(targetUserId);
    
    targetUser.pendingRequests = targetUser.pendingRequests.filter(id => !id.equals(userId));
    targetUser.connections.push(userId);

    await Promise.all([user.save(), targetUser.save()]);

    res.json({ message: 'Connection accepted' });
  } catch (error) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline connection
router.post('/decline', async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!isValidObjectId(userId) || !isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    await User.findByIdAndUpdate(userId, {
      $pull: { connectionRequests: targetUserId }
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { pendingRequests: userId }
    });

    res.json({ message: 'Request declined' });
  } catch (error) {
    console.error('Error declining connection:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/block', async (req, res) => {
  try {
    const { userId, targetUserId } = req.body;
    
    if (!isValidObjectId(userId) || !isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user IDs' });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: targetUserId },
      $pull: { 
        connections: targetUserId,
        connectionRequests: targetUserId,
        pendingRequests: targetUserId
      }
    });

    res.json({ message: 'User blocked' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get network
router.get('/network', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .populate('connections', 'name profilePicture jobTitle company')
      .populate('connectionRequests', 'name profilePicture jobTitle company')
      .populate('pendingRequests', 'name profilePicture jobTitle company')
      .populate('blockedUsers', 'name profilePicture jobTitle company');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      connections: user.connections,
      requests: user.connectionRequests,
      pending: user.pendingRequests,
      blocked: user.blockedUsers
    });
  } catch (error) {
    console.error('Error getting network:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
