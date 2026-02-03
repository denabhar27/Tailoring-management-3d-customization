const express = require('express');
const router = express.Router();
const repairGarmentTypeController = require('../controller/RepairGarmentTypeController');
const { verifyToken } = require('../middleware/AuthToken');

router.get('/', repairGarmentTypeController.getAllRepairGarmentTypes);

router.use(verifyToken);

router.get('/admin', repairGarmentTypeController.getAllRepairGarmentTypesAdmin);

router.get('/:garmentId', repairGarmentTypeController.getRepairGarmentTypeById);

router.post('/', repairGarmentTypeController.createRepairGarmentType);

router.put('/:garmentId', repairGarmentTypeController.updateRepairGarmentType);

router.delete('/:garmentId', repairGarmentTypeController.deleteRepairGarmentType);

module.exports = router;

