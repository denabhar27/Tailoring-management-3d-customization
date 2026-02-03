const express = require('express');
const router = express.Router();
const billingController = require('../controller/BillingController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

router.use(verifyToken);

router.get('/records', requireAdmin, billingController.getAllBillingRecords);

router.get('/records/status/:status', requireAdmin, billingController.getBillingRecordsByStatus);

router.put('/records/:id/status', requireAdmin, billingController.updateBillingRecordStatus);

router.get('/stats', requireAdmin, billingController.getBillingStats);

module.exports = router;