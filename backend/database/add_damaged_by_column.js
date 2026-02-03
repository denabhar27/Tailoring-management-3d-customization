

const db = require('../config/db');

const addDamagedByColumn = () => {
  
  const checkSql = `
    SELECT COUNT(*) as count 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'rental_inventory' 
    AND COLUMN_NAME = 'damaged_by'
  `;
  
  db.query(checkSql, (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error checking for damaged_by column:', checkErr);
      db.end();
      process.exit(1);
      return;
    }
    
    if (checkResult[0].count > 0) {
      console.log('Column damaged_by already exists in rental_inventory table');
      db.end();
      process.exit(0);
      return;
    }

    const sql = `
      ALTER TABLE rental_inventory
      ADD COLUMN damaged_by VARCHAR(255) DEFAULT NULL AFTER damage_notes
    `;
    
    db.query(sql, (err, result) => {
      if (err) {
        console.error('Error adding damaged_by column:', err);
        db.end();
        process.exit(1);
      } else {
        console.log('Successfully added damaged_by column to rental_inventory table');
        db.end();
        process.exit(0);
      }
    });
  });
};

if (require.main === module) {
  addDamagedByColumn();
}
