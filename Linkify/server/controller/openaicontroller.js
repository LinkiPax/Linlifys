const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
require("dotenv").config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Use environment variable for security
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Use environment variable
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function getCareerSuggestionsOpenAI(prompt) {
  try {
    const response = await openai.completions.create({
      model: "gpt-3.5-turbo",
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
    });
    return response.choices[0].text.trim();
  } catch (error) {
    if (error.code === 'insufficient_quota') {
      console.log("OpenAI API exceeded limit. Switching to Gemini...");
      return getCareerSuggestionsGemini(prompt); // Fallback to Gemini
    }
    if (error.code === 429) {
      console.log("Rate limit exceeded, retrying after 10 seconds...");
      // Retry after a delay (e.g., 10 seconds)
      return new Promise((resolve) => {
        setTimeout(() => resolve(getCareerSuggestionsOpenAI(prompt)), 10000);
      });
    }
    console.error("Error with OpenAI:", error.message);
    throw error;
  }
}

// Function to generate career suggestions from Gemini
async function getCareerSuggestionsGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error generating suggestions from Gemini:", error.message);
    throw error;  // Re-throw error if Gemini also fails
  }
}

// Main handler to get suggestions (either from OpenAI or Gemini)
async function getCareerSuggestions(prompt) {
  try {
    const suggestions = await getCareerSuggestionsOpenAI(prompt);
    return suggestions;
  } catch (error) {
    console.error("Failed to get career suggestions from both OpenAI and Gemini:", error.message);
    throw error;
  }
}

module.exports = { getCareerSuggestions };
