const db = require('../config/db');

const addMultipleImagesColumns = () => {
  
  const checkSql = `SHOW COLUMNS FROM rental_inventory LIKE 'front_image'`;
  
  db.query(checkSql, (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error checking columns:', checkErr);
      db.end();
      process.exit(1);
    }
    
    if (checkResult.length > 0) {
      console.log('Multiple image columns already exist in rental_inventory table');
      db.end();
      process.exit(0);
    }

    const sql = `
      ALTER TABLE rental_inventory
      ADD COLUMN front_image VARCHAR(500) DEFAULT NULL AFTER image_url,
      ADD COLUMN back_image VARCHAR(500) DEFAULT NULL AFTER front_image,
      ADD COLUMN side_image VARCHAR(500) DEFAULT NULL AFTER back_image
    `;
    
    db.query(sql, (err, result) => {
      if (err) {
        console.error('Error adding multiple image columns:', err);
        db.end();
        process.exit(1);
      }
      
      console.log('Successfully added front_image, back_image, and side_image columns to rental_inventory table');
      db.end((endErr) => {
        if (endErr) {
          console.error('Error closing database connection:', endErr);
        }
        process.exit(0);
      });
    });
  });
};

if (require.main === module) {
  addMultipleImagesColumns();
}

module.exports = addMultipleImagesColumns;
