const express = require('express');
const router = express.Router();
const Comment = require('../model/Commentmodel');
const mongoose = require('mongoose');

// Add a comment
router.post('/', async (req, res) => {
  try { 
    const { content, postId, createdBy } = req.body;

    // Validate input
    if (!content || !postId || !createdBy) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(createdBy)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const newComment = new Comment({ content, postId, createdBy });
    const savedComment = await newComment.save();

    res.status(201).json(savedComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment', details: error.message });
  }
});

// Get comments for a post with pagination
router.get('/:postId', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const comments = await Comment.find({ postId: req.params.postId })
      .populate('createdBy', 'name profilePicture')
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip) // Skip comments based on page
      .limit(Number(limit)); // Limit the number of comments per page

    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments', details: error.message });
  }
});

module.exports = router;
