// routes/trendingTopicRoutes.js
const { Router } = require('express');
const TrendingTopic = require('../model/Trendingmodel');

const router = Router();

// GET: Fetch all trending topics (sorted by popularity)
router.get('/', async (req, res) => {
    try {
        const topics = await TrendingTopic.find()
            .sort({ popularity: -1, createdAt: -1 }) // Sort by popularity and then by creation date
            .limit(10); // Limit to the top 10 trending topics
        res.status(200).json(topics);
    } catch (error) {
        console.error('Error fetching trending topics:', error);
        res.status(500).json({ error: 'Failed to fetch trending topics' });
    }
});

// POST: Create a new trending topic
router.post('/', async (req, res) => {
    const { title, description, image, tags, popularity } = req.body;

    if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
    }

    try {
        const topic = await TrendingTopic.create({
            title,
            description,
            image,
            tags,
            popularity: popularity || 0, // Default popularity to 0 if not provided
        });

        res.status(201).json({ message: 'Trending topic created successfully', topic });
    } catch (error) {
        console.error('Error creating trending topic:', error);
        res.status(500).json({ error: 'Failed to create trending topic' });
    }
});

// DELETE: Remove a trending topic by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const topic = await TrendingTopic.findByIdAndDelete(id);
        if (!topic) {
            return res.status(404).json({ error: 'Trending topic not found' });
        }
        res.status(200).json({ message: 'Trending topic deleted successfully' });
    } catch (error) {
        console.error('Error deleting trending topic:', error);
        res.status(500).json({ error: 'Failed to delete trending topic' });
    }
});

module.exports = router;
