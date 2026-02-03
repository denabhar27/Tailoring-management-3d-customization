const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'update_rental_schema.sql');
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
        
        if (err.code === 'ER_BAD_FIELD_ERROR' || err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
          console.log(`Statement ${index + 1} skipped (column may not exist or already changed):`, err.sqlMessage);
        } else {
          console.error(`Error executing statement ${index + 1}:`, err);
          hasError = true;
        }
      } else {
        console.log(`Statement ${index + 1} executed successfully`);
      }

      completed++;
      if (completed === statements.length) {
        connection.release();
        if (hasError) {
          console.error('Migration completed with some errors');
          process.exit(1);
        } else {
          console.log('Migration completed successfully');
          process.exit(0);
        }
      }
    });
  });
});
