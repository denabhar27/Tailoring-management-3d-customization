const DryCleaningGarmentType = require('../model/DryCleaningGarmentTypeModel');

exports.getAllActive = (req, res) => {
  DryCleaningGarmentType.getAllActive((err, results) => {
    if (err) {
      console.error('Get dry cleaning garment types error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Dry cleaning garment types retrieved successfully',
      data: results
    });
  });
};

exports.getAllAdmin = (req, res) => {
  DryCleaningGarmentType.getAllAdmin((err, results) => {
    if (err) {
      console.error('Get dry cleaning garment types error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Dry cleaning garment types retrieved successfully',
      data: results
    });
  });
};

exports.getById = (req, res) => {
  const { id } = req.params;
  
  DryCleaningGarmentType.getById(id, (err, results) => {
    if (err) {
      console.error('Get dry cleaning garment type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning garment type not found'
      });
    }

    res.json({
      success: true,
      message: 'Dry cleaning garment type retrieved successfully',
      data: results[0]
    });
  });
};

exports.create = (req, res) => {
  const { garment_name, garment_price, description, is_active } = req.body;

  if (!garment_name) {
    return res.status(400).json({
      success: false,
      message: 'Garment name is required'
    });
  }

  const garmentData = {
    garment_name,
    garment_price: garment_price || 0,
    description: description || null,
    is_active: is_active !== undefined ? is_active : 1
  };

  DryCleaningGarmentType.create(garmentData, (err, result) => {
    if (err) {
      console.error('Create dry cleaning garment type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }

    res.status(201).json({
      success: true,
      message: 'Dry cleaning garment type created successfully',
      data: {
        dc_garment_id: result.insertId,
        ...garmentData
      }
    });
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { garment_name, garment_price, description, is_active } = req.body;

  if (!garment_name) {
    return res.status(400).json({
      success: false,
      message: 'Garment name is required'
    });
  }

  const garmentData = {
    garment_name,
    garment_price: garment_price || 0,
    description: description || null,
    is_active: is_active !== undefined ? is_active : 1
  };

  DryCleaningGarmentType.update(id, garmentData, (err, result) => {
    if (err) {
      console.error('Update dry cleaning garment type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning garment type not found'
      });
    }

    res.json({
      success: true,
      message: 'Dry cleaning garment type updated successfully',
      data: {
        dc_garment_id: id,
        ...garmentData
      }
    });
  });
};

exports.softDelete = (req, res) => {
  const { id } = req.params;

  DryCleaningGarmentType.softDelete(id, (err, result) => {
    if (err) {
      console.error('Soft delete dry cleaning garment type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning garment type not found'
      });
    }

    res.json({
      success: true,
      message: 'Dry cleaning garment type deactivated successfully'
    });
  });
};

exports.hardDelete = (req, res) => {
  const { id } = req.params;

  DryCleaningGarmentType.hardDelete(id, (err, result) => {
    if (err) {
      console.error('Hard delete dry cleaning garment type error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error',
        error: err
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Dry cleaning garment type not found'
      });
    }

    res.json({
      success: true,
      message: 'Dry cleaning garment type deleted successfully'
    });
  });
};
