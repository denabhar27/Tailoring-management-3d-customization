const RepairService = require('../model/RepairModel');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/repair-images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'repair-' + (req.user?.id || 'guest') + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 
  }
});

exports.getAllRepairServices = (req, res) => {
  RepairService.getAll((err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching repair services", 
        error: err 
      });
    }
    
    res.json({
      success: true,
      message: "Repair services retrieved successfully",
      data: results,
      count: results.length
    });
  });
};

exports.getRepairServiceById = (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Valid service ID is required"
    });
  }

  RepairService.getById(id, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching repair service", 
        error: err 
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Repair service not found"
      });
    }
    
    res.json({
      success: true,
      message: "Repair service retrieved successfully",
      data: results[0]
    });
  });
};

exports.getRepairServicesByDamageLevel = (req, res) => {
  const { damageLevel } = req.params;
  
  const validLevels = ['minor', 'moderate', 'major', 'severe'];
  if (!damageLevel || !validLevels.includes(damageLevel)) {
    return res.status(400).json({
      success: false,
      message: "Valid damage level is required (minor, moderate, major, severe)"
    });
  }

  RepairService.getByDamageLevel(damageLevel, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching repair services by damage level", 
        error: err 
      });
    }
    
    res.json({
      success: true,
      message: "Repair services retrieved successfully",
      data: results,
      damageLevel: damageLevel,
      count: results.length
    });
  });
};

exports.createRepairService = (req, res) => {
  const {
    service_name,
    description,
    base_price,
    price_adjustment,
    damage_level,
    estimated_time,
    requires_image
  } = req.body;

  if (!service_name || !base_price || !price_adjustment) {
    return res.status(400).json({
      success: false,
      message: "Service name, base price, and price adjustment are required"
    });
  }

  const validLevels = ['minor', 'moderate', 'major', 'severe'];
  if (damage_level && !validLevels.includes(damage_level)) {
    return res.status(400).json({
      success: false,
      message: "Invalid damage level. Must be: minor, moderate, major, or severe"
    });
  }

  const serviceData = {
    service_name,
    description,
    base_price,
    price_adjustment,
    damage_level,
    estimated_time,
    requires_image: requires_image !== undefined ? requires_image : 1
  };

  RepairService.create(serviceData, (err, result) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error creating repair service", 
        error: err 
      });
    }
    
    res.status(201).json({
      success: true,
      message: "Repair service created successfully",
      data: {
        service_id: result.insertId,
        ...serviceData
      }
    });
  });
};

exports.updateRepairService = (req, res) => {
  const { id } = req.params;
  const {
    service_name,
    description,
    base_price,
    price_adjustment,
    damage_level,
    estimated_time,
    requires_image
  } = req.body;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Valid service ID is required"
    });
  }

  RepairService.getById(id, (err, existingService) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error checking repair service", 
        error: err 
      });
    }
    
    if (existingService.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Repair service not found"
      });
    }

    const validLevels = ['minor', 'moderate', 'major', 'severe'];
    if (damage_level && !validLevels.includes(damage_level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid damage level. Must be: minor, moderate, major, or severe"
      });
    }

    const serviceData = {
      service_name: service_name || existingService[0].service_name,
      description,
      base_price: base_price || existingService[0].base_price,
      price_adjustment: price_adjustment || existingService[0].price_adjustment,
      damage_level: damage_level || existingService[0].damage_level,
      estimated_time,
      requires_image: requires_image !== undefined ? requires_image : existingService[0].requires_image
    };

    RepairService.update(id, serviceData, (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error updating repair service", 
          error: err 
        });
      }
      
      res.json({
        success: true,
        message: "Repair service updated successfully",
        data: {
          service_id: parseInt(id),
          ...serviceData
        }
      });
    });
  });
};

exports.deleteRepairService = (req, res) => {
  const { id } = req.params;
  
  if (!id || isNaN(id)) {
    return res.status(400).json({
      success: false,
      message: "Valid service ID is required"
    });
  }

  RepairService.getById(id, (err, existingService) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error checking repair service", 
        error: err 
      });
    }
    
    if (existingService.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Repair service not found"
      });
    }

    RepairService.delete(id, (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error deleting repair service", 
          error: err 
        });
      }
      
      res.json({
        success: true,
        message: "Repair service deleted successfully"
      });
    });
  });
};

exports.getPriceEstimate = (req, res) => {
  const { damageLevel } = req.params;
  
  const validLevels = ['minor', 'moderate', 'major', 'severe'];
  if (!damageLevel || !validLevels.includes(damageLevel)) {
    return res.status(400).json({
      success: false,
      message: "Valid damage level is required (minor, moderate, major, severe)"
    });
  }

  RepairService.getPriceEstimate(damageLevel, (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error fetching price estimates", 
        error: err 
      });
    }
    
    res.json({
      success: true,
      message: "Price estimates retrieved successfully",
      data: results,
      damageLevel: damageLevel,
      count: results.length
    });
  });
};

exports.searchRepairServices = (req, res) => {
  const { q } = req.query;
  
  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search term must be at least 2 characters long"
    });
  }

  RepairService.search(q.trim(), (err, results) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Error searching repair services", 
        error: err 
      });
    }
    
    res.json({
      success: true,
      message: "Repair services search completed",
      data: results,
      searchTerm: q.trim(),
      count: results.length
    });
  });
};

exports.uploadRepairImage = (req, res) => {
  console.log('Upload repair image request received');
  console.log('Request user:', req.user);
  
  upload.single('repairImage')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum 5MB allowed"
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: err.message || "Error uploading file"
        });
      }
    }

    if (!req.file) {
      console.error('No file uploaded in request');
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    console.log('File uploaded successfully:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    });

    res.json({
      success: true,
      message: "Repair image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/repair-images/${req.file.filename}`
      }
    });
  });
};

exports.upload = upload;
