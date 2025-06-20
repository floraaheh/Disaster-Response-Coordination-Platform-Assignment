const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Route to create a new report
router.post('/', reportController.createReport);

// Route to get all reports for a specific disaster
router.get('/:disaster_id', reportController.getReportsByDisaster);

module.exports = router;
