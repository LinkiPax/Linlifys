const { Router } = require('express');
const User = require('../model/usermodel');
const Post = require('../model/Postmodel');
const Job = require('../model/Jobsmodel');

const router = Router();

// GET /search?q=...
router.get('/', async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  try {
    const regex = new RegExp(q, 'i');

    const [users, posts, jobs] = await Promise.all([
      User.find({
        $or: [
          { name: regex },
          { username: regex },
          { jobTitle: regex },
          { company: regex },
          { skills: regex },
          { location: regex }
        ]
      })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .limit(20),

      Post.find({
        $or: [
          { title: regex },
          { content: regex },
          { tags: regex }
        ]
      })
      .populate('createdBy', 'username name profilePicture jobTitle company')
      .sort({ createdAt: -1 })
      .limit(20),

      Job.find({
        $or: [
          { Title: regex },
          { Company: regex },
          { Location: regex },
          { Description: regex },
          { Skills: regex }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(20)
    ]);

    res.json({
      users: users.map(u => u.toPublicJSON ? u.toPublicJSON() : u),
      posts,
      jobs
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error during search', error: error.message });
  }
});

// GET /search/suggestions?q=...
router.get('/suggestions', async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return res.json([]);
  }

  try {
    const regex = new RegExp(q, 'i');

    const [users, jobs, posts] = await Promise.all([
      User.find({
        $or: [
          { name: regex },
          { username: regex }
        ]
      })
      .select('name username profilePicture')
      .limit(5),

      Job.find({
        $or: [
          { Title: regex },
          { Company: regex }
        ]
      })
      .select('Title Company')
      .limit(5),

      Post.find({
        $or: [
          { title: regex },
          { content: regex }
        ]
      })
      .select('title content')
      .limit(5)
    ]);

    const suggestions = [];

    // Format suggestions
    users.forEach(u => {
      suggestions.push({
        id: u._id,
        text: u.name || u.username,
        type: 'user',
        subtitle: 'Person',
        image: u.profilePicture
      });
    });

    jobs.forEach(j => {
      suggestions.push({
        id: j._id,
        text: j.Title,
        type: 'job',
        subtitle: `Job at ${j.Company}`
      });
    });

    posts.forEach(p => {
      const text = p.title || (p.content.length > 30 ? p.content.substring(0, 30) + '...' : p.content);
      suggestions.push({
        id: p._id,
        text: text,
        type: 'post',
        subtitle: 'Post'
      });
    });

    res.json(suggestions.slice(0, 8));
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Server error fetching suggestions', error: error.message });
  }
});

module.exports = router;
