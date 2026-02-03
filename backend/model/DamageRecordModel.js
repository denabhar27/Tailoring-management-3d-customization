const db = require('../config/db');

const DamageRecord = {
  
  create: (damageData, callback) => {
    const sql = `
      INSERT INTO damage_records 
      (inventory_item_id, customer_name, walk_in_customer_id, user_id, damage_type, damage_description, repair_cost, repair_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      damageData.inventory_item_id,
      damageData.customer_name,
      damageData.walk_in_customer_id || null,
      damageData.user_id || null,
      damageData.damage_type,
      damageData.damage_description || null,
      damageData.repair_cost || 0,
      damageData.repair_status || 'pending'
    ];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, { id: result.insertId, ...damageData });
    });
  },

  getAll: (callback) => {
    const sql = `
      SELECT 
        dr.*,
        ri.item_name,
        ri.brand,
        ri.category,
        wc.name as walk_in_customer_name,
        wc.phone as walk_in_customer_phone,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM damage_records dr
      LEFT JOIN rental_inventory ri ON dr.inventory_item_id = ri.item_id
      LEFT JOIN walk_in_customers wc ON dr.walk_in_customer_id = wc.id
      LEFT JOIN user u ON dr.user_id = u.user_id
      ORDER BY dr.reported_date DESC
    `;
    db.query(sql, callback);
  },

  getByInventoryItem: (itemId, callback) => {
    const sql = `
      SELECT 
        dr.*,
        wc.name as walk_in_customer_name,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM damage_records dr
      LEFT JOIN walk_in_customers wc ON dr.walk_in_customer_id = wc.id
      LEFT JOIN user u ON dr.user_id = u.user_id
      WHERE dr.inventory_item_id = ?
      ORDER BY dr.reported_date DESC
    `;
    db.query(sql, [itemId], callback);
  },

  getById: (id, callback) => {
    const sql = `
      SELECT 
        dr.*,
        ri.item_name,
        ri.brand,
        ri.category,
        wc.name as walk_in_customer_name,
        wc.phone as walk_in_customer_phone,
        u.first_name as user_first_name,
        u.last_name as user_last_name
      FROM damage_records dr
      LEFT JOIN rental_inventory ri ON dr.inventory_item_id = ri.item_id
      LEFT JOIN walk_in_customers wc ON dr.walk_in_customer_id = wc.id
      LEFT JOIN user u ON dr.user_id = u.user_id
      WHERE dr.id = ?
    `;
    db.query(sql, [id], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0] || null);
    });
  },

  update: (id, updateData, callback) => {
    const fields = [];
    const values = [];

    if (updateData.damage_type !== undefined) {
      fields.push('damage_type = ?');
      values.push(updateData.damage_type);
    }
    if (updateData.damage_description !== undefined) {
      fields.push('damage_description = ?');
      values.push(updateData.damage_description);
    }
    if (updateData.repair_cost !== undefined) {
      fields.push('repair_cost = ?');
      values.push(updateData.repair_cost);
    }
    if (updateData.repair_status !== undefined) {
      fields.push('repair_status = ?');
      values.push(updateData.repair_status);
    }

    if (fields.length === 0) {
      return callback(null, { message: 'No fields to update' });
    }

    values.push(id);
    const sql = `UPDATE damage_records SET ${fields.join(', ')} WHERE id = ?`;
    
    db.query(sql, values, (err, result) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, result);
    });
  },

  delete: (id, callback) => {
    const sql = `DELETE FROM damage_records WHERE id = ?`;
    db.query(sql, [id], callback);
  }
};

module.exports = DamageRecord;

