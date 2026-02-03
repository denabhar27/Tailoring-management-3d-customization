const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',  
  port: 3306,         
  user: 'root',    
  password: '',            
  database: 'pet_management', 

});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL (XAMPP)");
    connection.release();
  }
});

module.exports = pool;