const db = require('../config/db');

const Pattern = {
  
  getAll: (callback) => {
    const sql = `
      SELECT * FROM patterns 
      WHERE is_active = 1 
      ORDER BY sort_order ASC, pattern_name ASC
    `;
    db.query(sql, callback);
  },

  getByType: (patternType, callback) => {
    const sql = `
      SELECT * FROM patterns 
      WHERE pattern_type = ? AND is_active = 1 
      ORDER BY sort_order ASC, pattern_name ASC
    `;
    db.query(sql, [patternType], callback);
  },

  getByCode: (patternCode, callback) => {
    const sql = `
      SELECT * FROM patterns 
      WHERE pattern_code = ?
    `;
    db.query(sql, [patternCode], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null);
      callback(null, results[0]);
    });
  },

  getById: (patternId, callback) => {
    const sql = `
      SELECT * FROM patterns 
      WHERE pattern_id = ?
    `;
    db.query(sql, [patternId], (err, results) => {
      if (err) return callback(err, null);
      if (results.length === 0) return callback(null, null);
      callback(null, results[0]);
    });
  },

  create: (patternData, callback) => {
    const {
      pattern_code,
      pattern_name,
      pattern_type,
      procedural_type,
      image_path,
      image_url,
      repeat_x,
      repeat_y,
      is_seamless,
      description,
      preview_url,
      sort_order,
      created_by
    } = patternData;

    const sql = `
      INSERT INTO patterns 
      (pattern_code, pattern_name, pattern_type, procedural_type, image_path, image_url, 
       repeat_x, repeat_y, is_seamless, description, preview_url, sort_order, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [
      pattern_code,
      pattern_name,
      pattern_type || 'procedural',
      procedural_type || null,
      image_path || null,
      image_url || null,
      repeat_x || 2.0,
      repeat_y || 2.0,
      is_seamless !== undefined ? is_seamless : 1,
      description || null,
      preview_url || null,
      sort_order || 0,
      created_by || null
    ], callback);
  },

  update: (patternId, updateData, callback) => {
    const updates = [];
    const values = [];

    const allowedFields = [
      'pattern_code', 'pattern_name', 'pattern_type', 'procedural_type',
      'image_path', 'image_url', 'repeat_x', 'repeat_y', 'is_seamless',
      'description', 'preview_url', 'sort_order', 'is_active'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });

    if (updates.length === 0) {
      return callback(new Error('No fields to update'), null);
    }

    values.push(patternId);
    const sql = `UPDATE patterns SET ${updates.join(', ')} WHERE pattern_id = ?`;
    db.query(sql, values, callback);
  },

  delete: (patternId, callback) => {
    const sql = `UPDATE patterns SET is_active = 0 WHERE pattern_id = ?`;
    db.query(sql, [patternId], callback);
  },

  hardDelete: (patternId, callback) => {
    const sql = `DELETE FROM patterns WHERE pattern_id = ?`;
    db.query(sql, [patternId], callback);
  },

  codeExists: (patternCode, excludeId, callback) => {
    let sql = `SELECT pattern_id FROM patterns WHERE pattern_code = ?`;
    const params = [patternCode];
    
    if (excludeId) {
      sql += ` AND pattern_id != ?`;
      params.push(excludeId);
    }
    
    db.query(sql, params, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results.length > 0);
    });
  },

  getMaxSortOrder: (callback) => {
    const sql = `SELECT MAX(sort_order) as max_order FROM patterns`;
    db.query(sql, (err, results) => {
      if (err) return callback(err, null);
      callback(null, results[0]?.max_order || 0);
    });
  }
};

module.exports = Pattern;
