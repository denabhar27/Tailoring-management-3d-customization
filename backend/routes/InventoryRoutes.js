const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/InventoryController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

router.use(verifyToken);

router.get('/items', requireAdmin, inventoryController.getCompletedItems);

router.get('/items/service/:serviceType', requireAdmin, inventoryController.getItemsByServiceType);

router.get('/stats', requireAdmin, inventoryController.getInventoryStats);

module.exports = router;