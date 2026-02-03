const express = require('express');
const router = express.Router();
const damageRecordController = require('../controller/DamageRecordController');
const middleware = require('../middleware/AuthToken');

router.use(middleware.verifyToken);

router.post('/', damageRecordController.createDamageRecord);
router.get('/', damageRecordController.getAllDamageRecords);
router.get('/item/:itemId', damageRecordController.getDamageRecordsByItem);
router.get('/:id', damageRecordController.getDamageRecordById);
router.put('/:id', damageRecordController.updateDamageRecord);
router.delete('/:id', damageRecordController.deleteDamageRecord);

module.exports = router;

