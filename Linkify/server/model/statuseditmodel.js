const mongoose = require("mongoose");

const textElementSchema = new mongoose.Schema({
    id: String,
    text: String,
    style: {
        fontSize: String,
        color: String,
        fontFamily: String,
        fontWeight: String,
        textShadow: String,
        // Add other style properties as needed
    },
    position: {
        x: Number,
        y: Number
    }
});

const stickerElementSchema = new mongoose.Schema({
    id: String,
    url: String,
    position: {
        x: Number,
        y: Number
    },
    size: Number
});

const filterSchema = new mongoose.Schema({
    brightness: Number,
    contrast: Number,
    saturation: Number,
    blur: Number,
    hueRotate: Number,
    dropShadow: String
    // Add other filter properties as needed
});

const musicSchema = new mongoose.Schema({
    id: String,
    name: String,
    path: String
});

const statusSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    userProfilePic: String,
    media: [String], // Array of file paths
    textElements: [textElementSchema],
    stickerElements: [stickerElementSchema],
    filter: filterSchema,
    music: musicSchema,
    likes: [{
        userId: String,
        userProfilePic: String,
        userName: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        userId: String,
        userProfilePic: String,
        userName: String,
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Status", statusSchema);