const db = require('../config/db');

const DryCleaningGarmentType = {
  
  getAllActive: (callback) => {
    const sql = `SELECT * FROM dry_cleaning_garment_types WHERE is_active = 1 ORDER BY garment_name ASC`;
    db.query(sql, callback);
  },

  getAllAdmin: (callback) => {
    const sql = `SELECT * FROM dry_cleaning_garment_types ORDER BY created_at DESC`;
    db.query(sql, callback);
  },

  getById: (id, callback) => {
    const sql = `SELECT * FROM dry_cleaning_garment_types WHERE dc_garment_id = ?`;
    db.query(sql, [id], callback);
  },

  create: (data, callback) => {
    const sql = `
      INSERT INTO dry_cleaning_garment_types (garment_name, garment_price, description, is_active)
      VALUES (?, ?, ?, ?)
    `;
    const values = [data.garment_name, data.garment_price || 0, data.description || null, data.is_active !== undefined ? data.is_active : 1];
    db.query(sql, values, callback);
  },

  update: (id, data, callback) => {
    const sql = `
      UPDATE dry_cleaning_garment_types 
      SET garment_name = ?, garment_price = ?, description = ?, is_active = ?
      WHERE dc_garment_id = ?
    `;
    const values = [data.garment_name, data.garment_price || 0, data.description || null, data.is_active !== undefined ? data.is_active : 1, id];
    db.query(sql, values, callback);
  },

  softDelete: (id, callback) => {
    const sql = `UPDATE dry_cleaning_garment_types SET is_active = 0 WHERE dc_garment_id = ?`;
    db.query(sql, [id], callback);
  },

  hardDelete: (id, callback) => {
    const sql = `DELETE FROM dry_cleaning_garment_types WHERE dc_garment_id = ?`;
    db.query(sql, [id], callback);
  }
};

module.exports = DryCleaningGarmentType;
