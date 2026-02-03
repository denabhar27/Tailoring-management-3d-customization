-- Add walk_in_customer_id support to customer_measurements table
-- This allows storing measurements for walk-in customers

-- Add walk_in_customer_id column if it doesn't exist
SET @walk_in_customer_id_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'customer_measurements' 
  AND COLUMN_NAME = 'walk_in_customer_id');

SET @sql_walk_in_customer_id = IF(@walk_in_customer_id_exists = 0,
  'ALTER TABLE customer_measurements ADD COLUMN walk_in_customer_id INT NULL AFTER user_id, ADD INDEX idx_walk_in_customer_id (walk_in_customer_id), ADD FOREIGN KEY (walk_in_customer_id) REFERENCES walk_in_customers(id) ON DELETE CASCADE',
  'SELECT "Column walk_in_customer_id already exists" AS message');
PREPARE stmt_walk_in_customer_id FROM @sql_walk_in_customer_id;
EXECUTE stmt_walk_in_customer_id;
DEALLOCATE PREPARE stmt_walk_in_customer_id;

-- Make user_id nullable (since walk-in customers don't have user_id)
SET @user_id_nullable = (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'customer_measurements' 
  AND COLUMN_NAME = 'user_id');

SET @sql_user_id_nullable = IF(@user_id_nullable = 'NO',
  'ALTER TABLE customer_measurements MODIFY COLUMN user_id INT NULL',
  'SELECT "Column user_id already allows NULL" AS message');
PREPARE stmt_user_id_nullable FROM @sql_user_id_nullable;
EXECUTE stmt_user_id_nullable;
DEALLOCATE PREPARE stmt_user_id_nullable;

SELECT 'Migration completed: customer_measurements now supports walk-in customers' AS result;

