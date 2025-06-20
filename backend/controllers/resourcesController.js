const supabase = require('../utils/supabaseClient');

// READ nearby resources based on disaster location
exports.getNearbyResources = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required.' });
  }

  try {
    const { data, error } = await supabase.rpc('get_nearby_resources', {
      lat_input: parseFloat(lat),
      lon_input: parseFloat(lon),
      radius_meters: 10000 // 10km radius
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch resources' });
    }

    global._io.emit('resources_updated', data); // optional real-time update
    res.json(data);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
