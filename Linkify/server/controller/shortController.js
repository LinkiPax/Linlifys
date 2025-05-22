const Short = require("../model/shortmodel");

// Upload a new short
const uploadShort = async (req, res) => {
  try {
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({ error: "No video file uploaded" });
    }

    const { userId, caption, music, tags, mentions } = req.body;
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Create new short
    const newShort = new Short({
      userId,
      videoUrl: req.file.path, // Path from multer/cloudinary
      caption: caption || "",
      music: music || "",
      tags: tags ? tags.split(',') : [],
      mentions: mentions ? mentions.split(',') : [],
      likes: [],
      dislikes: [],
      comments: [],
      shareCount: 0,
    });

    await newShort.save();

    res.status(201).json({
      message: "Short uploaded successfully",
      short: newShort
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ 
      error: "Server error during upload",
      details: err.message 
    });
  }
};

// Get all shorts (sorted by newest first)
const getShorts = async (req, res) => {
  try {
    const shorts = await Short.find().sort({ createdAt: -1 });
    res.status(200).json(shorts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Like a short
const likeShort = async (req, res) => {
  const { shortId } = req.params;
  const { userId } = req.body;

  try {
    const short = await Short.findById(shortId);
    if (!short) return res.status(404).json({ message: "Short not found" });

    // Remove from dislikes if already disliked
    short.dislikes = short.dislikes.filter(id => id !== userId);

    // Toggle like
    if (short.likes.includes(userId)) {
      short.likes = short.likes.filter(id => id !== userId);
    } else {
      short.likes.push(userId);
    }

    await short.save();
    res.json(short);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Dislike a short
const dislikeShort = async (req, res) => {
  const { shortId } = req.params;
  const { userId } = req.body;

  try {
    const short = await Short.findById(shortId);
    if (!short) return res.status(404).json({ message: "Short not found" });

    // Remove from likes if already liked
    short.likes = short.likes.filter(id => id !== userId);

    // Toggle dislike
    if (short.dislikes.includes(userId)) {
      short.dislikes = short.dislikes.filter(id => id !== userId);
    } else {
      short.dislikes.push(userId);
    }

    await short.save();
    res.json(short);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add a comment
const commentShort = async (req, res) => {
  const { shortId } = req.params;
  const { userId, text } = req.body;

  try {
    const short = await Short.findById(shortId);
    if (!short) return res.status(404).json({ message: "Short not found" });

    short.comments.push({ userId, text });
    await short.save();
    res.json(short);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Increment share count
const shareShort = async (req, res) => {
  const { shortId } = req.params;

  try {
    const short = await Short.findById(shortId);
    if (!short) return res.status(404).json({ message: "Short not found" });

    short.shareCount += 1;
    await short.save();

    res.json({ message: "Share count updated", shareCount: short.shareCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
module.exports = { uploadShort, getShorts, uploadShort,
  getShorts,
  likeShort,
  dislikeShort,
  commentShort,
  shareShort };
