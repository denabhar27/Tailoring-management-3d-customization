const express = require('express');
const router = express.Router();
const fabricTypeController = require('../controller/FabricTypeController');
const { verifyToken } = require('../middleware/AuthToken');

router.get('/', fabricTypeController.getAllFabricTypes);

router.use(verifyToken);

router.get('/admin', fabricTypeController.getAllFabricTypesAdmin);

router.get('/:fabricId', fabricTypeController.getFabricTypeById);

router.post('/', fabricTypeController.createFabricType);

router.put('/:fabricId', fabricTypeController.updateFabricType);

router.delete('/:fabricId', fabricTypeController.deleteFabricType);

module.exports = router;

