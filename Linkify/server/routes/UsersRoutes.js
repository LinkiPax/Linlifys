const express = require('express');
const router = express.Router();
const User = require('../model/Usersmodel');

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    // Authorization check (if needed)
    if (req.user.id !== req.params.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(req.params.id).select('name profilePicture bio jobTitle company');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user', details: error.message });
  }
});
module.exports = router;
