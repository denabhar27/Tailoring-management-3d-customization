const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'alter_rental_inventory_size.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

db.getConnection((err, connection) => {
  if (err) {
    console.error('Error getting database connection:', err);
    process.exit(1);
  }

  const statements = sql.split(';').filter(s => s.trim().length > 0);

  let completed = 0;
  let hasError = false;

  statements.forEach((statement, index) => {
    connection.query(statement.trim(), (err, results) => {
      if (err) {
        console.error(`Error executing statement ${index + 1}:`, err);
        hasError = true;
      } else {
        console.log(`Statement ${index + 1} executed successfully`);
      }

      completed++;
      if (completed === statements.length) {
        connection.release();
        if (hasError) {
          console.error('Migration completed with errors');
          process.exit(1);
        } else {
          console.log('Migration completed successfully');
          process.exit(0);
        }
      }
    });
  });
});

