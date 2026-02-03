const DamageRecord = require('../model/DamageRecordModel');

exports.createDamageRecord = (req, res) => {
  const {
    inventory_item_id,
    customer_name,
    walk_in_customer_id,
    user_id,
    damage_type,
    damage_description,
    repair_cost,
    repair_status
  } = req.body;

  if (!inventory_item_id || !customer_name || !damage_type) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: inventory_item_id, customer_name, damage_type'
    });
  }

  DamageRecord.create({
    inventory_item_id,
    customer_name,
    walk_in_customer_id: walk_in_customer_id || null,
    user_id: user_id || null,
    damage_type,
    damage_description: damage_description || null,
    repair_cost: repair_cost || 0,
    repair_status: repair_status || 'pending'
  }, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error creating damage record',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Damage record created successfully',
      damageRecord: result
    });
  });
};

exports.getAllDamageRecords = (req, res) => {
  DamageRecord.getAll((err, records) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching damage records',
        error: err
      });
    }

    res.json({
      success: true,
      damageRecords: records
    });
  });
};

exports.getDamageRecordsByItem = (req, res) => {
  const { itemId } = req.params;

  DamageRecord.getByInventoryItem(itemId, (err, records) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching damage records',
        error: err
      });
    }

    res.json({
      success: true,
      damageRecords: records
    });
  });
};

exports.getDamageRecordById = (req, res) => {
  const { id } = req.params;

  DamageRecord.getById(id, (err, record) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error fetching damage record',
        error: err
      });
    }

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Damage record not found'
      });
    }

    res.json({
      success: true,
      damageRecord: record
    });
  });
};

exports.updateDamageRecord = (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  DamageRecord.update(id, updateData, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error updating damage record',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Damage record updated successfully',
      result: result
    });
  });
};

exports.deleteDamageRecord = (req, res) => {
  const { id } = req.params;

  DamageRecord.delete(id, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting damage record',
        error: err
      });
    }

    res.json({
      success: true,
      message: 'Damage record deleted successfully'
    });
  });
};

