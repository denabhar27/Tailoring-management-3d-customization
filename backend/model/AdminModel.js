const db = require('../config/db');

const Admin = {
  findByUsername: (username, callback) =>{
  const sql = "SELECT * FROM admin WHERE username = ?";
  db.query(sql, [username], callback);
}
};
module.exports = Admin;