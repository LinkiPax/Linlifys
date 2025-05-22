const express = require("express");
const multer = require("multer");
const { body, validationResult } = require("express-validator");
const path = require("path");
const fs = require("fs");
const Status = require("../model/statuseditmodel");

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
}).array("media", 5); // Middleware for multiple file uploads

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
};

// Fetch all statuses with pagination
router.get("/api/statuses", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const statuses = await Status.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalStatuses = await Status.countDocuments();
        res.json({ statuses, totalPages: Math.ceil(totalStatuses / limit), currentPage: page });
    } catch (error) {
        errorHandler(error, req, res);
    }
});

// Upload status
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

            const { name, userId, userProfilePic = "" } = req.body;
            const mediaFiles = req.files.map(file => `uploads/${file.filename}`);
            const newStatus = new Status({ name, userId, userProfilePic, media: mediaFiles, createdAt: new Date() });
            await newStatus.save();

            req.io?.emit("statusUpdated", newStatus);
            res.status(201).json(newStatus);
        } catch (error) {
            errorHandler(error, req, res);
        }
    }
);

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

router.use(errorHandler);

module.exports = router;
