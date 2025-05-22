const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Status = require('../model/statuseditmodel');

// Set up Multer for local file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage });

// POST endpoint to save status
router.post('/create', upload.array('media', 5), async (req, res) => {
  const { userId, name, userProfilePic, text, selectedFilter, selectedMusic } = req.body;

  // Validate required fields
  if (!userId || !name || !userProfilePic || !req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'userId, name, userProfilePic, and at least one media file are required.' });
  }

  try {
    // Get media file paths
    const mediaFiles = req.files.map(file => file.path);

    // Create a new status object
    const newStatus = new Status({
      userId,
      userProfilePic,
      name,
      media: mediaFiles,
      text: text || '',
      selectedFilter: selectedFilter || '',
      selectedMusic: selectedMusic || '',
      createdAt: new Date(),
    });

    // Save the status to the database
    const savedStatus = await newStatus.save();

    // Return success response
    res.status(201).json({
      message: 'Status created successfully.',
      status: savedStatus,
    });
  } catch (err) {
    console.error('Error saving status:', err);
    res.status(500).json({ error: 'Failed to save status. Please try again.' });
  }
});

module.exports = router;