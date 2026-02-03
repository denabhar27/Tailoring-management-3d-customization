const db = require('../config/db');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/drycleaning-images/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'drycleaning-' + (req.user?.id || 'guest') + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

exports.getAllDryCleaningServices = (req, res) => {
  const query = `
    SELECT service_id, service_name, description, base_price, price_per_item, 
           min_items, max_items, estimated_time, requires_image, created_at
    FROM dry_cleaning_services 
    ORDER BY service_name
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Get dry cleaning services error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }
    
    res.json({
      success: true,
      message: 'Dry cleaning services retrieved successfully',
      data: results
    });
  });
};

exports.getDryCleaningServiceById = (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT service_id, service_name, description, base_price, price_per_item, 
           min_items, max_items, estimated_time, requires_image, created_at
    FROM dry_cleaning_services 
    WHERE service_id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Get dry cleaning service error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Dry cleaning service retrieved successfully',
      data: results[0]
    });
  });
};

exports.uploadDryCleaningImage = (req, res) => {
  console.log('Upload dry cleaning image request received');
  console.log('Request user:', req.user);
  
  upload.single('dryCleaningImage')(req, res, (err) => {
    if (err) {
      console.error('Upload error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: "File size too large. Maximum 5MB allowed"
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: "Too many files uploaded"
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
      message: "Dry cleaning image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/drycleaning-images/${req.file.filename}`
      }
    });
  });
};

exports.searchDryCleaningServices = (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({
      success: false,
      message: "Search query is required"
    });
  }
  
  const query = `
    SELECT service_id, service_name, description, base_price, price_per_item, 
           min_items, max_items, estimated_time, requires_image, created_at
    FROM dry_cleaning_services 
    WHERE service_name LIKE ? OR description LIKE ?
    ORDER BY service_name
  `;
  
  const searchTerm = `%${q}%`;
  
  db.query(query, [searchTerm, searchTerm], (err, results) => {
    if (err) {
      console.error('Search dry cleaning services error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }
    
    res.json({
      success: true,
      message: 'Dry cleaning services search results',
      data: results
    });
  });
};

exports.getPriceEstimate = (req, res) => {
  const { id } = req.params;
  const { quantity = 1 } = req.query;

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty < 1 || qty > 50) {
    return res.status(400).json({
      success: false,
      message: "Quantity must be between 1 and 50"
    });
  }
  
  const query = `
    SELECT base_price, price_per_item, estimated_time
    FROM dry_cleaning_services 
    WHERE service_id = ?
  `;
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Get price estimate error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }
    
    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning service not found'
      });
    }
    
    const service = results[0];
    const basePrice = parseFloat(service.base_price);
    const pricePerItem = parseFloat(service.price_per_item);
    const estimatedPrice = basePrice + (pricePerItem * qty);
    
    res.json({
      success: true,
      message: 'Price estimate calculated successfully',
      data: {
        serviceId: id,
        quantity: qty,
        basePrice: basePrice,
        pricePerItem: pricePerItem,
        estimatedPrice: estimatedPrice,
        estimatedTime: service.estimated_time
      }
    });
  });
};

exports.createDryCleaningService = (req, res) => {
  const {
    service_name,
    description,
    base_price,
    price_per_item,
    min_items = 1,
    max_items = 50,
    estimated_time,
    requires_image = 0
  } = req.body;

  if (!service_name || !base_price || !price_per_item) {
    return res.status(400).json({
      success: false,
      message: "Service name, base price, and price per item are required"
    });
  }
  
  const query = `
    INSERT INTO dry_cleaning_services 
    (service_name, description, base_price, price_per_item, min_items, max_items, estimated_time, requires_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.query(query, [
    service_name,
    description,
    base_price,
    price_per_item,
    min_items,
    max_items,
    estimated_time,
    requires_image
  ], (err, result) => {
    if (err) {
      console.error('Create dry cleaning service error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Dry cleaning service created successfully',
      data: {
        service_id: result.insertId,
        service_name,
        description,
        base_price,
        price_per_item,
        min_items,
        max_items,
        estimated_time,
        requires_image
      }
    });
  });
};

exports.updateDryCleaningService = (req, res) => {
  const { id } = req.params;
  const {
    service_name,
    description,
    base_price,
    price_per_item,
    min_items,
    max_items,
    estimated_time,
    requires_image
  } = req.body;
  
  const query = `
    UPDATE dry_cleaning_services 
    SET service_name = ?, description = ?, base_price = ?, price_per_item = ?, 
        min_items = ?, max_items = ?, estimated_time = ?, requires_image = ?
    WHERE service_id = ?
  `;
  
  db.query(query, [
    service_name,
    description,
    base_price,
    price_per_item,
    min_items,
    max_items,
    estimated_time,
    requires_image,
    id
  ], (err, result) => {
    if (err) {
      console.error('Update dry cleaning service error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Dry cleaning service updated successfully'
    });
  });
};

exports.deleteDryCleaningService = (req, res) => {
  const { id } = req.params;
  
  const query = 'DELETE FROM dry_cleaning_services WHERE service_id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Delete dry cleaning service error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Dry cleaning service deleted successfully'
    });
  });
};
