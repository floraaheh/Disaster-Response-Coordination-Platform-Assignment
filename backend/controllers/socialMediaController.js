const supabase = require('../utils/supabaseClient');
const { getCachedValue, setCachedValue } = require('../utils/cacheHelper');

// Simulate fetching social media posts for a disaster (mocked or real)
exports.getSocialMediaPosts = async (req, res) => {
  const { disaster_id } = req.params;

  // Try fetching the disaster data (to get tags)
  const { data: disaster, error: disasterError } = await supabase
    .from('disasters')
    .select('tags')
    .eq('id', disaster_id)
    .single();

  if (disasterError) {
    return res.status(500).json({ error: 'Failed to fetch disaster tags' });
  }

  const tags = disaster.tags || [];

  // Use tags to generate fake posts
  const cacheKey = `social_posts_${disaster_id}`;
  const cached = await getCachedValue(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  // Mock posts (could be replaced with Twitter API or Bluesky)
  const mockPosts = tags.map((tag, index) => ({
    id: index + 1,
    post: `#${tag} Help needed in the area!`,
    user: `user${index + 1}`
  }));

  // Cache for 1 hour
  await setCachedValue(cacheKey, mockPosts, 60 * 60);

  global._io.emit('social_media_updated', mockPosts);
  res.json(mockPosts);
};
