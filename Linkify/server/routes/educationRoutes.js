const express = require("express");
const router = express.Router();
const {
  addEducation,
  getEducation,
  updateEducation,
  deleteEducation,
  searchColleges,
  searchSkills,
  uploadLogo
} = require("../controller/educationController");
const { uploadProfilePic } = require("../cloudinary");

// Routes for Education
router.post("/:userId", addEducation);
router.get("/:userId", getEducation);
router.put("/:id", updateEducation);
router.delete("/:id", deleteEducation);
router.get("/search/colleges", searchColleges);
router.get("/search/skills", searchSkills);

// Logo upload route
router.post(
  "/upload-logo/:userId",
  uploadProfilePic.single('logo'),
  uploadLogo
);

module.exports = router;