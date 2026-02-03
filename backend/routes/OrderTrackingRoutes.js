const express = require('express');
const router = express.Router();
const OrderTrackingController = require('../controller/OrderTrackingController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

router.get('/', verifyToken, OrderTrackingController.getUserOrderTracking);

router.get('/history/:id', verifyToken, OrderTrackingController.getOrderItemTrackingHistory);

router.get('/transitions/:id', verifyToken, requireAdmin, OrderTrackingController.getStatusTransitions);

router.post('/update/:id', verifyToken, requireAdmin, OrderTrackingController.updateTrackingStatus);

module.exports = router;
