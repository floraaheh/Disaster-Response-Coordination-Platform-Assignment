const supabase = require('../utils/supabaseClient');

// CREATE Report
exports.createReport = async (req, res) => {
  const { disaster_id, user_id, content, image_url } = req.body;

  const { data, error } = await supabase
    .from('reports')
    .insert([
      {
        disaster_id,
        user_id,
        content,
        image_url,
        verification_status: 'pending',
        created_at: new Date().toISOString()
      }
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  global._io.emit('social_media_updated', data); // optional real-time update
  res.status(201).json(data);
};

// READ Reports for a specific disaster
exports.getReportsByDisaster = async (req, res) => {
  const { disaster_id } = req.params;

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('disaster_id', disaster_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
};
