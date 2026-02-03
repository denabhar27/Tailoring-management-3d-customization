const db = require('../config/db');

const RepairService = {
  
  getAll: (callback) => {
    const sql = "SELECT * FROM repair_services ORDER BY service_name";
    db.query(sql, callback);
  },

  getById: (serviceId, callback) => {
    const sql = "SELECT * FROM repair_services WHERE service_id = ?";
    db.query(sql, [serviceId], callback);
  },

  getByDamageLevel: (damageLevel, callback) => {
    const sql = "SELECT * FROM repair_services WHERE damage_level = ? ORDER BY service_name";
    db.query(sql, [damageLevel], callback);
  },

  create: (serviceData, callback) => {
    const {
      service_name,
      description,
      base_price,
      price_adjustment,
      damage_level,
      estimated_time,
      requires_image
    } = serviceData;

    const sql = `
      INSERT INTO repair_services 
      (service_name, description, base_price, price_adjustment, damage_level, estimated_time, requires_image) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [
      service_name,
      description,
      base_price,
      price_adjustment,
      damage_level || 'minor',
      estimated_time,
      requires_image !== undefined ? requires_image : 1
    ], callback);
  },

  update: (serviceId, serviceData, callback) => {
    const {
      service_name,
      description,
      base_price,
      price_adjustment,
      damage_level,
      estimated_time,
      requires_image
    } = serviceData;

    const sql = `
      UPDATE repair_services 
      SET service_name = ?, description = ?, base_price = ?, price_adjustment = ?, 
          damage_level = ?, estimated_time = ?, requires_image = ?
      WHERE service_id = ?
    `;
    
    db.query(sql, [
      service_name,
      description,
      base_price,
      price_adjustment,
      damage_level,
      estimated_time,
      requires_image,
      serviceId
    ], callback);
  },

  delete: (serviceId, callback) => {
    const sql = "DELETE FROM repair_services WHERE service_id = ?";
    db.query(sql, [serviceId], callback);
  },

  getPriceEstimate: (damageLevel, callback) => {
    const sql = `
      SELECT service_id, service_name, base_price, price_adjustment, damage_level, estimated_time 
      FROM repair_services 
      WHERE damage_level = ?
      ORDER BY base_price ASC
    `;
    db.query(sql, [damageLevel], callback);
  },

  search: (searchTerm, callback) => {
    const sql = `
      SELECT * FROM repair_services 
      WHERE service_name LIKE ? OR description LIKE ?
      ORDER BY service_name
    `;
    const searchPattern = `%${searchTerm}%`;
    db.query(sql, [searchPattern, searchPattern], callback);
  }
};

module.exports = RepairService;
