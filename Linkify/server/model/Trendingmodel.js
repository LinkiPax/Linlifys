// models/trendingTopicModel.js
const mongoose = require('mongoose');

const trendingTopicSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String, // URL of the image
    },
    tags: {
        type: [String], // Array of tags associated with the topic
    },
    popularity: {
        type: Number,
        default: 0, // Higher numbers indicate more popular topics
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('TrendingTopic', trendingTopicSchema);
