const express = require('express');
const router = express.Router();
const dcGarmentTypeController = require('../controller/DryCleaningGarmentTypeController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');

router.get('/admin/all', verifyToken, requireAdmin, dcGarmentTypeController.getAllAdmin);

router.get('/', dcGarmentTypeController.getAllActive);
router.get('/:id', dcGarmentTypeController.getById);

router.post('/', verifyToken, requireAdmin, dcGarmentTypeController.create);
router.put('/:id', verifyToken, requireAdmin, dcGarmentTypeController.update);
router.delete('/:id', verifyToken, requireAdmin, dcGarmentTypeController.hardDelete);
router.patch('/:id/deactivate', verifyToken, requireAdmin, dcGarmentTypeController.softDelete);

module.exports = router;
