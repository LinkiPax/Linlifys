const express = require("express");
const { addExperience, getExperiences, updateExperience, deleteExperience } = require("../controller/experienceController");
const router = express.Router();

// Routes for Experience
router.post("/:userId", addExperience);
router.get("/:userId", getExperiences);
router.put("/:userId/:experienceId", updateExperience);
router.delete("/:userId/:experienceId", deleteExperience);

module.exports = router;
