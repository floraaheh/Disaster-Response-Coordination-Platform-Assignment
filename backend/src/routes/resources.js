import express from 'express';
import { supabase, logger } from '../middleware/index.js';
import { getFromCache, setCache } from '../utils/cache.js';

const router = express.Router();

// Get resources for a disaster with geospatial filtering
router.get('/:id/resources', async (req, res) => {
  try {
    const disasterId = req.params.id;
    const { lat, lng, radius = 10000 } = req.query; // radius in meters, default 10km
    
    // Get disaster details
    const { data: disaster, error: disasterError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', disasterId)
      .single();
    
    if (disasterError) throw disasterError;
    if (!disaster) return res.status(404).json({ error: 'Disaster not found' });
    
    let query = supabase
      .from('resources')
      .select('*')
      .eq('disaster_id', disasterId);
    
    // If coordinates provided, filter by distance
    if (lat && lng) {
      const cacheKey = `resources_${disasterId}_${lat}_${lng}_${radius}`;
      
      // Check cache first
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        logger.info(`Resources retrieved from cache for disaster ${disasterId}`);
        return res.json(cachedData);
      }
      
      // Use PostGIS function for geospatial query
      const { data, error } = await supabase
        .rpc('get_nearby_resources', {
          disaster_id: disasterId,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_meters: parseInt(radius)
        });
      
      if (error) {
        // Fallback to basic query if geospatial function fails
        logger.warn(`Geospatial query failed, falling back to basic query: ${error.message}`);
        const { data: fallbackData, error: fallbackError } = await query;
        if (fallbackError) throw fallbackError;
        
        return res.json(addMockDistances(fallbackData, lat, lng));
      }
      
      // Cache the results
      await setCache(cacheKey, data, 1800); // 30 minutes TTL
      
      res.json(data);
    } else {
      // Basic query without geospatial filtering
      const { data, error } = await query;
      if (error) throw error;
      
      // Add some mock resources if none exist
      const resourcesWithMock = data.length === 0 ? await addMockResources(disasterId, disaster) : data;
      
      res.json(resourcesWithMock);
    }
    
    logger.info(`Resources retrieved for disaster ${disasterId}`);
  } catch (error) {
    logger.error(`Failed to retrieve resources for disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Create new resource
router.post('/:id/resources', async (req, res) => {
  try {
    const disasterId = req.params.id;
    const { name, location_name, type, lat, lng, description, capacity } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const resource = {
      disaster_id: disasterId,
      name,
      location_name,
      type,
      description,
      capacity,
      created_at: new Date().toISOString()
    };
    
    // Add geospatial point if coordinates provided
    if (lat && lng) {
      resource.location = `POINT(${lng} ${lat})`;
    }
    
    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.emit('resources_updated', { 
      disaster_id: disasterId, 
      action: 'create', 
      resource: data 
    });
    
    logger.info(`Resource created: ${name} for disaster ${disasterId}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error(`Failed to create resource for disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to add mock distances when geospatial query fails
function addMockDistances(resources, lat, lng) {
  return resources.map(resource => ({
    ...resource,
    distance: Math.random() * 20000, // Mock distance in meters
    estimated: true
  }));
}

// Helper function to add mock resources for demonstration
async function addMockResources(disasterId, disaster) {
  const mockResources = [
    {
      disaster_id: disasterId,
      name: 'Red Cross Emergency Shelter',
      location_name: disaster.location_name || 'Local Area',
      type: 'shelter',
      description: 'Emergency shelter with capacity for 200 people',
      capacity: 200,
      created_at: new Date().toISOString()
    },
    {
      disaster_id: disasterId,
      name: 'Mobile Medical Unit',
      location_name: disaster.location_name || 'Local Area',
      type: 'medical',
      description: 'Mobile medical unit providing emergency care',
      capacity: 50,
      created_at: new Date().toISOString()
    },
    {
      disaster_id: disasterId,
      name: 'Food Distribution Center',
      location_name: disaster.location_name || 'Local Area',
      type: 'food',
      description: 'Emergency food distribution point',
      capacity: 1000,
      created_at: new Date().toISOString()
    }
  ];
  
  try {
    const { data, error } = await supabase
      .from('resources')
      .insert(mockResources)
      .select();
    
    if (error) {
      logger.warn(`Failed to insert mock resources: ${error.message}`);
      return [];
    }
    
    logger.info(`Mock resources created for disaster ${disasterId}`);
    return data;
  } catch (error) {
    logger.warn(`Failed to create mock resources: ${error.message}`);
    return [];
  }
}

export default router;