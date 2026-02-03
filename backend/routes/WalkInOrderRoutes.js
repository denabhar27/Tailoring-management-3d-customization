const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const walkInOrderController = require('../controller/WalkInOrderController');
const middleware = require('../middleware/AuthToken');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/customization-references/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'walkin-ref-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

router.use(middleware.verifyToken);

router.post('/dry-cleaning', walkInOrderController.createDryCleaningOrder);
router.post('/repair', walkInOrderController.createRepairOrder);
router.post('/customization', upload.single('referenceImage'), walkInOrderController.createCustomizationOrder);
router.post('/rental', walkInOrderController.createRentalOrder);

router.get('/', walkInOrderController.getAllWalkInOrders);

router.get('/:id', walkInOrderController.getWalkInOrderById);

router.get('/customers/search', walkInOrderController.searchWalkInCustomers);

module.exports = router;

