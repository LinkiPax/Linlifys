const express = require('express');
const mongoose = require('mongoose');
const Skill = require('../model/skillmodel');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Common skill suggestions data (could be moved to a database)
const SKILL_SUGGESTIONS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Java',
  'HTML', 'CSS', 'SQL', 'MongoDB', 'Express',
  'TypeScript', 'GraphQL', 'Docker', 'AWS', 'Git'
].map(skill => skill.toLowerCase());

// Add or Update Skills with validation
// Add or Update Skills with validation
// Add or Update Skills with validation
router.post('/:userId', [
  body('skills').isArray().withMessage('Skills must be an array'),
  body('skills.*').isString().trim().notEmpty().withMessage('Each skill must be a non-empty string'),
  body('skillLevels').optional().isObject().withMessage('Skill levels must be an object')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId } = req.params; 
  let { skills, skillLevels = {} } = req.body;

  try {
    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Normalize skills (trim, lowercase, remove duplicates)
    skills = [...new Set(skills.map(skill => skill.trim().toLowerCase()))];

    // Validate and normalize skill levels
    const validatedSkillLevels = {};
    for (const skill of skills) {
      let level = skillLevels[skill];
      
      // Default to 1 if not provided or invalid
      if (!level || !Number.isInteger(level) || level < 1 || level > 5) {
        level = 1;
      }
      
      validatedSkillLevels[skill] = level;
    }

    const existingSkills = await Skill.findOne({ userId });

    if (existingSkills) {
      // Update skills and levels
      existingSkills.skills = skills;
      existingSkills.skillLevels = validatedSkillLevels;
      await existingSkills.save();
      return res.json({ 
        message: "Skills updated successfully.",
        skills: existingSkills.skills,
        skillLevels: existingSkills.skillLevels
      });
    }

    // Add new skills
    const newSkills = new Skill({ 
      userId, 
      skills,
      skillLevels: validatedSkillLevels
    });
    await newSkills.save();
    res.json({ 
      message: "Skills added successfully.",
      skills: newSkills.skills,
      skillLevels: newSkills.skillLevels
    });
  } catch (error) {
    console.error("Error managing skills:", error);
    res.status(500).json({ 
      error: "Internal server error.",
      details: error.message 
    });
  }
});

// Get Skills with levels
// Get Skills with levels
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const skillsDoc = await Skill.findOne({ userId });
    
    // Return empty skills with 200 status instead of 404
    res.json({ 
      message: skillsDoc ? "Skills found" : "No skills added yet",
      skills: skillsDoc?.skills || [], 
      skillLevels: skillsDoc?.skillLevels || {}
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ 
      error: "Internal server error.",
      details: error.message 
    });
  }
});
// Get skill suggestions
router.get('/suggestions', async (req, res) => {
  const { query = '' } = req.query;
  const searchTerm = query.trim().toLowerCase();

  try {
    if (!searchTerm) {
      return res.json({ suggestions: [] });
    }

    // Filter suggestions (could be enhanced with a database query)
    const suggestions = SKILL_SUGGESTIONS.filter(skill => 
      skill.includes(searchTerm)
    ).slice(0, 10); // Limit to 10 suggestions

    res.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    res.status(500).json({ 
      error: "Internal server error.",
      details: error.message 
    });
  }
});

module.exports = router;