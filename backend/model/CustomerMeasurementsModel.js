const db = require('../config/db');

const CustomerMeasurements = {
  
  getByCustomerId: (customerId, callback) => {
    
    const sql = `
      SELECT * FROM customer_measurements 
      WHERE user_id = ? OR walk_in_customer_id = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    db.query(sql, [customerId, customerId], callback);
  },

  getByWalkInCustomerId: (walkInCustomerId, callback) => {
    const sql = `
      SELECT * FROM customer_measurements 
      WHERE walk_in_customer_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    db.query(sql, [walkInCustomerId], callback);
  },

  getAllByCustomerId: (userId, callback) => {
    const sql = `
      SELECT * FROM customer_measurements 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  upsert: (customerId, measurements, callback) => {
    const { isWalkIn = false } = measurements;

    CustomerMeasurements.getByCustomerId(customerId, (err, existing) => {
      if (err) {
        return callback(err, null);
      }

      const topMeasurements = JSON.stringify(measurements.top || {});
      const bottomMeasurements = JSON.stringify(measurements.bottom || {});
      const notes = measurements.notes || '';

      if (existing && existing.length > 0) {
        
        const sql = `
          UPDATE customer_measurements 
          SET top_measurements = ?, bottom_measurements = ?, notes = ?, updated_at = NOW()
          WHERE (user_id = ? OR walk_in_customer_id = ?)
        `;
        db.query(sql, [topMeasurements, bottomMeasurements, notes, customerId, customerId], callback);
      } else {
        
        if (isWalkIn) {
          const sql = `
            INSERT INTO customer_measurements (user_id, walk_in_customer_id, top_measurements, bottom_measurements, notes, created_at, updated_at)
            VALUES (NULL, ?, ?, ?, ?, NOW(), NOW())
          `;
          db.query(sql, [customerId, topMeasurements, bottomMeasurements, notes], callback);
        } else {
          const sql = `
            INSERT INTO customer_measurements (user_id, walk_in_customer_id, top_measurements, bottom_measurements, notes, created_at, updated_at)
            VALUES (?, NULL, ?, ?, ?, NOW(), NOW())
          `;
          db.query(sql, [customerId, topMeasurements, bottomMeasurements, notes], callback);
        }
      }
    });
  },

  delete: (measurementId, callback) => {
    const sql = `DELETE FROM customer_measurements WHERE measurement_id = ?`;
    db.query(sql, [measurementId], callback);
  }
};

module.exports = CustomerMeasurements;

