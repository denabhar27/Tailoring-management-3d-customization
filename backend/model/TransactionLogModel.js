const db = require('../config/db');

const TransactionLog = {
  
  create: (logData, callback) => {
    const sql = `
      INSERT INTO transaction_logs 
      (order_item_id, user_id, transaction_type, amount, previous_payment_status, new_payment_status, payment_method, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      logData.order_item_id,
      logData.user_id,
      logData.transaction_type || 'payment',
      logData.amount || 0,
      logData.previous_payment_status || null,
      logData.new_payment_status,
      logData.payment_method || null,
      logData.notes || null,
      logData.created_by || 'admin'
    ];
    
    db.query(sql, values, callback);
  },

  getByOrderItemId: (orderItemId, callback) => {
    const sql = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.email,
        oi.service_type,
        oi.final_price
      FROM transaction_logs tl
      JOIN user u ON tl.user_id = u.user_id
      JOIN order_items oi ON tl.order_item_id = oi.item_id
      WHERE tl.order_item_id = ?
      ORDER BY tl.created_at DESC
    `;
    
    db.query(sql, [orderItemId], callback);
  },

  getByUserId: (userId, callback) => {
    const sql = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.email,
        oi.service_type,
        oi.final_price,
        o.order_id
      FROM transaction_logs tl
      JOIN user u ON tl.user_id = u.user_id
      JOIN order_items oi ON tl.order_item_id = oi.item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE tl.user_id = ?
      ORDER BY tl.created_at DESC
    `;
    
    db.query(sql, [userId], callback);
  },

  getAll: (callback) => {
    const sql = `
      SELECT 
        tl.*,
        u.first_name,
        u.last_name,
        u.email,
        oi.service_type,
        oi.final_price,
        o.order_id
      FROM transaction_logs tl
      JOIN user u ON tl.user_id = u.user_id
      JOIN order_items oi ON tl.order_item_id = oi.item_id
      JOIN orders o ON oi.order_id = o.order_id
      ORDER BY tl.created_at DESC
      LIMIT 1000
    `;
    
    db.query(sql, callback);
  },

  getSummaryByOrderItemId: (orderItemId, callback) => {
    const sql = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        MAX(created_at) as last_transaction_date
      FROM transaction_logs
      WHERE order_item_id = ?
    `;
    
    db.query(sql, [orderItemId], callback);
  }
};

module.exports = TransactionLog;

