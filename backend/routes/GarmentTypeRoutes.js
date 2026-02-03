const express = require('express');
const router = express.Router();
const garmentTypeController = require('../controller/GarmentTypeController');
const { verifyToken } = require('../middleware/AuthToken');

router.get('/', garmentTypeController.getAllGarmentTypes);

router.use(verifyToken);

router.get('/admin', garmentTypeController.getAllGarmentTypesAdmin);

router.get('/:garmentId', garmentTypeController.getGarmentTypeById);

router.post('/', garmentTypeController.createGarmentType);

router.put('/:garmentId', garmentTypeController.updateGarmentType);

router.delete('/:garmentId', garmentTypeController.deleteGarmentType);

module.exports = router;

