// const supabase = require('../utils/supabaseClient');
// const disasterRoutes = require('./routes/disasters');
// const { data, error } = await supabase
//   .from('disasters')
//   .select('*')
//   .eq('tags', 'flood');
//   app.use('/disasters', disasterRoutes);
// app.use(express.static('public'));

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const { Server } = require('socket.io');
const reportRoutes = require('./routes/reportRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const socialMediaRoutes = require('./routes/socialMediaRoutes');
const verificationRoutes = require('./routes/verificationRoutes');
const disasterRoutes = require('./routes/disasterRoutes');
// Supabase client
const supabase = require('./utils/supabaseClient');

// Route handlers



const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

global._io = io;

app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static('public'));

// Middleware to make `io` available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});
// Routes
app.use('/disasters', disasterRoutes);
app.use('/reports', reportRoutes);
app.use('/resources', resourceRoutes);
app.use('/social-media', socialMediaRoutes);
app.use('/verify-image', verificationRoutes);
app.use('/api/social', socialMediaRoutes);

// WebSocket handling
io.on('connection', (socket) => {
  console.log('🧠 WebSocket connected:', socket.id);
});

// Sample database fetch (for testing only)
(async () => {
  const { data, error } = await supabase
    .from('disasters')
    .select('*')
    .contains('tags', ['flood']); // use `.contains()` for array columns

  if (error) console.error("❌ Supabase fetch error:", error);
  else console.log("✅ Fetched Disasters:", data);
})();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
