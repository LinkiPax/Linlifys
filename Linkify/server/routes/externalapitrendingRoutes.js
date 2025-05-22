const express = require('express');
const { getGoogleTrends, getGitHubTrending, getNewsTrends } = require('../controller/externalApis'); 

const router = express.Router();

router.get('/trending', async (req, res) => {
  try {
    const [googleTrends, githubTrends, newsTrends] = await Promise.all([
      getGoogleTrends(),
      getGitHubTrending(),
      getNewsTrends(),
    ]);
    res.json({ googleTrends, githubTrends, newsTrends });
  } catch (error) {
    console.error("Error fetching trending data:", error.message);
    res.status(500).json({ error: "Failed to fetch trending data." }); 
  }
});

module.exports = router;
