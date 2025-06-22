import express from 'express';
import { supabase, authenticate, logger } from '../middleware/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all disasters with optional filtering
router.get('/', async (req, res) => {
  try {
    const { tag, owner_id, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('disasters')
      .select(`
        *,
        reports:reports(count),
        resources:resources(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    if (owner_id) {
      query = query.eq('owner_id', owner_id);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    logger.info(`Retrieved ${data.length} disasters`);
    res.json(data);
  } catch (error) {
    logger.error(`Failed to retrieve disasters: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get single disaster
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('disasters')
      .select(`
        *,
        reports:reports(*),
        resources:resources(*)
      `)
      .eq('id', req.params.id)
      .single();
    
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Disaster not found' });
    
    res.json(data);
  } catch (error) {
    logger.error(`Failed to retrieve disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Create new disaster
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, location_name, description, tags = [] } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    const disaster = {
      id: uuidv4(),
      title,
      location_name,
      description,
      tags,
      owner_id: req.user.id,
      created_at: new Date().toISOString(),
      audit_trail: [{
        action: 'create',
        user_id: req.user.id,
        timestamp: new Date().toISOString()
      }]
    };
    
    const { data, error } = await supabase
      .from('disasters')
      .insert(disaster)
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.emit('disaster_updated', { action: 'create', disaster: data });
    
    logger.info(`Disaster created: ${title} by ${req.user.id}`);
    res.status(201).json(data);
  } catch (error) {
    logger.error(`Failed to create disaster: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Update disaster
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, location_name, description, tags } = req.body;
    
    // Get existing disaster
    const { data: existing, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ error: 'Disaster not found' });
    
    // Check ownership or admin role
    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this disaster' });
    }
    
    const updates = {
      ...(title && { title }),
      ...(location_name && { location_name }),
      ...(description && { description }),
      ...(tags && { tags }),
      audit_trail: [
        ...existing.audit_trail,
        {
          action: 'update',
          user_id: req.user.id,
          timestamp: new Date().toISOString(),
          changes: { title, location_name, description, tags }
        }
      ]
    };
    
    const { data, error } = await supabase
      .from('disasters')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.emit('disaster_updated', { action: 'update', disaster: data });
    
    logger.info(`Disaster updated: ${req.params.id} by ${req.user.id}`);
    res.json(data);
  } catch (error) {
    logger.error(`Failed to update disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Delete disaster
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Get existing disaster
    const { data: existing, error: fetchError } = await supabase
      .from('disasters')
      .select('*')
      .eq('id', req.params.id)
      .single();
    
    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ error: 'Disaster not found' });
    
    // Check ownership or admin role
    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this disaster' });
    }
    
    const { error } = await supabase
      .from('disasters')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    
    // Emit real-time update
    req.io.emit('disaster_updated', { action: 'delete', disaster: existing });
    
    logger.info(`Disaster deleted: ${req.params.id} by ${req.user.id}`);
    res.json({ message: 'Disaster deleted successfully' });
  } catch (error) {
    logger.error(`Failed to delete disaster ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;