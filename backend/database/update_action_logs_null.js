const db = require('../config/db');

function updateActionLogsTable() {
  return new Promise((resolve, reject) => {
    console.log('Updating action_logs table to allow NULL order_item_id...');

    const sql = `
      ALTER TABLE action_logs 
      MODIFY COLUMN order_item_id INT NULL COMMENT 'NULL for non-order actions like measurements'
    `;

    db.query(sql, (err, result) => {
      if (err) {
        
        if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('already')) {
          console.log('✓ order_item_id column is already nullable');
          resolve();
        } else {
          console.error('Error updating action_logs table:', err);
          return reject(err);
        }
      } else {
        console.log('✓ action_logs table updated successfully');
        resolve();
      }
    });
  });
}

updateActionLogsTable()
  .then(() => {
    console.log('\n✅ Update completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Update failed:', err);
    process.exit(1);
  });

