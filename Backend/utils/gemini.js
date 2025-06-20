const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.extractLocationFromText = async (text) => {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Extract only the location name(s) from the following disaster description. Respond with a short comma-separated list, no explanation.\n\nText: "${text}"`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
};
