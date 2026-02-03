const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'pet_management',
  multipleStatements: true
};

console.log('Connecting to database:', config.database);
const connection = mysql.createConnection(config);

const sqlFilePath = path.join(__dirname, 'database', 'add_walk_in_measurements.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

console.log('\n========================================');
console.log('Adding Walk-In Customer Support to Measurements');
console.log('========================================\n');

connection.query(sql, (err, results) => {
  if (err) {
    console.error('❌ Migration failed!');
    console.error('Error:', err.message);
    console.error('\nFull error:', err);
    connection.end();
    process.exit(1);
  } else {
    console.log('✅ Migration completed successfully!');
    console.log('\nMigration results:');
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (result.affectedRows !== undefined) {
          console.log(`  Step ${index + 1}: ${result.affectedRows} rows affected`);
        } else if (result.message) {
          console.log(`  Step ${index + 1}: ${result.message}`);
        } else if (Array.isArray(result) && result.length > 0 && result[0].result) {
          console.log(`  Step ${index + 1}: ${result[0].result}`);
        }
      });
    }
    console.log('\n========================================');
    console.log('✅ Measurements table now supports walk-in customers!');
    console.log('========================================\n');
    connection.end();
    process.exit(0);
  }
});

