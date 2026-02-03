const RepairGarmentType = require('../model/RepairGarmentTypeModel');
const db = require('../config/db');

const ensureTableExists = (callback) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS repair_garment_types (
      repair_garment_id INT AUTO_INCREMENT PRIMARY KEY,
      garment_name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      INDEX idx_garment_name (garment_name),
      INDEX idx_is_active (is_active),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating repair_garment_types table:', err);
      return callback(err);
    }
    callback(null);
  });
};

exports.getAllRepairGarmentTypes = (req, res) => {
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    RepairGarmentType.getAll((err, garments) => {
      if (err) {
        console.error('Get repair garment types error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching repair garment types',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        garments: garments || []
      });
    });
  });
};

exports.getAllRepairGarmentTypesAdmin = (req, res) => {
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    RepairGarmentType.getAllAdmin((err, garments) => {
      if (err) {
        console.error('Get repair garment types (admin) error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching repair garment types',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        garments: garments || []
      });
    });
  });
};

exports.getRepairGarmentTypeById = (req, res) => {
  const garmentId = req.params.garmentId;
  
  RepairGarmentType.getById(garmentId, (err, garment) => {
    if (err) {
      console.error('Get repair garment type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching repair garment type',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (!garment || garment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair garment type not found'
      });
    }
    
    res.json({
      success: true,
      garment: garment[0]
    });
  });
};

exports.createRepairGarmentType = (req, res) => {
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  
  const { garment_name, description, is_active } = req.body;
  
  if (!garment_name || !garment_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Garment name is required'
    });
  }
  
  ensureTableExists((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error. Please contact administrator.'
      });
    }
    
    const garmentData = {
      garment_name: garment_name.trim(),
      description: description || null,
      is_active: is_active !== undefined ? is_active : 1
    };
    
    RepairGarmentType.create(garmentData, (err, result) => {
      if (err) {
        console.error('Create repair garment type error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({
            success: false,
            message: 'Repair garment type with this name already exists'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Error creating repair garment type',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      res.json({
        success: true,
        message: 'Repair garment type created successfully',
        garment: {
          repair_garment_id: result.insertId,
          ...garmentData
        }
      });
    });
  });
};

exports.updateRepairGarmentType = (req, res) => {
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  
  const garmentId = req.params.garmentId;
  const { garment_name, description, is_active } = req.body;
  
  if (!garment_name || !garment_name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Garment name is required'
    });
  }
  
  const garmentData = {
    garment_name: garment_name.trim(),
    description: description || null,
    is_active: is_active !== undefined ? is_active : 1
  };
  
  RepairGarmentType.update(garmentId, garmentData, (err, result) => {
    if (err) {
      console.error('Update repair garment type error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
          success: false,
          message: 'Repair garment type with this name already exists'
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Error updating repair garment type',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Repair garment type not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Repair garment type updated successfully'
    });
  });
};

exports.deleteRepairGarmentType = (req, res) => {
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  
  const garmentId = req.params.garmentId;
  const permanent = req.query.permanent === 'true';
  
  if (permanent) {
    RepairGarmentType.permanentDelete(garmentId, (err, result) => {
      if (err) {
        console.error('Delete repair garment type error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting repair garment type',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Repair garment type not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Repair garment type permanently deleted'
      });
    });
  } else {
    RepairGarmentType.delete(garmentId, (err, result) => {
      if (err) {
        console.error('Delete repair garment type error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error deleting repair garment type',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Repair garment type not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Repair garment type deleted (deactivated)'
      });
    });
  }
};

