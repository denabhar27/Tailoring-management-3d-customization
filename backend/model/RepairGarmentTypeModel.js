const db = require('../config/db');

const RepairGarmentType = {
  
  getAll: (callback) => {
    const sql = `SELECT * FROM repair_garment_types WHERE is_active = 1 ORDER BY garment_name ASC`;
    db.query(sql, callback);
  },

  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM repair_garment_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  getById: (garmentId, callback) => {
    const sql = `SELECT * FROM repair_garment_types WHERE repair_garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  create: (garmentData, callback) => {
    const { garment_name, description, is_active } = garmentData;
    const sql = `
      INSERT INTO repair_garment_types (garment_name, description, is_active)
      VALUES (?, ?, ?)
    `;
    db.query(sql, [garment_name, description || null, is_active !== undefined ? is_active : 1], callback);
  },

  update: (garmentId, garmentData, callback) => {
    const { garment_name, description, is_active } = garmentData;
    const sql = `
      UPDATE repair_garment_types 
      SET garment_name = ?, description = ?, is_active = ?
      WHERE repair_garment_id = ?
    `;
    db.query(sql, [garment_name, description || null, is_active !== undefined ? is_active : 1, garmentId], callback);
  },

  delete: (garmentId, callback) => {
    const sql = `UPDATE repair_garment_types SET is_active = 0 WHERE repair_garment_id = ?`;
    db.query(sql, [garmentId], callback);
  },

  permanentDelete: (garmentId, callback) => {
    const sql = `DELETE FROM repair_garment_types WHERE repair_garment_id = ?`;
    db.query(sql, [garmentId], callback);
  }
};

module.exports = RepairGarmentType;

