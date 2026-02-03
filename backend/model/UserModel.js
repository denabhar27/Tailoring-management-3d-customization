const db = require('../config/db');

const User = {
  create: (first_name, last_name, username, email, password, phone_number, callback) => {
    const sql = "INSERT INTO user (first_name, last_name, username, email, password, phone_number) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [first_name, last_name, username, email, password, phone_number], callback);
  },
  
  findByUsername: (username, callback) =>{
  const sql = "SELECT * FROM user WHERE username = ?";
  db.query(sql, [username], callback);
},
  
  findByEmail: (email, callback) => {
    const sql = "SELECT * FROM user WHERE email = ?";
    db.query(sql, [email], callback);
  },

  findById: (user_id, callback) => {
    const sql = "SELECT user_id, first_name, last_name, username, email, phone_number, profile_picture FROM user WHERE user_id = ?";
    db.query(sql, [user_id], callback);
  },
  
  createGoogleUser: (first_name, last_name, email, google_id, callback) => {
    
    const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);
   
    const sql = "INSERT INTO user (first_name, last_name, username, email, password, phone_number, google_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [first_name, last_name, username, email, null, null, google_id], callback);
  },

  updateProfilePicture: (user_id, profile_picture_path, callback) => {
    const sql = "UPDATE user SET profile_picture = ? WHERE user_id = ?";
    db.query(sql, [profile_picture_path, user_id], callback);
  },

  update: (user_id, first_name, last_name, email, phone_number, profile_picture, callback) => {
    if (profile_picture) {
      const sql = "UPDATE user SET first_name = ?, last_name = ?, email = ?, phone_number = ?, profile_picture = ? WHERE user_id = ?";
      db.query(sql, [first_name, last_name, email, phone_number, profile_picture, user_id], callback);
    } else {
      const sql = "UPDATE user SET first_name = ?, last_name = ?, email = ?, phone_number = ? WHERE user_id = ?";
      db.query(sql, [first_name, last_name, email, phone_number, user_id], callback);
    }
  },

  getAllCustomers: (callback) => {
    const sql = `
      SELECT 
        u.user_id as customer_id,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) as full_name,
        u.email,
        u.phone_number,
        COALESCE(u.status, 'active') as status,
        COALESCE(u.created_at, NOW()) as created_at,
        COUNT(DISTINCT o.order_id) as total_orders,
        'online' as customer_type
      FROM user u
      LEFT JOIN orders o ON u.user_id = o.user_id
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.phone_number, u.status, u.created_at
      
      UNION ALL
      
      SELECT 
        wc.id as customer_id,
        wc.name as first_name,
        '' as last_name,
        wc.name as full_name,
        wc.email,
        wc.phone as phone_number,
        'active' as status,
        COALESCE(wc.created_at, NOW()) as created_at,
        COUNT(DISTINCT o.order_id) as total_orders,
        'walk_in' as customer_type
      FROM walk_in_customers wc
      LEFT JOIN orders o ON wc.id = o.walk_in_customer_id
      GROUP BY wc.id, wc.name, wc.email, wc.phone, wc.created_at
      
      ORDER BY created_at DESC
    `;
    db.query(sql, callback);
  },

  getCustomerById: (userId, callback) => {
    const sql = `
      SELECT 
        u.*,
        COUNT(DISTINCT o.order_id) as total_orders
      FROM user u
      LEFT JOIN orders o ON u.user_id = o.user_id
      WHERE u.user_id = ?
      GROUP BY u.user_id
    `;
    db.query(sql, [userId], callback);
  },

  updateStatus: (userId, status, callback) => {
    const sql = "UPDATE user SET status = ? WHERE user_id = ?";
    db.query(sql, [status, userId], callback);
  },

  updateCustomer: (userId, first_name, last_name, email, phone_number, status, callback) => {
    const sql = `
      UPDATE user 
      SET first_name = ?, last_name = ?, email = ?, phone_number = ?, status = ?
      WHERE user_id = ?
    `;
    db.query(sql, [first_name, last_name, email, phone_number, status, userId], callback);
  }

};
module.exports = User;