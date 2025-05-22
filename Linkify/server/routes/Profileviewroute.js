const express = require('express');
const ProfileView = require('../model/ProfileView');
const router = express.Router();
router.post('/api/profile-view', async (req, res) => {
    const { profileId, viewerId } = req.body;
  
    if (!profileId || !viewerId) {
      return res.status(400).json({ message: 'Missing profileId or viewerId.' });
    }
  
    if (profileId === viewerId) {
      return res.status(400).json({ message: 'Cannot view your own profile.' });
    }
  
    try {
      await ProfileView.create({ profileId, viewerId });
      res.status(200).json({ message: 'Profile view recorded.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error recording profile view.' });
    }
  });
  router.get('/api/profile-views/trends/:profileId', async (req, res) => {
    const { profileId } = req.params;
  
    try {
      const data = await ProfileView.aggregate([
        { $match: { profileId } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);
  
      res.status(200).json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching profile view trends.' });
    }
  });
  
  module.exports = router;