import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Logger utility
export const logger = {
  info: (message) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`),
  error: (message) => console.error(`[ERROR] ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`[WARN] ${new Date().toISOString()} - ${message}`)
};

// Mock authentication middleware
export const authenticate = (req, res, next) => {
  // For demo purposes, using hard-coded users
  const mockUsers = {
    'netrunnerX': { id: 'netrunnerX', role: 'admin', name: 'NetRunner X' },
    'reliefAdmin': { id: 'reliefAdmin', role: 'admin', name: 'Relief Admin' },
    'citizen1': { id: 'citizen1', role: 'contributor', name: 'Citizen Reporter' }
  };

  const authHeader = req.headers.authorization;
  const userId = authHeader ? authHeader.replace('Bearer ', '') : 'citizen1';
  
  req.user = mockUsers[userId] || mockUsers['citizen1'];
  next();
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

export { supabase };