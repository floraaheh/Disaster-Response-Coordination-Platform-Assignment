const express = require('express');
const router = express.Router();
const controller = require('../controllers/disasterController');

router.post('/', controller.createDisaster);
router.get('/', controller.getDisasters);
router.get('/:id', controller.getDisasterById);
router.put('/:id', controller.updateDisaster);
router.delete('/:id', controller.deleteDisaster);

module.exports = router;
