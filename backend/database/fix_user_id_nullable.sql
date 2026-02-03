-- Fix user_id to allow NULL for walk-in orders
-- This allows walk-in orders to be created without a user_id

-- Check if user_id column allows NULL
SET @user_id_nullable = (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'user_id');

-- If user_id is NOT NULL, modify it to allow NULL
SET @sql_fix_user_id = IF(@user_id_nullable = 'NO',
  'ALTER TABLE orders MODIFY COLUMN user_id INT NULL',
  'SELECT "Column user_id already allows NULL" AS message');
PREPARE stmt_fix_user_id FROM @sql_fix_user_id;
EXECUTE stmt_fix_user_id;
DEALLOCATE PREPARE stmt_fix_user_id;

SELECT 'Migration completed: user_id column now allows NULL for walk-in orders' AS result;

