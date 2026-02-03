const express = require('express');
const router = express.Router();
const dryCleaningController = require('../controller/DryCleaningController');
const { verifyToken, requireAdmin } = require('../middleware/AuthToken');
const multer = require('multer');

router.use(verifyToken);

router.get('/', dryCleaningController.getAllDryCleaningServices);
router.get('/search', dryCleaningController.searchDryCleaningServices);
router.get('/:id', dryCleaningController.getDryCleaningServiceById);
router.get('/estimate/:id', dryCleaningController.getPriceEstimate);

router.post('/upload-image', dryCleaningController.uploadDryCleaningImage);

router.post('/', requireAdmin, dryCleaningController.createDryCleaningService);
router.put('/:id', requireAdmin, dryCleaningController.updateDryCleaningService);
router.delete('/:id', requireAdmin, dryCleaningController.deleteDryCleaningService);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files uploaded.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unexpected file field.' });
    }
  }
  
  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({ message: 'Only image files are allowed.' });
  }
  
  res.status(500).json({ message: 'Internal server error.' });
});

module.exports = router;
