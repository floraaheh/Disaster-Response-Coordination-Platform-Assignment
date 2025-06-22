import express from 'express';
import { supabase, logger } from '../middleware/index.js';
import { getFromCache, setCache } from '../utils/cache.js';

const router = express.Router();

// Mock social media data
const mockSocialMediaPosts = [
  {
    id: '1',
    user: 'citizen1',
    post: '#floodrelief Need food and water in Lower East Side NYC',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    platform: 'twitter',
    priority: 'high',
    keywords: ['floodrelief', 'food', 'water']
  },
  {
    id: '2',
    user: 'helper123',
    post: 'Offering shelter in Brooklyn for flood victims. DM me #disasterhelp',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    platform: 'twitter',
    priority: 'medium',
    keywords: ['shelter', 'disasterhelp']
  },
  {
    id: '3',
    user: 'emergencyalert',
    post: 'URGENT: Water rising rapidly in Manhattan financial district. Evacuate immediately!',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    platform: 'twitter',
    priority: 'urgent',
    keywords: ['urgent', 'evacuate', 'water', 'manhattan']
  },
  {
    id: '4',
    user: 'redcross_ny',
    post: 'Emergency shelter opened at 123 Main St, Brooklyn. Capacity for 200 people.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    platform: 'twitter',
    priority: 'high',
    keywords: ['shelter', 'emergency', 'brooklyn']
  }
];

// Get social media reports for a disaster
router.get('/:id/social-media', async (req, res) => {
  try {
    const disasterId = req.params.id;
    const cacheKey = `social_media_${disasterId}`;
    
    // Check cache first
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      logger.info(`Social media data retrieved from cache for disaster ${disasterId}`);
      return res.json(cachedData);
    }
    
    // Get disaster details to filter relevant posts
    const { data: disaster, error: disasterError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', disasterId)
      .single();
    
    if (disasterError) throw disasterError;
    if (!disaster) return res.status(404).json({ error: 'Disaster not found' });
    
    // Filter mock posts based on disaster tags and location
    const relevantPosts = mockSocialMediaPosts.filter(post => {
      const postLower = post.post.toLowerCase();
      const locationMatch = disaster.location_name && 
        postLower.includes(disaster.location_name.toLowerCase().split(',')[0]);
      const tagMatch = disaster.tags.some(tag => 
        postLower.includes(tag.toLowerCase()) || 
        post.keywords.some(keyword => keyword.includes(tag.toLowerCase()))
      );
      
      return locationMatch || tagMatch;
    });
    
    // Add some priority scoring
    const processedPosts = relevantPosts.map(post => ({
      ...post,
      relevance_score: calculateRelevanceScore(post, disaster),
      disaster_id: disasterId
    })).sort((a, b) => b.relevance_score - a.relevance_score);
    
    // Cache the results
    await setCache(cacheKey, processedPosts, 3600); // 1 hour TTL
    
    // Emit real-time update
    req.io.emit('social_media_updated', { 
      disaster_id: disasterId, 
      posts: processedPosts.slice(0, 5) // Send only top 5 for real-time
    });
    
    logger.info(`Social media data processed for disaster ${disasterId}: ${processedPosts.length} relevant posts`);
    res.json(processedPosts);
  } catch (error) {
    logger.error(`Failed to retrieve social media data for disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Mock endpoint for social media simulation
router.get('/mock-social-media', async (req, res) => {
  try {
    const { keyword, location, priority } = req.query;
    
    let filteredPosts = [...mockSocialMediaPosts];
    
    if (keyword) {
      filteredPosts = filteredPosts.filter(post => 
        post.post.toLowerCase().includes(keyword.toLowerCase()) ||
        post.keywords.some(k => k.toLowerCase().includes(keyword.toLowerCase()))
      );
    }
    
    if (location) {
      filteredPosts = filteredPosts.filter(post => 
        post.post.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (priority) {
      filteredPosts = filteredPosts.filter(post => post.priority === priority);
    }
    
    // Simulate new posts every few minutes
    const newPost = generateNewMockPost();
    if (Math.random() > 0.7) { // 30% chance of new post
      filteredPosts.unshift(newPost);
    }
    
    res.json(filteredPosts);
  } catch (error) {
    logger.error(`Failed to retrieve mock social media data: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

function calculateRelevanceScore(post, disaster) {
  let score = 0;
  
  // Priority scoring
  const priorityScores = { urgent: 10, high: 7, medium: 5, low: 2 };
  score += priorityScores[post.priority] || 0;
  
  // Keyword matching
  disaster.tags.forEach(tag => {
    if (post.post.toLowerCase().includes(tag.toLowerCase())) {
      score += 5;
    }
  });
  
  // Location matching
  if (disaster.location_name) {
    const locationKeywords = disaster.location_name.toLowerCase().split(/[,\s]+/);
    locationKeywords.forEach(keyword => {
      if (post.post.toLowerCase().includes(keyword)) {
        score += 3;
      }
    });
  }
  
  // Recency bonus (newer posts get higher scores)
  const hoursOld = (Date.now() - new Date(post.timestamp).getTime()) / (1000 * 60 * 60);
  score += Math.max(0, 5 - hoursOld);
  
  return score;
}

function generateNewMockPost() {
  const templates = [
    "Need medical supplies in {location} #emergency",
    "Offering transportation help for evacuation #disasterhelp",
    "Water shortage reported in {location} area",
    "Rescue teams needed at {location} #urgent",
    "Food distribution point set up at {location}"
  ];
  
  const locations = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'];
  const template = templates[Math.floor(Math.random() * templates.length)];
  const location = locations[Math.floor(Math.random() * locations.length)];
  
  return {
    id: Date.now().toString(),
    user: `user_${Math.floor(Math.random() * 1000)}`,
    post: template.replace('{location}', location),
    timestamp: new Date().toISOString(),
    platform: 'twitter',
    priority: ['urgent', 'high', 'medium'][Math.floor(Math.random() * 3)],
    keywords: ['emergency', 'help', 'disaster']
  };
}

export default router;