const express = require("express");
const router = express.Router();
const multer = require("multer");
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const {
  uploadShort,
  getShorts,
  likeShort,
  dislikeShort,
  commentShort,
  shareShort,
} = require("../controller/shortController");

router.post("/shorts", upload.single("video"), uploadShort);
router.get("/shorts", getShorts);

// New routes
router.put("/shorts/:shortId/like", likeShort);
router.put("/shorts/:shortId/dislike", dislikeShort);
router.post("/shorts/:shortId/comment", commentShort);
router.post("/shorts/:shortId/share", shareShort);

module.exports = router;
