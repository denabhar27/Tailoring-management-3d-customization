const Pattern = require('../model/PatternModel');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createSeamlessTexture, validateForFabricTexture, getRepeatRecommendation } = require('../utils/seamlessTextureProcessor');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/patterns';
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'pattern-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/svg+xml';
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: fileFilter
});

exports.uploadPatternImage = upload.single('patternImage');

exports.getAllPatterns = (req, res) => {
  Pattern.getAll((err, patterns) => {
    if (err) {
      console.error('Get all patterns error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching patterns'
      });
    }
    
    res.json({
      success: true,
      patterns: patterns
    });
  });
};

exports.getPatternsByType = (req, res) => {
  const { type } = req.params;
  
  if (!['procedural', 'image'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pattern type. Must be "procedural" or "image"'
    });
  }
  
  Pattern.getByType(type, (err, patterns) => {
    if (err) {
      console.error('Get patterns by type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching patterns'
      });
    }
    
    res.json({
      success: true,
      patterns: patterns
    });
  });
};

exports.getPatternById = (req, res) => {
  const { patternId } = req.params;
  
  Pattern.getById(patternId, (err, pattern) => {
    if (err) {
      console.error('Get pattern by ID error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching pattern'
      });
    }
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Pattern not found'
      });
    }
    
    res.json({
      success: true,
      pattern: pattern
    });
  });
};

exports.getPatternByCode = (req, res) => {
  const { code } = req.params;
  
  Pattern.getByCode(code, (err, pattern) => {
    if (err) {
      console.error('Get pattern by code error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching pattern'
      });
    }
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Pattern not found'
      });
    }
    
    res.json({
      success: true,
      pattern: pattern
    });
  });
};

exports.createPattern = (req, res) => {
  const {
    pattern_code,
    pattern_name,
    pattern_type,
    procedural_type,
    repeat_x,
    repeat_y,
    is_seamless,
    description,
    sort_order
  } = req.body;

  if (!pattern_code || !pattern_name) {
    return res.status(400).json({
      success: false,
      message: 'Pattern code and name are required'
    });
  }

  Pattern.codeExists(pattern_code, null, (err, exists) => {
    if (err) {
      console.error('Check pattern code error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error checking pattern code'
      });
    }
    
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Pattern code already exists'
      });
    }

    const patternData = {
      pattern_code,
      pattern_name,
      pattern_type: pattern_type || 'procedural',
      procedural_type: procedural_type || null,
      repeat_x: repeat_x || 2.0,
      repeat_y: repeat_y || 2.0,
      is_seamless: is_seamless !== undefined ? is_seamless : 1,
      description: description || null,
      sort_order: sort_order || 0,
      created_by: req.user?.id || null
    };

    if (req.file) {
      patternData.pattern_type = 'image';
      patternData.image_path = req.file.path;
      patternData.image_url = `/uploads/patterns/${req.file.filename}`;
      patternData.preview_url = patternData.image_url;
    }
    
    Pattern.create(patternData, (err, result) => {
      if (err) {
        console.error('Create pattern error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error creating pattern'
        });
      }

      Pattern.getById(result.insertId, (err, pattern) => {
        if (err) {
          console.error('Fetch created pattern error:', err);
        }
        
        res.status(201).json({
          success: true,
          message: 'Pattern created successfully',
          pattern: pattern || { pattern_id: result.insertId, ...patternData }
        });
      });
    });
  });
};

exports.handlePatternImageUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    const {
      pattern_code,
      pattern_name,
      repeat_x,
      repeat_y,
      is_seamless,
      description,
      sort_order,
      make_seamless,
      texture_size,
      pattern_scale
    } = req.body;

    if (!pattern_code || !pattern_name) {
      
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Pattern code and name are required'
      });
    }

    Pattern.codeExists(pattern_code, null, async (err, exists) => {
      if (err) {
        console.error('Check pattern code error:', err);
        fs.unlinkSync(req.file.path);
        return res.status(500).json({
          success: false,
          message: 'Error checking pattern code'
        });
      }
      
      if (exists) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Pattern code already exists'
        });
      }
      
      let imageUrl = `/uploads/patterns/${req.file.filename}`;
      let seamlessUrl = null;
      let processedData = null;

      const shouldMakeSeamless = make_seamless !== 'false' && make_seamless !== false;
      
      if (shouldMakeSeamless) {
        try {
          console.log('🔄 Processing image to create seamless texture...');

          const validation = await validateForFabricTexture(req.file.path);
          if (!validation.valid) {
            console.warn('⚠️ Image validation issues:', validation.issues);
          }

          processedData = await createSeamlessTexture(req.file.path, {
            targetSize: parseInt(texture_size) || 512,
            blendWidth: 0.15,
            preserveColors: true,
            generateMipmaps: true
          });
          
          if (processedData.success) {
            seamlessUrl = processedData.seamlessUrl;
            imageUrl = seamlessUrl; 
            console.log('✅ Seamless texture created:', seamlessUrl);
          } else {
            console.warn('⚠️ Seamless processing failed, using original image');
          }
        } catch (procError) {
          console.error('⚠️ Seamless processing error:', procError.message);
          
        }
      }

      const repeatRecommendation = getRepeatRecommendation('default', pattern_scale || 'medium');
      
      const patternData = {
        pattern_code,
        pattern_name,
        pattern_type: 'image',
        image_path: req.file.path,
        image_url: imageUrl,
        preview_url: `/uploads/patterns/${req.file.filename}`, 
        repeat_x: parseFloat(repeat_x) || repeatRecommendation.repeatX,
        repeat_y: parseFloat(repeat_y) || repeatRecommendation.repeatY,
        is_seamless: seamlessUrl ? 1 : (is_seamless !== undefined ? is_seamless : 1),
        description: description || null,
        sort_order: sort_order || 0,
        created_by: req.user?.id || null
      };
      
      Pattern.create(patternData, (err, result) => {
        if (err) {
          console.error('Create pattern error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error creating pattern'
          });
        }
        
        Pattern.getById(result.insertId, (err, pattern) => {
          res.status(201).json({
            success: true,
            message: seamlessUrl 
              ? 'Pattern image processed into seamless texture and pattern created successfully'
              : 'Pattern image uploaded and pattern created successfully',
            pattern: pattern || { pattern_id: result.insertId, ...patternData },
            imageUrl: imageUrl,
            seamlessUrl: seamlessUrl,
            isSeamless: !!seamlessUrl,
            processedData: processedData?.metadata || null
          });
        });
      });
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading pattern image'
    });
  }
};

exports.updatePattern = (req, res) => {
  const { patternId } = req.params;
  const updateData = req.body;

  if (req.file) {
    updateData.pattern_type = 'image';
    updateData.image_path = req.file.path;
    updateData.image_url = `/uploads/patterns/${req.file.filename}`;
    updateData.preview_url = updateData.image_url;
  }

  Pattern.getById(patternId, (err, existingPattern) => {
    if (err) {
      console.error('Get pattern error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching pattern'
      });
    }
    
    if (!existingPattern) {
      return res.status(404).json({
        success: false,
        message: 'Pattern not found'
      });
    }

    if (updateData.pattern_code && updateData.pattern_code !== existingPattern.pattern_code) {
      Pattern.codeExists(updateData.pattern_code, patternId, (err, exists) => {
        if (err) {
          console.error('Check pattern code error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error checking pattern code'
          });
        }
        
        if (exists) {
          return res.status(400).json({
            success: false,
            message: 'Pattern code already exists'
          });
        }
        
        performUpdate();
      });
    } else {
      performUpdate();
    }
    
    function performUpdate() {
      Pattern.update(patternId, updateData, (err, result) => {
        if (err) {
          console.error('Update pattern error:', err);
          return res.status(500).json({
            success: false,
            message: 'Error updating pattern'
          });
        }

        if (req.file && existingPattern.image_path && fs.existsSync(existingPattern.image_path)) {
          try {
            fs.unlinkSync(existingPattern.image_path);
          } catch (e) {
            console.warn('Could not delete old pattern image:', e);
          }
        }
        
        Pattern.getById(patternId, (err, pattern) => {
          res.json({
            success: true,
            message: 'Pattern updated successfully',
            pattern: pattern
          });
        });
      });
    }
  });
};

exports.deletePattern = (req, res) => {
  const { patternId } = req.params;
  
  Pattern.getById(patternId, (err, pattern) => {
    if (err) {
      console.error('Get pattern error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching pattern'
      });
    }
    
    if (!pattern) {
      return res.status(404).json({
        success: false,
        message: 'Pattern not found'
      });
    }

    const defaultPatterns = ['none', 'minimal-stripe', 'minimal-check', 'embroidery-1', 'embroidery-2'];
    if (defaultPatterns.includes(pattern.pattern_code)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default patterns'
      });
    }
    
    Pattern.delete(patternId, (err, result) => {
      if (err) {
        console.error('Delete pattern error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting pattern'
        });
      }
      
      res.json({
        success: true,
        message: 'Pattern deleted successfully'
      });
    });
  });
};

exports.restorePattern = (req, res) => {
  const { patternId } = req.params;
  
  Pattern.update(patternId, { is_active: 1 }, (err, result) => {
    if (err) {
      console.error('Restore pattern error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error restoring pattern'
      });
    }
    
    res.json({
      success: true,
      message: 'Pattern restored successfully'
    });
  });
};
