const express = require('express');
const router = express.Router();
const PatternController = require('../controller/PatternController');
const middleware = require('../middleware/AuthToken');

router.get('/', PatternController.getAllPatterns);
router.get('/type/:type', PatternController.getPatternsByType);
router.get('/code/:code', PatternController.getPatternByCode);
router.get('/:patternId', PatternController.getPatternById);

router.use(middleware.verifyToken);

router.post('/', PatternController.createPattern);

router.post('/upload', 
  PatternController.uploadPatternImage, 
  PatternController.handlePatternImageUpload
);

router.put('/:patternId', 
  PatternController.uploadPatternImage, 
  PatternController.updatePattern
);

router.delete('/:patternId', PatternController.deletePattern);

router.post('/:patternId/restore', PatternController.restorePattern);

module.exports = router;
