import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI("eAIzaSyBfPi91gHvoxRGFKSMnm0ggG3WgxuCK5RQ");

export async function extractLocationFromText(text) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Extract only the location names from this text. Respond with a single comma-separated string, no explanation.\nText: "${text}"`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}
