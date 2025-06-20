const supabase = require('../utils/supabaseClient');
const { extractLocationFromText } = require('../utils/gemini');
const { geocodeLocation } = require('../utils/geocode');

// CREATE
exports.createDisaster = async (req, res) => {
  const { title, description, tags, owner_id } = req.body;

  try {
    // Step 1: Extract location name using Gemini
    const location_name = await extractLocationFromText(description);

    // Step 2: Geocode the extracted location name
    const { lat, lon } = await geocodeLocation(location_name);

    const audit = [{
      action: "create",
      user_id: owner_id,
      timestamp: new Date().toISOString()
    }];

    const { data, error } = await supabase
      .from('disasters')
      .insert([{
        title,
        location_name,
        description,
        tags,
        owner_id,
        latitude: lat,
        longitude: lon,
        audit_trail: audit
      }])
      .select();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
  } catch (err) {
    console.error("createDisaster error:", err.message);
    res.status(500).json({ error: "Failed to extract or geocode location" });
  }
};

// READ ALL
exports.getDisasters = async (req, res) => {
  const { tag } = req.query;
  let query = supabase.from('disasters').select('*');

  if (tag) query = query.contains('tags', [tag]);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// READ ONE
exports.getDisasterById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('disasters').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: 'Disaster not found' });
  res.json(data);
};

// UPDATE
exports.updateDisaster = async (req, res) => {
  const { id } = req.params;
  const { title, location_name, description, tags, user_id } = req.body;

  const { data: existing, error: fetchError } = await supabase.from('disasters').select('audit_trail').eq('id', id).single();
  if (fetchError) return res.status(404).json({ error: 'Disaster not found' });

  const updatedAudit = [
    ...existing.audit_trail,
    { action: 'update', user_id, timestamp: new Date().toISOString() }
  ];

  const { data, error } = await supabase
    .from('disasters')
    .update({ title, location_name, description, tags, audit_trail: updatedAudit })
    .eq('id', id)
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
};

// DELETE
exports.deleteDisaster = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  const { data: existing, error: fetchError } = await supabase.from('disasters').select('audit_trail').eq('id', id).single();
  if (fetchError) return res.status(404).json({ error: 'Disaster not found' });

  const updatedAudit = [
    ...existing.audit_trail,
    { action: 'delete', user_id, timestamp: new Date().toISOString() }
  ];

  await supabase.from('disasters').update({ audit_trail: updatedAudit }).eq('id', id);
  const { error } = await supabase.from('disasters').delete().eq('id', id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Disaster deleted' });
};
