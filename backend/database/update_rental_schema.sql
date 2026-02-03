-- Update rental_inventory table schema for new rental system
-- Remove daily_rate, rename base_rental_fee to price, rename deposit_amount to downpayment

-- Step 1: Check and rename base_rental_fee to price (if exists)
-- If price column doesn't exist, rename base_rental_fee
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'rental_inventory' 
  AND COLUMN_NAME = 'price');

SET @base_fee_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'rental_inventory' 
  AND COLUMN_NAME = 'base_rental_fee');

-- Rename base_rental_fee to price if base_rental_fee exists and price doesn't
SET @sql1 = IF(@col_exists = 0 AND @base_fee_exists > 0,
  'ALTER TABLE rental_inventory CHANGE COLUMN base_rental_fee price DECIMAL(10,2) NOT NULL DEFAULT 0',
  'SELECT "Column already renamed or does not exist" AS message');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- Step 2: Rename deposit_amount to downpayment (if exists)
SET @deposit_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'rental_inventory' 
  AND COLUMN_NAME = 'deposit_amount');

SET @downpayment_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'rental_inventory' 
  AND COLUMN_NAME = 'downpayment');

SET @sql2 = IF(@downpayment_exists = 0 AND @deposit_exists > 0,
  'ALTER TABLE rental_inventory CHANGE COLUMN deposit_amount downpayment DECIMAL(10,2) NULL DEFAULT 0',
  'SELECT "Column already renamed or does not exist" AS message');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Step 3: Drop daily_rate column (if exists)
SET @daily_rate_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'rental_inventory' 
  AND COLUMN_NAME = 'daily_rate');

SET @sql3 = IF(@daily_rate_exists > 0,
  'ALTER TABLE rental_inventory DROP COLUMN daily_rate',
  'SELECT "Column does not exist" AS message');
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

