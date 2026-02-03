const FabricType = require('../model/FabricTypeModel');
const db = require('../config/db');

const ensureTableExists = (callback) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS fabric_types (
      fabric_id INT AUTO_INCREMENT PRIMARY KEY,
      fabric_name VARCHAR(100) NOT NULL UNIQUE,
      fabric_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_fabric_name (fabric_name),
      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating fabric_types table:', err);
      return callback(err);
    }
    callback(null);
  });
};

exports.getAllFabricTypes = (req, res) => {
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    FabricType.getAll((err, fabrics) => {
      if (err) {
        console.error('Get fabric types error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching fabric types',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        fabrics: fabrics || []
      });
    });
  });
};

exports.getAllFabricTypesAdmin = (req, res) => {
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    FabricType.getAllAdmin((err, fabrics) => {
      if (err) {
        console.error('Get fabric types (admin) error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching fabric types',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        fabrics: fabrics || []
      });
    });
  });
};

exports.getFabricTypeById = (req, res) => {
  const { fabricId } = req.params;
  
  FabricType.getById(fabricId, (err, results) => {
    if (err) {
      console.error('Get fabric type by ID error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching fabric type',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fabric type not found'
      });
    }
    
    res.json({
      success: true,
      fabric: results[0]
    });
  });
};

exports.createFabricType = (req, res) => {
  const { fabric_name, fabric_price, description, is_active } = req.body;
  
  if (!fabric_name || !fabric_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Fabric name is required'
    });
  }
  
  if (fabric_price === undefined || fabric_price === null || isNaN(parseFloat(fabric_price))) {
    return res.status(400).json({
      success: false,
      message: 'Valid fabric price is required'
    });
  }
  
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    FabricType.create({
      fabric_name: fabric_name.trim(),
      fabric_price: parseFloat(fabric_price),
      description: description || null,
      is_active: is_active !== undefined ? is_active : 1
    }, (err, result) => {
      if (err) {
        console.error('Create fabric type error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            success: false,
            message: 'Fabric type with this name already exists'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error creating fabric type',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        message: 'Fabric type created successfully',
        fabric: {
          fabric_id: result.insertId,
          fabric_name: fabric_name.trim(),
          fabric_price: parseFloat(fabric_price),
          description: description || null,
          is_active: is_active !== undefined ? is_active : 1
        }
      });
    });
  });
};

exports.updateFabricType = (req, res) => {
  const { fabricId } = req.params;
  const { fabric_name, fabric_price, description, is_active } = req.body;
  
  if (!fabric_name || !fabric_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Fabric name is required'
    });
  }
  
  if (fabric_price === undefined || fabric_price === null || isNaN(parseFloat(fabric_price))) {
    return res.status(400).json({
      success: false,
      message: 'Valid fabric price is required'
    });
  }
  
  FabricType.update(fabricId, {
    fabric_name: fabric_name.trim(),
    fabric_price: parseFloat(fabric_price),
    description: description || null,
    is_active: is_active !== undefined ? is_active : 1
  }, (err, result) => {
    if (err) {
      console.error('Update fabric type error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Fabric type with this name already exists'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error updating fabric type',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fabric type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Fabric type updated successfully'
    });
  });
};

exports.deleteFabricType = (req, res) => {
  const { fabricId } = req.params;

  FabricType.permanentDelete(fabricId, (err, result) => {
    if (err) {
      console.error('Delete fabric type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error deleting fabric type',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fabric type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Fabric type deleted successfully'
    });
  });
};

