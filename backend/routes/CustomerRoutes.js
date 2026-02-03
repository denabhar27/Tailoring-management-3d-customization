const express = require('express');
const router = express.Router();
const customerController = require('../controller/CustomerController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

router.use(verifyToken);

router.get('/', requireAdmin, customerController.getAllCustomers);
router.get('/:id', requireAdmin, customerController.getCustomerById);
router.put('/:id', requireAdmin, customerController.updateCustomer);
router.patch('/:id/status', requireAdmin, customerController.updateCustomerStatus);
router.post('/:id/measurements', requireAdmin, customerController.saveMeasurements);
router.get('/:id/measurements', requireAdmin, customerController.getMeasurements);

module.exports = router;

