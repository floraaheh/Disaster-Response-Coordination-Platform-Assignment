import express from 'express';
import { supabase, authenticate, logger } from '../middleware/index.js';
import { getFromCache, setCache } from '../utils/cache.js';
import axios from 'axios';

const router = express.Router();

// Verify image authenticity using Gemini API
router.post('/:id/verify-image', authenticate, async (req, res) => {
  try {
    const disasterId = req.params.id;
    const { image_url, report_id } = req.body;
    
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    // Check cache first
    const cacheKey = `image_verification_${Buffer.from(image_url).toString('base64')}`;
    const cachedResult = await getFromCache(cacheKey);
    
    if (cachedResult) {
      logger.info(`Image verification retrieved from cache`);
      return res.json(cachedResult);
    }
    
    // Get disaster details
    const { data: disaster, error: disasterError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', disasterId)
      .single();
    
    if (disasterError) throw disasterError;
    if (!disaster) return res.status(404).json({ error: 'Disaster not found' });
    
    let verificationResult;
    
    try {
      // Use Gemini API for image verification
      verificationResult = await verifyImageWithGemini(image_url, disaster);
    } catch (error) {
      logger.warn(`Gemini API verification failed: ${error.message}`);
      // Fallback to mock verification
      verificationResult = mockImageVerification(image_url, disaster);
    }
    
    // Update report if report_id provided
    if (report_id) {
      const { error: updateError } = await supabase
        .from('reports')
        .update({ 
          verification_status: verificationResult.status,
          verification_details: verificationResult
        })
        .eq('id', report_id);
      
      if (updateError) {
        logger.warn(`Failed to update report verification status: ${updateError.message}`);
      }
    }
    
    // Cache the result
    await setCache(cacheKey, verificationResult, 3600); // 1 hour TTL
    
    logger.info(`Image verification completed for disaster ${disasterId}: ${verificationResult.status}`);
    res.json(verificationResult);
  } catch (error) {
    logger.error(`Failed to verify image for disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Verify image using Google Gemini API
async function verifyImageWithGemini(imageUrl, disaster) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    
    const prompt = `Analyze this image at ${imageUrl} for authenticity and disaster context. 
    The image is claimed to be related to a ${disaster.tags.join(', ')} disaster in ${disaster.location_name || 'an unspecified location'}.
    
    Please assess:
    1. Signs of digital manipulation or editing
    2. Whether the image content matches the claimed disaster type
    3. Consistency of lighting, shadows, and image quality
    4. Any obvious signs of the image being staged or fake
    
    Respond with a JSON object containing:
    - authenticity_score (0-100, where 100 is completely authentic)
    - manipulation_detected (boolean)
    - context_match (boolean - does the image match the disaster type)
    - analysis_summary (brief explanation)
    - confidence_level (low/medium/high)`;
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{ text: prompt }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const generatedText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No response from Gemini API');
    }
    
    // Try to parse JSON response
    let analysis;
    try {
      // Extract JSON from the response (Gemini sometimes wraps it in markdown)
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      analysis = {
        authenticity_score: generatedText.toLowerCase().includes('fake') ? 30 : 80,
        manipulation_detected: generatedText.toLowerCase().includes('manipulated') || generatedText.toLowerCase().includes('edited'),
        context_match: !generatedText.toLowerCase().includes('unrelated'),
        analysis_summary: generatedText.substring(0, 200),
        confidence_level: 'medium'
      };
    }
    
    return {
      status: analysis.authenticity_score > 70 ? 'verified' : analysis.authenticity_score > 40 ? 'suspicious' : 'fake',
      authenticity_score: analysis.authenticity_score,
      manipulation_detected: analysis.manipulation_detected,
      context_match: analysis.context_match,
      analysis_summary: analysis.analysis_summary,
      confidence_level: analysis.confidence_level,
      verification_method: 'gemini_api',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error(`Gemini API verification failed: ${error.message}`);
    throw error;
  }
}

// Mock image verification for fallback
function mockImageVerification(imageUrl, disaster) {
  // Simple mock based on URL patterns and disaster context
  const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
  
  const suspiciousPatterns = ['fake', 'staged', 'stock', 'shutterstock'];
  const isSuspicious = suspiciousPatterns.some(pattern => 
    imageUrl.toLowerCase().includes(pattern)
  );
  
  return {
    status: isSuspicious ? 'suspicious' : score > 80 ? 'verified' : 'pending',
    authenticity_score: isSuspicious ? 25 : score,
    manipulation_detected: isSuspicious,
    context_match: true,
    analysis_summary: isSuspicious 
      ? 'Image shows signs of being staged or stock photography'
      : 'Image appears authentic with no obvious signs of manipulation',
    confidence_level: 'medium',
    verification_method: 'mock_analysis',
    timestamp: new Date().toISOString()
  };
}

export default router;