const express = require('express');
const router = express.Router();
const repairController = require('../controller/RepairController');
const middleware = require('../middleware/AuthToken');

router.use(middleware.verifyToken);

router.get('/', repairController.getAllRepairServices);
router.get('/search', repairController.searchRepairServices);
router.get('/damage/:damageLevel', repairController.getRepairServicesByDamageLevel);
router.get('/estimate/:damageLevel', repairController.getPriceEstimate);
router.get('/:id', repairController.getRepairServiceById);

router.post('/upload-image', repairController.uploadRepairImage);

router.post('/', repairController.createRepairService);
router.put('/:id', repairController.updateRepairService);
router.delete('/:id', repairController.deleteRepairService);

router.use((err, req, res, next) => {
  console.error('Repair routes error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in repair service',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;
