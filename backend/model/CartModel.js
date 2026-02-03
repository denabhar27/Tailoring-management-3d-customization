const db = require('../config/db');

const Cart = {
  
  getUserCart: (userId, callback) => {
    const sql = `
      SELECT 
        c.*,
        DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(c.expires_at, '%Y-%m-%d %H:%i:%s') as expires_at
      FROM cart c
      WHERE c.user_id = ? AND (c.expires_at IS NULL OR c.expires_at > NOW())
      ORDER BY c.created_at DESC
    `;
    db.query(sql, [userId], callback);
  },

  addToCart: (userId, serviceType, serviceId, quantity, basePrice, finalPrice, pricingFactors, specificData, rentalDates, callback) => {
    const sql = `
      INSERT INTO cart (
        user_id, service_type, service_id, quantity, base_price, final_price,
        rental_start_date, rental_end_date, pricing_factors, specific_data, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const values = [
      userId, serviceType, serviceId, quantity || 1, basePrice, finalPrice,
      rentalDates?.startDate, rentalDates?.endDate, 
      JSON.stringify(pricingFactors || {}), JSON.stringify(specificData || {})
    ];
    
    db.query(sql, values, callback);
  },

  updateCartItem: (cartItemId, userId, updates, callback) => {
    let sql = "UPDATE cart SET ";
    const values = [];
    const setClauses = [];

    if (updates.quantity !== undefined) {
      setClauses.push("quantity = ?");
      values.push(updates.quantity);
    }
    if (updates.final_price !== undefined) {
      setClauses.push("final_price = ?");
      values.push(updates.final_price);
    }
    if (updates.appointment_date !== undefined) {
      setClauses.push("appointment_date = ?");
      values.push(updates.appointment_date);
    }
    if (updates.rental_start_date !== undefined) {
      setClauses.push("rental_start_date = ?");
      values.push(updates.rental_start_date);
    }
    if (updates.rental_end_date !== undefined) {
      setClauses.push("rental_end_date = ?");
      values.push(updates.rental_end_date);
    }
    if (updates.pricing_factors !== undefined) {
      setClauses.push("pricing_factors = ?");
      values.push(JSON.stringify(updates.pricing_factors));
    }
    if (updates.specific_data !== undefined) {
      setClauses.push("specific_data = ?");
      values.push(JSON.stringify(updates.specific_data));
    }

    setClauses.push("updated_at = NOW()");
    sql += setClauses.join(", ") + " WHERE cart_id = ? AND user_id = ?";
    values.push(cartItemId, userId);

    db.query(sql, values, callback);
  },

  removeFromCart: (cartItemId, userId, callback) => {
    const sql = "DELETE FROM cart WHERE cart_id = ? AND user_id = ?";
    db.query(sql, [cartItemId, userId], callback);
  },

  clearCart: (userId, callback) => {
    const sql = "DELETE FROM cart WHERE user_id = ?";
    db.query(sql, [userId], callback);
  },

  getCartSummary: (userId, callback) => {
    const sql = `
      SELECT 
        COUNT(*) as item_count,
        SUM(CAST(final_price AS DECIMAL(10,2))) as total_amount
      FROM cart 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;
    db.query(sql, [userId], callback);
  },

  getCartItemById: (cartItemId, userId, callback) => {
    const sql = `
      SELECT * FROM cart 
      WHERE cart_id = ? AND user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;
    db.query(sql, [cartItemId, userId], callback);
  },

  getCartItemsForOrder: (userId, callback) => {
    const sql = `
      SELECT 
        cart_id,
        service_type,
        service_id,
        quantity,
        base_price,
        final_price,
        appointment_date,
        rental_start_date,
        rental_end_date,
        pricing_factors,
        specific_data
      FROM cart 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at ASC
    `;
    db.query(sql, [userId], callback);
  },

  markCartItemsAsProcessed: (userId, callback) => {
    const sql = `
      UPDATE cart 
      SET expires_at = NOW() 
      WHERE user_id = ? AND (expires_at IS NULL OR expires_at > NOW())
    `;
    db.query(sql, [userId], callback);
  },

  markSelectedCartItemsAsProcessed: (userId, cartIds, callback) => {
    if (!cartIds || cartIds.length === 0) {
      return callback(null, null);
    }
    const placeholders = cartIds.map(() => '?').join(',');
    const sql = `
      UPDATE cart 
      SET expires_at = NOW() 
      WHERE user_id = ? AND cart_id IN (${placeholders}) AND (expires_at IS NULL OR expires_at > NOW())
    `;
    db.query(sql, [userId, ...cartIds], callback);
  }
};

module.exports = Cart;
