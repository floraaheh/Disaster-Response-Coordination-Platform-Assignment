import express from 'express';
import { supabase, logger } from '../middleware/index.js';
import { getFromCache, setCache } from '../utils/cache.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// Mock official updates for demonstration
const mockOfficialUpdates = [
  {
    id: '1',
    source: 'FEMA',
    title: 'Federal Emergency Declaration Issued',
    content: 'Federal emergency declaration has been issued for the affected areas. Federal assistance is now available.',
    url: 'https://fema.gov/emergency-declaration',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high'
  },
  {
    id: '2',
    source: 'NYC Emergency Management',
    title: 'Evacuation Centers Opened',
    content: 'Multiple evacuation centers have been opened throughout the city. Transportation is being provided.',
    url: 'https://nyc.gov/emergency-management',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    priority: 'high'
  },
  {
    id: '3',
    source: 'Red Cross',
    title: 'Disaster Relief Operations Underway',
    content: 'American Red Cross has deployed disaster relief workers and emergency response vehicles to the area.',
    url: 'https://redcross.org/disaster-relief',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    priority: 'medium'
  },
  {
    id: '4',
    source: 'National Weather Service',
    title: 'Weather Update and Forecast',
    content: 'Current weather conditions and extended forecast for the disaster area.',
    url: 'https://weather.gov/forecast',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    priority: 'medium'
  }
];

// Get official updates for a disaster
router.get('/:id/official-updates', async (req, res) => {
  try {
    const disasterId = req.params.id;
    const cacheKey = `official_updates_${disasterId}`;
    
    // Check cache first
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      logger.info(`Official updates retrieved from cache for disaster ${disasterId}`);
      return res.json(cachedData);
    }
    
    // Get disaster details
    const { data: disaster, error: disasterError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', disasterId)
      .single();
    
    if (disasterError) throw disasterError;
    if (!disaster) return res.status(404).json({ error: 'Disaster not found' });
    
    // Try to scrape real updates (with fallback to mock data)
    let updates = [];
    
    try {
      // Attempt to scrape FEMA updates
      const femaUpdates = await scrapeFEMAUpdates(disaster);
      updates = updates.concat(femaUpdates);
    } catch (error) {
      logger.warn(`Failed to scrape FEMA updates: ${error.message}`);
    }
    
    try {
      // Attempt to scrape Red Cross updates
      const redCrossUpdates = await scrapeRedCrossUpdates(disaster);
      updates = updates.concat(redCrossUpdates);
    } catch (error) {
      logger.warn(`Failed to scrape Red Cross updates: ${error.message}`);
    }
    
    // If no real updates found, use mock data
    if (updates.length === 0) {
      updates = mockOfficialUpdates.filter(update => {
        // Filter based on disaster tags and location
        const relevantToDisaster = disaster.tags.some(tag => 
          update.content.toLowerCase().includes(tag.toLowerCase())
        );
        return relevantToDisaster || Math.random() > 0.3; // Include 70% of mock updates
      });
    }
    
    // Sort by timestamp (newest first)
    updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Cache the results
    await setCache(cacheKey, updates, 1800); // 30 minutes TTL
    
    logger.info(`Official updates retrieved for disaster ${disasterId}: ${updates.length} updates`);
    res.json(updates);
  } catch (error) {
    logger.error(`Failed to retrieve official updates for disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Scrape FEMA updates (simplified example)
async function scrapeFEMAUpdates(disaster) {
  try {
    // This is a simplified example - in production, you'd need to handle
    // FEMA's actual API or RSS feeds properly
    const response = await axios.get('https://www.fema.gov/', {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DisasterResponse/1.0)'
      }
    });
    
    const $ = cheerio.load(response.data);
    const updates = [];
    
    // This is a mock implementation - real scraping would depend on FEMA's actual structure
    $('.news-item').slice(0, 3).each((i, element) => {
      const title = $(element).find('.title').text().trim();
      const content = $(element).find('.summary').text().trim();
      const link = $(element).find('a').attr('href');
      
      if (title && content) {
        updates.push({
          id: `fema_${i}`,
          source: 'FEMA',
          title,
          content,
          url: link ? `https://fema.gov${link}` : 'https://fema.gov',
          timestamp: new Date().toISOString(),
          priority: 'high'
        });
      }
    });
    
    return updates;
  } catch (error) {
    logger.warn(`FEMA scraping failed: ${error.message}`);
    return [];
  }
}

// Scrape Red Cross updates (simplified example)
async function scrapeRedCrossUpdates(disaster) {
  try {
    // Mock implementation - would need real Red Cross API integration
    return [{
      id: 'redcross_current',
      source: 'American Red Cross',
      title: 'Disaster Relief Operations Active',
      content: 'Red Cross teams are actively providing assistance in the affected areas.',
      url: 'https://redcross.org',
      timestamp: new Date().toISOString(),
      priority: 'medium'
    }];
  } catch (error) {
    logger.warn(`Red Cross scraping failed: ${error.message}`);
    return [];
  }
}

export default router;