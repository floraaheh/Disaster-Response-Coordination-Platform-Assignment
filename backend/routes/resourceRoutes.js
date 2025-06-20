const express = require('express');
const router = express.Router();
const resourcesController = require('../controllers/resourcesController');

// GET /resources?lat=...&lon=...
router.get('/', resourcesController.getNearbyResources);

module.exports = router;
