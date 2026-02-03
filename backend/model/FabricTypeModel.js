const db = require('../config/db');

const FabricType = {
  
  getAll: (callback) => {
    const sql = `SELECT * FROM fabric_types WHERE is_active = 1 ORDER BY fabric_name ASC`;
    db.query(sql, callback);
  },

  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM fabric_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  getById: (fabricId, callback) => {
    const sql = `SELECT * FROM fabric_types WHERE fabric_id = ?`;
    db.query(sql, [fabricId], callback);
  },

  create: (fabricData, callback) => {
    const { fabric_name, fabric_price, description, is_active } = fabricData;
    const sql = `
      INSERT INTO fabric_types (fabric_name, fabric_price, description, is_active)
      VALUES (?, ?, ?, ?)
    `;
    db.query(sql, [fabric_name, fabric_price || 0.00, description || null, is_active !== undefined ? is_active : 1], callback);
  },

  update: (fabricId, fabricData, callback) => {
    const { fabric_name, fabric_price, description, is_active } = fabricData;
    const sql = `
      UPDATE fabric_types 
      SET fabric_name = ?, fabric_price = ?, description = ?, is_active = ?
      WHERE fabric_id = ?
    `;
    db.query(sql, [fabric_name, fabric_price, description || null, is_active !== undefined ? is_active : 1, fabricId], callback);
  },

  delete: (fabricId, callback) => {
    const sql = `UPDATE fabric_types SET is_active = 0 WHERE fabric_id = ?`;
    db.query(sql, [fabricId], callback);
  },

  permanentDelete: (fabricId, callback) => {
    const sql = `DELETE FROM fabric_types WHERE fabric_id = ?`;
    db.query(sql, [fabricId], callback);
  }
};

module.exports = FabricType;

