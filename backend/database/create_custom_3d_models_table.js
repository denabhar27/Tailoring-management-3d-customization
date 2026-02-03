const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'custom_3d_models.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log('Creating custom_3d_models table...');

db.query(sql, (err, results) => {
  if (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.message.includes('already exists') || err.code === 'ER_DUP_TABLE') {
      console.log('✓ Table custom_3d_models already exists');
      process.exit(0);
    } else {
      console.error('Error creating table:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      process.exit(1);
    }
  } else {
    console.log('✓ Table custom_3d_models created successfully');
    process.exit(0);
  }
});

