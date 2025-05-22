const express = require('express');
const { getCareerSuggestions } = require('../controller/openaicontroller'); // Make sure the path is correct

const router = express.Router();

// Define the POST route to get career suggestions
router.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;  // Assuming the prompt comes from the request body
    const suggestions = await getCareerSuggestions(prompt);
    res.json({ suggestions });
  } catch (error) {
    console.error("Error fetching career suggestions:", error);
    res.status(500).json({ error: "Error generating career suggestions." });
  }
});

module.exports = router;
