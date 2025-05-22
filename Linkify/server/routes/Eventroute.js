const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const simpleAuth = require('../middleware/auth');

// Models
const Event = require('../model/Eventmodel');
const Comment = require('../model/commentevent');
const Vote = require('../model/voteevent');

// Utilities
const { uploadImage, deleteImage } = require('../cloudinary');

// --------------------------
// Protected Routes (require user ID)
// --------------------------

// Create event
router.post('/', simpleAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, time, location, durationHours } = req.body;
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

    let imageData = {};
    if (req.file) {
      const result = await uploadImage(req.file.path);
      imageData = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      image: imageData,
      creator: req.user.id, // From middleware
      expiresAt
    });

    await event.save();
    
    if (req.app.get('io')) {
      req.app.get('io').emit('eventCreated', event);
    }
    
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/comments', simpleAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const comment = new Comment({
      content: req.body.content,
      author: req.user.id,
      event: event._id
    });

    await comment.save();
    
    // Populate author info before sending
    const populatedComment = await Comment.populate(comment, {
      path: 'author',
      select: 'name profilePicture'
    });

    // Emit socket event
    req.app.get('io').emit('commentAdded', {
      eventId: event._id,
      comment: populatedComment
    });

    res.status(201).json(populatedComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// In your vote route (Eventroute.js)
router.post('/:id/vote', simpleAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const existingVote = await Vote.findOne({
      user: req.user.id,
      event: event._id
    });

    let voteResult;
    
    if (existingVote) {
      if (existingVote.type === req.body.type) {
        await Vote.deleteOne({ _id: existingVote._id });
        voteResult = { action: 'removed', type: req.body.type };
      } else {
        existingVote.type = req.body.type;
        await existingVote.save();
        voteResult = { action: 'updated', type: req.body.type };
      }
    } else {
      const vote = new Vote({
        user: req.user.id,
        event: event._id,
        type: req.body.type
      });
      await vote.save();
      voteResult = { action: 'added', type: req.body.type };
    }

    // Get updated vote counts
    const [upvotes, downvotes] = await Promise.all([
      Vote.countDocuments({ event: event._id, type: 'up' }),
      Vote.countDocuments({ event: event._id, type: 'down' })
    ]);

    // Emit socket event with all needed data
    req.app.get('io').emit('voteUpdated', {
      eventId: event._id,
      upvotes,
      downvotes
    });

    res.status(201).json({ upvotes, downvotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Delete event
router.delete('/:id', simpleAuth, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      creator: req.user.id // Only creator can delete
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found or unauthorized' });
    }

    if (event.image && event.image.public_id) {
      await deleteImage(event.image.public_id);
    }

    await Promise.all([
      Comment.deleteMany({ event: event._id }),
      Vote.deleteMany({ event: event._id })
    ]);

    await event.remove();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --------------------------
// Public Routes
// --------------------------

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).populate('creator', 'name profilePicture');
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get trending events
router.get('/trending', async (req, res) => {
  try {
    const trendingEvents = await Event.getTrendingEvents();
    res.json(trendingEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('creator', 'name profilePicture');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const [comments, votes] = await Promise.all([
      Comment.find({ event: event._id }).populate('author', 'name profilePicture'),
      Vote.find({ event: event._id })
    ]);

    const voteCount = votes.reduce((acc, vote) => {
      acc[vote.type] = (acc[vote.type] || 0) + 1;
      return acc;
    }, { up: 0, down: 0 });

    res.json({
      ...event.toObject(),
      comments,
      upvotes: voteCount.up,
      downvotes: voteCount.down
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;