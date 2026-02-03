const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'time_slots.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log('Creating time_slots table and updating appointment_slots table...');

let completed = 0;
let errors = [];

statements.forEach((statement, index) => {
  db.query(statement, (err, results) => {
    if (err) {
      
      if (err.code !== 'ER_TABLE_EXISTS_ERROR' && 
          err.code !== 'ER_DUP_KEYNAME' &&
          !err.message.includes('Duplicate key name')) {
        console.error(`Error executing statement ${index + 1}:`, err.message);
        errors.push({ statement: index + 1, error: err.message });
      }
    }
    
    completed++;
    
    if (completed === statements.length) {
      if (errors.length === 0) {
        console.log('✅ Time slots table created/updated successfully!');
        console.log('✅ Appointment slots table updated successfully!');
        process.exit(0);
      } else {
        console.log('⚠️  Completed with some errors:');
        errors.forEach(e => console.log(`  Statement ${e.statement}: ${e.error}`));
        process.exit(1);
      }
    }
  });
});

