const express = require('express');
const router = express.Router();
const socialMediaController = require('../controllers/socialMediaController');
// Mock social media data
let mockPosts = [
  {
    id: 1,
    username: "relief_org",
    content: "Urgent need for food supplies in Dhanbad sector 5",
    timestamp: new Date().toISOString()
  },
  {
    id: 2,
    username: "volunteer_ash",
    content: "Offering medical assistance near Sundarban",
    timestamp: new Date().toISOString()
  },
];
// GET /social-media/:disaster_id
router.get('/:disaster_id', socialMediaController.getSocialMediaPosts);
router.get('/', (req, res) => {
  res.json(mockPosts);
});

router.post('/', (req, res) => {
  const { username, content } = req.body;
  const post = {
    id: mockPosts.length + 1,
    username,
    content,
    timestamp: new Date().toISOString()
  };
  mockPosts.push(post);

  // Send post via WebSocket if enabled
  if (req.io) {
    req.io.emit("new_social_post", post);
  }

  res.status(201).json(post);
});
module.exports = router;
