import { supabase, logger } from '../middleware/index.js';

// Get data from cache
export async function getFromCache(key) {
  try {
    const { data, error } = await supabase
      .from('cache')
      .select('value, expires_at')
      .eq('key', key)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Check if cache has expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired cache entry
      await supabase.from('cache').delete().eq('key', key);
      return null;
    }
    
    return data.value;
  } catch (error) {
    logger.warn(`Cache retrieval failed for key ${key}: ${error.message}`);
    return null;
  }
}

// Set data in cache
export async function setCache(key, value, ttlSeconds = 3600) {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    
    const { error } = await supabase
      .from('cache')
      .upsert({
        key,
        value,
        expires_at: expiresAt
      });
    
    if (error) {
      logger.warn(`Cache storage failed for key ${key}: ${error.message}`);
    }
  } catch (error) {
    logger.warn(`Cache storage failed for key ${key}: ${error.message}`);
  }
}

// Clear expired cache entries
export async function clearExpiredCache() {
  try {
    const { error } = await supabase
      .from('cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) {
      logger.warn(`Failed to clear expired cache: ${error.message}`);
    } else {
      logger.info('Expired cache entries cleared');
    }
  } catch (error) {
    logger.warn(`Failed to clear expired cache: ${error.message}`);
  }
}

// Schedule cache cleanup every hour
setInterval(clearExpiredCache, 60 * 60 * 1000);