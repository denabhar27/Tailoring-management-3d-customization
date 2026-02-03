const db = require('../config/db');

const GarmentType = {
  
  getAll: (callback) => {
    const sql = `SELECT * FROM garment_types WHERE is_active = 1 ORDER BY garment_name ASC`;
    db.query(sql, callback);
  },

  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM garment_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  getById: (garmentId, callback) => {
    const sql = `SELECT * FROM garment_types WHERE garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  create: (garmentData, callback) => {
    const { garment_name, garment_price, garment_code, description, is_active } = garmentData;
    const sql = `
      INSERT INTO garment_types (garment_name, garment_price, garment_code, description, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [garment_name, garment_price || 0.00, garment_code || null, description || null, is_active !== undefined ? is_active : 1], callback);
  },

  update: (garmentId, garmentData, callback) => {
    const { garment_name, garment_price, garment_code, description, is_active } = garmentData;
    const sql = `
      UPDATE garment_types 
      SET garment_name = ?, garment_price = ?, garment_code = ?, description = ?, is_active = ?
      WHERE garment_id = ?
    `;
    db.query(sql, [garment_name, garment_price, garment_code || null, description || null, is_active !== undefined ? is_active : 1, garmentId], callback);
  },

  delete: (garmentId, callback) => {
    const sql = `UPDATE garment_types SET is_active = 0 WHERE garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  permanentDelete: (garmentId, callback) => {
    const sql = `DELETE FROM garment_types WHERE garment_id = ?`;
    db.query(sql, [garmentId], callback);
  }
};

module.exports = GarmentType;

