const axios = require('axios');
const { getCachedValue, setCachedValue } = require('../utils/cacheHelper');

// POST /verify-image
exports.verifyImage = async (req, res) => {
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  const cacheKey = `verify_image_${encodeURIComponent(image_url)}`;
  const cached = await getCachedValue(cacheKey);

  if (cached) {
    return res.json({ source: 'cache', result: cached });
  }

  try {
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      {
        contents: [
          {
            role: 'user',
            parts: [{ text: `Analyze this image for disaster verification and manipulation signs: ${image_url}` }]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY

        }
      }
    );

    const result = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis returned';

    await setCachedValue(cacheKey, result, 60 * 60); // cache for 1 hour

    res.json({ source: 'gemini', result });
  } catch (error) {
    console.error('Gemini API error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify image' });
  }
};
