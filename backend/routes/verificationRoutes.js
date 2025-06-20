const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');

// POST /verify-image
router.post('/', verificationController.verifyImage);

module.exports = router;
