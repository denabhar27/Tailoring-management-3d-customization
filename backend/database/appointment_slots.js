const db = require('../config/db');

function tableExists(tableName, callback) {
  db.getConnection((err, connection) => {
    if (err) return callback(err, null);
    
    connection.query('SELECT DATABASE() as db', (err, results) => {
      if (err) {
        connection.release();
        return callback(err, null);
      }
      
      const dbName = results[0].db;
      const sql = `
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = ?
      `;
      connection.query(sql, [dbName, tableName], (err, results) => {
        connection.release();
        if (err) return callback(err, null);
        callback(null, results[0].count > 0);
      });
    });
  });
}

async function runMigration() {
  return new Promise((resolve, reject) => {
    console.log('Starting appointment slots migration...');

    tableExists('appointment_slots', (err, exists) => {
      if (err) {
        console.error('Error checking appointment_slots table:', err);
        return reject(err);
      }

      if (!exists) {
        console.log('Creating appointment_slots table...');
        const sql = `
          CREATE TABLE appointment_slots (
            slot_id INT AUTO_INCREMENT PRIMARY KEY,
            service_type ENUM('dry_cleaning', 'repair', 'customization') NOT NULL,
            appointment_date DATE NOT NULL,
            appointment_time TIME NOT NULL,
            user_id INT NOT NULL,
            order_item_id INT NULL COMMENT 'Reference to the order item when order is created',
            cart_item_id INT NULL COMMENT 'Reference to cart item if still in cart',
            status ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            
            FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
            FOREIGN KEY (order_item_id) REFERENCES order_items(item_id) ON DELETE SET NULL,
            FOREIGN KEY (cart_item_id) REFERENCES cart(cart_id) ON DELETE SET NULL,
            
            UNIQUE KEY unique_slot (service_type, appointment_date, appointment_time),
            INDEX idx_service_date (service_type, appointment_date),
            INDEX idx_user_id (user_id),
            INDEX idx_status (status),
            INDEX idx_appointment_datetime (appointment_date, appointment_time)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        db.query(sql, (err, result) => {
          if (err) {
            console.error('Error creating appointment_slots table:', err);
            return reject(err);
          }
          console.log('✓ Appointment_slots table created successfully');
          console.log('\n✅ Migration completed successfully!');
          resolve();
        });
      } else {
        console.log('✓ Appointment_slots table already exists');
        console.log('\n✅ Migration completed successfully!');
        resolve();
      }
    });
  });
}

runMigration()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nMigration failed:', err);
    process.exit(1);
  });

