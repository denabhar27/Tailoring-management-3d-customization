const db = require('../config/db');

function columnExists(tableName, columnName, callback) {
  const sql = `
    SELECT COUNT(*) as count 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = ? 
    AND COLUMN_NAME = ?
  `;
  db.query(sql, [tableName, columnName], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0].count > 0);
  });
}

function tableExists(tableName, callback) {
  const sql = `
    SELECT COUNT(*) as count 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = ?
  `;
  db.query(sql, [tableName], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0].count > 0);
  });
}

async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('Starting database migrations...');

    columnExists('user', 'status', (err, exists) => {
      if (err) {
        console.error('Error checking status column:', err);
        return reject(err);
      }

      if (!exists) {
        console.log('Adding status column to user table...');
        const sql = `ALTER TABLE user ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER phone_number`;
        db.query(sql, (err, result) => {
          if (err) {
            console.error('Error adding status column:', err);
            return reject(err);
          }
          console.log('✓ Status column added successfully');
          proceedToCreatedAt();
        });
      } else {
        console.log('✓ Status column already exists');
        proceedToCreatedAt();
      }
    });

    function proceedToCreatedAt() {
      
      columnExists('user', 'created_at', (err, exists) => {
        if (err) {
          console.error('Error checking created_at column:', err);
          return reject(err);
        }

        if (!exists) {
          console.log('Adding created_at column to user table...');
          const sql = `ALTER TABLE user ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER status`;
          db.query(sql, (err, result) => {
            if (err) {
              console.error('Error adding created_at column:', err);
              return reject(err);
            }
            console.log('✓ Created_at column added successfully');
            proceedToMeasurementsTable();
          });
        } else {
          console.log('✓ Created_at column already exists');
          proceedToMeasurementsTable();
        }
      });
    }

    function proceedToMeasurementsTable() {
      
      tableExists('customer_measurements', (err, exists) => {
        if (err) {
          console.error('Error checking customer_measurements table:', err);
          return reject(err);
        }

        if (!exists) {
          console.log('Creating customer_measurements table...');
          const sql = `
            CREATE TABLE customer_measurements (
              measurement_id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              top_measurements JSON COMMENT 'Top measurements: chest, shoulders, sleeve_length, neck, etc.',
              bottom_measurements JSON COMMENT 'Bottom measurements: waist, hips, inseam, length, etc.',
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              
              FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
              INDEX idx_user_id (user_id),
              INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
          `;
          db.query(sql, (err, result) => {
            if (err) {
              console.error('Error creating customer_measurements table:', err);
              return reject(err);
            }
            console.log('✓ Customer_measurements table created successfully');
            console.log('\n✅ All migrations completed successfully!');
            resolve();
          });
        } else {
          console.log('✓ Customer_measurements table already exists');
          console.log('\n✅ All migrations completed successfully!');
          resolve();
        }
      });
    }
  });
}

runMigrations()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nMigration failed:', err);
    process.exit(1);
  });

