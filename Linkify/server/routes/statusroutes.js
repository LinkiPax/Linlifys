const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const Status = require("../model/statuseditmodel");
const sharp = require("sharp"); // For image processing


const router = express.Router();

// Set up file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../uploads/");
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "-");
        cb(null, `${Date.now()}-${sanitizedFileName}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4", "video/quicktime"];
    allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error("Invalid file type. Only images and videos are allowed."), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
}).array("media", 5);

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
};

// Get available music files
// In your backend routes file, make sure the route is properly defined
// In your music route, add more detailed logging
const __dirname = path.resolve();

router.get("/music", (req, res) => {
  try {
    // ✅ Use absolute path to public/music (no ../ issues)
    const musicPath = path.join(__dirname, "public", "music");
    console.log("Looking for music in:", musicPath);

    if (!fs.existsSync(musicPath)) {
      console.log("Music directory does not exist");
      return res.json({ music: [] });
    }

    const files = fs.readdirSync(musicPath);
    console.log("All files in music directory:", files);

    const musicFiles = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        const isAudio = [".mp3", ".wav", ".m4a", ".ogg"].includes(ext);
        console.log(`File: ${file}, Extension: ${ext}, IsAudio: ${isAudio}`);
        return isAudio;
      })
      .map((file) => {
        const musicData = {
          name: path.parse(file).name,
          path: `/music/${file}`, // relative path for static serving
          filename: file,
        };
        console.log("Music data:", musicData);
        return musicData;
      });

    console.log("Final music files:", musicFiles);
    res.json({ music: musicFiles });
  } catch (error) {
    console.error("Error in /music route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Get available stickers/emojis
router.get("/api/stickers", (req, res) => {
    try {
        const stickersPath = path.join(__dirname, "../public/stickers");
        if (!fs.existsSync(stickersPath)) {
            return res.json({ stickers: [] });
        }
        
        const stickerFiles = fs.readdirSync(stickersPath)
            .filter(file => ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(path.extname(file).toLowerCase()))
            .map(file => ({
                name: path.parse(file).name,
                path: `/stickers/${file}`,
                filename: file
            }));
        
        res.json({ stickers: stickerFiles });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Function to add text to image
const addTextToImage = async (imagePath, text) => {
    if (!text) return imagePath;
    
    const outputPath = imagePath.replace(path.extname(imagePath), `-text${path.extname(imagePath)}`);
    
    try {
        await sharp(imagePath)
            .composite([{
                input: Buffer.from(`
                    <svg width="500" height="100">
                        <style>
                            .text { 
                                fill: white; 
                                font-size: 24px; 
                                font-family: Arial, sans-serif;
                                font-weight: bold;
                                text-shadow: 2px 2px 4px black;
                            }
                        </style>
                        <text x="50%" y="50%" text-anchor="middle" class="text">${text}</text>
                    </svg>
                `),
                top: 20,
                left: 0
            }])
            .toFile(outputPath);
        
        return outputPath;
    } catch (error) {
        console.error("Error adding text to image:", error);
        return imagePath;
    }
};

// Fetch all statuses with pagination
// Fetch all statuses with pagination - UPDATED
router.get("/api/statuses", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const statuses = await Status.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
            
        const totalStatuses = await Status.countDocuments();
        
        res.json({ 
            statuses, 
            totalPages: Math.ceil(totalStatuses / limit), 
            currentPage: page 
        });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Upload status with text overlay
router.post(
    "/api/statuses",
    (req, res, next) => upload(req, res, err => (err ? errorHandler(err, req, res, next) : next())),
    [
        body("name").trim().notEmpty().withMessage("Name is required"),
        body("userId").trim().notEmpty().withMessage("UserId is required"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
            if (!req.files || req.files.length === 0) return res.status(400).json({ error: "At least one media file is required" });

            const { name, userId, userProfilePic = "", text = "" } = req.body;
            
            // Process images to add text
            const processedMediaFiles = [];
            for (const file of req.files) {
                if (file.mimetype.startsWith('image/')) {
                    const processedPath = await addTextToImage(file.path, text);
                    processedMediaFiles.push(`uploads/${path.basename(processedPath)}`);
                } else {
                    processedMediaFiles.push(`uploads/${file.filename}`);
                }
            }

            const newStatus = new Status({ 
                name, 
                userId, 
                userProfilePic, 
                media: processedMediaFiles, 
                text,
                createdAt: new Date() 
            });
            await newStatus.save();

            req.io?.emit("statusUpdated", newStatus);
            res.status(201).json(newStatus);
        } catch (error) {
            errorHandler(error, req, res);
        }
    }
);

// Like a status
router.post("/api/statuses/:id/like", [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("userName").notEmpty().withMessage("User name is required")
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { userId, userProfilePic, userName } = req.body;
        const statusId = req.params.id;

        const status = await Status.findById(statusId);
        if (!status) return res.status(404).json({ error: "Status not found" });

        // Check if already liked
        const alreadyLiked = status.likes.some(like => like.userId === userId);
        if (alreadyLiked) {
            // Unlike
            status.likes = status.likes.filter(like => like.userId !== userId);
        } else {
            // Like
            status.likes.push({
                userId,
                userProfilePic,
                userName,
                createdAt: new Date()
            });
        }

        await status.save();
        
        // Emit real-time update
        req.io?.emit("statusLiked", { statusId, likes: status.likes });
        
        res.json({ 
            message: alreadyLiked ? "Unliked successfully" : "Liked successfully", 
            likes: status.likes,
            likesCount: status.likes.length 
        });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Add comment to status
router.post("/api/statuses/:id/comment", [
    body("userId").notEmpty().withMessage("User ID is required"),
    body("userName").notEmpty().withMessage("User name is required"),
    body("text").notEmpty().withMessage("Comment text is required")
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { userId, userProfilePic, userName, text } = req.body;
        const statusId = req.params.id;

        const status = await Status.findById(statusId);
        if (!status) return res.status(404).json({ error: "Status not found" });

        const newComment = {
            userId,
            userProfilePic,
            userName,
            text,
            createdAt: new Date()
        };

        status.comments.push(newComment);
        await status.save();
        
        // Emit real-time update
        req.io?.emit("newComment", { statusId, comment: newComment });
        
        res.status(201).json({ 
            message: "Comment added successfully", 
            comment: newComment,
            commentsCount: status.comments.length 
        });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Get comments for a status
router.get("/api/statuses/:id/comments", async (req, res) => {
    try {
        const status = await Status.findById(req.params.id).select('comments');
        if (!status) return res.status(404).json({ error: "Status not found" });

        res.json({ 
            comments: status.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
            count: status.comments.length 
        });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Delete comment
router.delete("/api/statuses/:statusId/comments/:commentId", async (req, res) => {
    try {
        const { statusId, commentId } = req.params;
        const { userId } = req.body; // User ID to verify ownership

        const status = await Status.findById(statusId);
        if (!status) return res.status(404).json({ error: "Status not found" });

        const commentIndex = status.comments.findIndex(comment => 
            comment._id.toString() === commentId && comment.userId === userId
        );

        if (commentIndex === -1) {
            return res.status(404).json({ error: "Comment not found or unauthorized" });
        }

        status.comments.splice(commentIndex, 1);
        await status.save();
        
        req.io?.emit("commentDeleted", { statusId, commentId });
        
        res.json({ message: "Comment deleted successfully" });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Delete status
router.delete("/api/statuses/:id", async (req, res) => {
    try {
        const status = await Status.findByIdAndDelete(req.params.id);
        if (!status) return res.status(404).json({ error: "Status not found" });
        status.media.forEach(filePath => {
            const fullPath = path.join(__dirname, "../", filePath);
            if (fs.existsSync(fullPath)) fs.unlink(fullPath, err => err && console.error("Error deleting file:", err));
        });
        req.io?.emit("statusUpdated");
        res.json({ message: "Status deleted" });
    } catch (error) {
        errorHandler(error, req, res);
    }
});
// Add this new route for creating status with all editor features
router.post(
    "/api/status/create",
    (req, res, next) => upload(req, res, err => (err ? errorHandler(err, req, res, next) : next())),
    [
        body("userId").trim().notEmpty().withMessage("User ID is required"),
        body("name").trim().notEmpty().withMessage("Name is required"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

            const { 
                userId, 
                name, 
                userProfilePic = "", 
                textElements = "[]", 
                stickerElements = "[]", 
                filter = "{}", 
                music = "",
                musicName = "",
                musicPath = ""
            } = req.body;

            // Check if we have either media or text elements
            if ((!req.files || req.files.length === 0) && textElements === "[]") {
                return res.status(400).json({ error: "Please add media or text to your status" });
            }

            let mediaFiles = [];
            if (req.files && req.files.length > 0) {
                mediaFiles = req.files.map(file => `uploads/${file.filename}`);
            }

            // Parse the JSON data from frontend
            const parsedTextElements = JSON.parse(textElements);
            const parsedStickerElements = JSON.parse(stickerElements);
            const parsedFilter = JSON.parse(filter);

            const newStatus = new Status({ 
                userId, 
                name, 
                userProfilePic, 
                media: mediaFiles,
                textElements: parsedTextElements,
                stickerElements: parsedStickerElements,
                filter: parsedFilter,
                music: music ? {
                    id: music,
                    name: musicName,
                    path: musicPath
                } : null,
                createdAt: new Date() 
            });

            await newStatus.save();

            // Emit real-time update
            req.io?.emit("statusUpdated", newStatus);
            
            res.status(201).json({ 
                message: "Status created successfully", 
                status: newStatus 
            });
        } catch (error) {
            console.error("Error creating status:", error);
            errorHandler(error, req, res);
        }
    }
);
router.use(errorHandler);

module.exports = router;