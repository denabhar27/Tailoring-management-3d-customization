const db = require('../config/db');

const DryCleaning = {
  
  getAll: (callback) => {
    const query = `
      SELECT service_id, service_name, description, base_price, price_per_item, 
             min_items, max_items, estimated_time, requires_image, created_at
      FROM dry_cleaning_services 
      ORDER BY service_name
    `;
    
    db.query(query, (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  getById: (serviceId, callback) => {
    const query = `
      SELECT service_id, service_name, description, base_price, price_per_item, 
             min_items, max_items, estimated_time, requires_image, created_at
      FROM dry_cleaning_services 
      WHERE service_id = ?
    `;
    
    db.query(query, [serviceId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results[0] || null);
    });
  },

  search: (searchTerm, callback) => {
    const query = `
      SELECT service_id, service_name, description, base_price, price_per_item, 
             min_items, max_items, estimated_time, requires_image, created_at
      FROM dry_cleaning_services 
      WHERE service_name LIKE ? OR description LIKE ?
      ORDER BY service_name
    `;
    
    const term = `%${searchTerm}%`;
    
    db.query(query, [term, term], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  create: (serviceData, callback) => {
    const {
      service_name,
      description,
      base_price,
      price_per_item,
      min_items = 1,
      max_items = 50,
      estimated_time,
      requires_image = 0
    } = serviceData;
    
    const query = `
      INSERT INTO dry_cleaning_services 
      (service_name, description, base_price, price_per_item, min_items, max_items, estimated_time, requires_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [
      service_name,
      description,
      base_price,
      price_per_item,
      min_items,
      max_items,
      estimated_time,
      requires_image
    ], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      
      const newService = {
        service_id: result.insertId,
        service_name,
        description,
        base_price,
        price_per_item,
        min_items,
        max_items,
        estimated_time,
        requires_image,
        created_at: new Date()
      };
      
      callback(null, newService);
    });
  },

  update: (serviceId, serviceData, callback) => {
    const {
      service_name,
      description,
      base_price,
      price_per_item,
      min_items,
      max_items,
      estimated_time,
      requires_image
    } = serviceData;
    
    const query = `
      UPDATE dry_cleaning_services 
      SET service_name = ?, description = ?, base_price = ?, price_per_item = ?, 
          min_items = ?, max_items = ?, estimated_time = ?, requires_image = ?
      WHERE service_id = ?
    `;
    
    db.query(query, [
      service_name,
      description,
      base_price,
      price_per_item,
      min_items,
      max_items,
      estimated_time,
      requires_image,
      serviceId
    ], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      
      if (result.affectedRows === 0) {
        return callback(new Error('Dry cleaning service not found'), null);
      }
      
      callback(null, { updated: true });
    });
  },

  delete: (serviceId, callback) => {
    const query = 'DELETE FROM dry_cleaning_services WHERE service_id = ?';
    
    db.query(query, [serviceId], (err, result) => {
      if (err) {
        return callback(err, null);
      }
      
      if (result.affectedRows === 0) {
        return callback(new Error('Dry cleaning service not found'), null);
      }
      
      callback(null, { deleted: true });
    });
  },

  calculatePriceEstimate: (serviceId, quantity, callback) => {
    const query = `
      SELECT base_price, price_per_item, estimated_time
      FROM dry_cleaning_services 
      WHERE service_id = ?
    `;
    
    db.query(query, [serviceId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      
      if (results.length === 0) {
        return callback(new Error('Dry cleaning service not found'), null);
      }
      
      const service = results[0];
      const basePrice = parseFloat(service.base_price);
      const pricePerItem = parseFloat(service.price_per_item);
      const estimatedPrice = basePrice + (pricePerItem * quantity);
      
      const estimate = {
        serviceId: serviceId,
        quantity: quantity,
        basePrice: basePrice,
        pricePerItem: pricePerItem,
        estimatedPrice: estimatedPrice,
        estimatedTime: service.estimated_time
      };
      
      callback(null, estimate);
    });
  },

  validateQuantity: (serviceId, quantity, callback) => {
    const query = `
      SELECT min_items, max_items
      FROM dry_cleaning_services 
      WHERE service_id = ?
    `;
    
    db.query(query, [serviceId], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      
      if (results.length === 0) {
        return callback(new Error('Dry cleaning service not found'), null);
      }
      
      const service = results[0];
      const minItems = service.min_items || 1;
      const maxItems = service.max_items || 50;
      
      const isValid = quantity >= minItems && quantity <= maxItems;
      
      callback(null, {
        isValid: isValid,
        minItems: minItems,
        maxItems: maxItems,
        requestedQuantity: quantity
      });
    });
  },

  getByPriceRange: (minPrice, maxPrice, callback) => {
    const query = `
      SELECT service_id, service_name, description, base_price, price_per_item, 
             min_items, max_items, estimated_time, requires_image, created_at
      FROM dry_cleaning_services 
      WHERE price_per_item BETWEEN ? AND ?
      ORDER BY price_per_item ASC
    `;
    
    db.query(query, [minPrice, maxPrice], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  },

  getPopularServices: (limit = 5, callback) => {
    const query = `
      SELECT service_id, service_name, description, base_price, price_per_item, 
             min_items, max_items, estimated_time, requires_image, created_at
      FROM dry_cleaning_services 
      ORDER BY CAST(price_per_item AS DECIMAL(10,2)) ASC
      LIMIT ?
    `;
    
    db.query(query, [limit], (err, results) => {
      if (err) {
        return callback(err, null);
      }
      callback(null, results);
    });
  }
};

module.exports = DryCleaning;
