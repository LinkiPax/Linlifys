const { OpenAI } = require("openai");
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your OpenAI key is set in your environment
});

module.exports = openai;
