const axios = require('axios');
require('dotenv').config();
// GitHub API
async function getGitHubTrending() {
  try {
      const response = await axios.get('https://api.github.com/search/repositories', {
          headers: {
              Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          },
          params: {
              q: 'stars:>1', // Adjust query for trending repos
              sort: 'stars',
              order: 'desc',
              per_page: 10,
          },
      });
      return response.data.items.map((repo) => ({
          name: repo.name,
          url: repo.html_url,
          description: repo.description,
      }));
  } catch (error) {
      console.error("Error fetching GitHub trends:", error.message);
      return [];
  }
}
// Google Trends API
const gtrends = require('google-trends-api');


async function getGoogleTrends() {
  try {
      const response = await gtrends.dailyTrends({
          geo: 'US',
      });
      const trends = JSON.parse(response).default.trendingSearchesDays[0].trendingSearches;
      return trends.map((trend) => ({
          query: trend.title.query,
          exploreLink: trend.exploreLink,
      }));
  } catch (error) {
      console.error("Error fetching Google Trends:", error.message);
      return [];
  }
}

// News API
async function getNewsTrends() {
  try {
      const response = await axios.get('https://newsapi.org/v2/top-headlines', {
          params: {
              country: 'us',
              category: 'technology', // Focused category
              apiKey: process.env.NEWS_API_KEY,
          },
      });
      return response.data.articles.map((article) => ({
          title: article.title,
          url: article.url,
      }));
  } catch (error) {
      console.error("Error fetching news trends:", error.message);
      return [];
  }
}

module.exports = { 
  getGoogleTrends, 
  getGitHubTrending, 
  getNewsTrends
};
