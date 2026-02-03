const express = require('express');
const router = express.Router();
const transactionLogController = require('../controller/TransactionLogController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

router.use(verifyToken);

router.get('/order-item/:orderItemId', transactionLogController.getTransactionLogsByOrderItem);

router.get('/my-logs', transactionLogController.getMyTransactionLogs);

router.get('/all', requireAdmin, transactionLogController.getAllTransactionLogs);

router.get('/summary/:orderItemId', transactionLogController.getTransactionSummary);

router.post('/payment/:orderItemId', transactionLogController.makePayment);

module.exports = router;

