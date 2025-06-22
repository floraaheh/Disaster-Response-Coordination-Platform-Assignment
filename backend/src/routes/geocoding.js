import express from 'express';
import { logger } from '../middleware/index.js';
import { getFromCache, setCache } from '../utils/cache.js';
import axios from 'axios';

const router = express.Router();

// Extract location and geocode to coordinates
router.post('/', async (req, res) => {
  try {
    const { text, description } = req.body;
    
    if (!text && !description) {
      return res.status(400).json({ error: 'Text or description is required' });
    }
    
    const inputText = text || description;
    const cacheKey = `geocoding_${Buffer.from(inputText).toString('base64')}`;
    
    // Check cache first
    const cachedResult = await getFromCache(cacheKey);
    if (cachedResult) {
      logger.info(`Geocoding result retrieved from cache`);
      return res.json(cachedResult);
    }
    
    let result;
    
    try {
      // Step 1: Extract location using Gemini API
      const locationName = await extractLocationWithGemini(inputText);
      
      // Step 2: Geocode location to coordinates
      const coordinates = await geocodeLocation(locationName);
      
      result = {
        original_text: inputText,
        extracted_location: locationName,
        coordinates: coordinates,
        success: true
      };
    } catch (error) {
      logger.warn(`Geocoding failed: ${error.message}`);
      
      // Fallback to mock location extraction
      result = mockLocationExtraction(inputText);
    }
    
    // Cache the result
    await setCache(cacheKey, result, 7200); // 2 hours TTL
    
    logger.info(`Geocoding completed: ${result.extracted_location}`);
    res.json(result);
  } catch (error) {
    logger.error(`Failed to process geocoding request: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Extract location using Google Gemini API
async function extractLocationWithGemini(text) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }
    
    const prompt = `Extract the specific location name from the following text. Return only the location name in a format suitable for geocoding (e.g., "Manhattan, NYC" or "Brooklyn, New York" or "Los Angeles, CA").
    
    Text: "${text}"
    
    If no specific location is mentioned, return "Location not specified".
    Only return the location name, nothing else.`;
    
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
    
    const locationName = generatedText.trim().replace(/['"]/g, '');
    
    if (locationName.toLowerCase().includes('not specified')) {
      throw new Error('No location found in text');
    }
    
    return locationName;
  } catch (error) {
    logger.error(`Gemini location extraction failed: ${error.message}`);
    throw error;
  }
}

// Geocode location to coordinates using mapping service
async function geocodeLocation(locationName) {
  try {
    // Try Google Maps first
    if (process.env.GOOGLE_MAPS_API_KEY) {
      return await geocodeWithGoogleMaps(locationName);
    }
    
    // Try Mapbox
    if (process.env.MAPBOX_API_KEY) {
      return await geocodeWithMapbox(locationName);
    }
    
    // Fallback to OpenStreetMap Nominatim
    return await geocodeWithNominatim(locationName);
  } catch (error) {
    logger.error(`All geocoding services failed: ${error.message}`);
    throw error;
  }
}

// Geocode with Google Maps
async function geocodeWithGoogleMaps(locationName) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationName)}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    { timeout: 5000 }
  );
  
  if (response.data.status !== 'OK' || response.data.results.length === 0) {
    throw new Error(`Google Maps geocoding failed: ${response.data.status}`);
  }
  
  const location = response.data.results[0].geometry.location;
  
  return {
    lat: location.lat,
    lng: location.lng,
    formatted_address: response.data.results[0].formatted_address,
    service: 'google_maps'
  };
}

// Geocode with Mapbox
async function geocodeWithMapbox(locationName) {
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(locationName)}.json?access_token=${process.env.MAPBOX_API_KEY}`,
    { timeout: 5000 }
  );
  
  if (response.data.features.length === 0) {
    throw new Error('Mapbox geocoding found no results');
  }
  
  const coordinates = response.data.features[0].center;
  
  return {
    lat: coordinates[1],
    lng: coordinates[0],
    formatted_address: response.data.features[0].place_name,
    service: 'mapbox'
  };
}

// Geocode with OpenStreetMap Nominatim
async function geocodeWithNominatim(locationName) {
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
    { 
      timeout: 5000,
      headers: {
        'User-Agent': 'DisasterResponse/1.0'
      }
    }
  );
  
  if (response.data.length === 0) {
    throw new Error('Nominatim geocoding found no results');
  }
  
  const result = response.data[0];
  
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    formatted_address: result.display_name,
    service: 'nominatim'
  };
}

// Mock location extraction for fallback
function mockLocationExtraction(text) {
  // Simple pattern matching for common location formats
  const locationPatterns = [
    /in\s+([A-Z][a-zA-Z\s,]+)/i,
    /at\s+([A-Z][a-zA-Z\s,]+)/i,
    /near\s+([A-Z][a-zA-Z\s,]+)/i,
    /([A-Z][a-zA-Z]+,?\s*[A-Z]{2,})/
  ];
  
  let extractedLocation = 'New York, NY'; // Default fallback
  
  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      extractedLocation = match[1].trim();
      break;
    }
  }
  
  // Mock coordinates for common locations
  const mockCoordinates = {
    'Manhattan, NYC': { lat: 40.7831, lng: -73.9712 },
    'Brooklyn, NY': { lat: 40.6782, lng: -73.9442 },
    'Queens, NY': { lat: 40.7282, lng: -73.7949 },
    'Bronx, NY': { lat: 40.8448, lng: -73.8648 },
    'New York, NY': { lat: 40.7128, lng: -74.0060 },
    'Los Angeles, CA': { lat: 34.0522, lng: -118.2437 },
    'Chicago, IL': { lat: 41.8781, lng: -87.6298 }
  };
  
  const coordinates = mockCoordinates[extractedLocation] || mockCoordinates['New York, NY'];
  
  return {
    original_text: text,
    extracted_location: extractedLocation,
    coordinates: {
      ...coordinates,
      formatted_address: extractedLocation,
      service: 'mock'
    },
    success: true,
    mock: true
  };
}

export default router;