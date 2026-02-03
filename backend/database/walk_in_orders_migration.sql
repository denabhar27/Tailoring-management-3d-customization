-- Walk-In Orders System Migration
-- This migration adds support for walk-in customers and orders

-- ================================================================
-- 1. CREATE WALK_IN_CUSTOMERS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS walk_in_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_phone (phone),
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 2. UPDATE ORDERS TABLE
-- ================================================================
-- Add order_type column if it doesn't exist
SET @order_type_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'order_type');

SET @sql_order_type = IF(@order_type_exists = 0,
  'ALTER TABLE orders ADD COLUMN order_type ENUM(\'online\', \'walk_in\') DEFAULT \'online\' AFTER user_id',
  'SELECT "Column order_type already exists" AS message');
PREPARE stmt_order_type FROM @sql_order_type;
EXECUTE stmt_order_type;
DEALLOCATE PREPARE stmt_order_type;

-- Add walk_in_customer_id column if it doesn't exist
SET @walk_in_customer_id_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'orders' 
  AND COLUMN_NAME = 'walk_in_customer_id');

SET @sql_walk_in_customer_id = IF(@walk_in_customer_id_exists = 0,
  'ALTER TABLE orders ADD COLUMN walk_in_customer_id INT NULL AFTER order_type, ADD FOREIGN KEY (walk_in_customer_id) REFERENCES walk_in_customers(id) ON DELETE SET NULL, ADD INDEX idx_walk_in_customer_id (walk_in_customer_id)',
  'SELECT "Column walk_in_customer_id already exists" AS message');
PREPARE stmt_walk_in_customer_id FROM @sql_walk_in_customer_id;
EXECUTE stmt_walk_in_customer_id;
DEALLOCATE PREPARE stmt_walk_in_customer_id;

-- Migrate existing walk-in data (if any) to new structure
-- Update orders with is_walkin = 1 to have order_type = 'walk_in'
UPDATE orders 
SET order_type = 'walk_in' 
WHERE is_walkin = 1 AND order_type = 'online';

-- ================================================================
-- 3. UPDATE RENTAL_INVENTORY TABLE
-- ================================================================
-- Add rented_by_customer_id column if it doesn't exist
SET @rented_by_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'rental_inventory' 
  AND COLUMN_NAME = 'rented_by_customer_id');

SET @sql_rented_by = IF(@rented_by_exists = 0,
  'ALTER TABLE rental_inventory ADD COLUMN rented_by_customer_id INT NULL AFTER status, ADD INDEX idx_rented_by_customer_id (rented_by_customer_id)',
  'SELECT "Column rented_by_customer_id already exists" AS message');
PREPARE stmt_rented_by FROM @sql_rented_by;
EXECUTE stmt_rented_by;
DEALLOCATE PREPARE stmt_rented_by;

-- Add rented_date column if it doesn't exist
SET @rented_date_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'rental_inventory' 
  AND COLUMN_NAME = 'rented_date');

SET @sql_rented_date = IF(@rented_date_exists = 0,
  'ALTER TABLE rental_inventory ADD COLUMN rented_date TIMESTAMP NULL AFTER rented_by_customer_id',
  'SELECT "Column rented_date already exists" AS message');
PREPARE stmt_rented_date FROM @sql_rented_date;
EXECUTE stmt_rented_date;
DEALLOCATE PREPARE stmt_rented_date;

-- ================================================================
-- 4. CREATE DAMAGE_RECORDS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS damage_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inventory_item_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    walk_in_customer_id INT NULL,
    user_id INT NULL,
    damage_type VARCHAR(100) NOT NULL,
    damage_description TEXT,
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    repair_cost DECIMAL(10,2) DEFAULT 0.00,
    repair_status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inventory_item_id) REFERENCES rental_inventory(item_id) ON DELETE CASCADE,
    FOREIGN KEY (walk_in_customer_id) REFERENCES walk_in_customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE SET NULL,
    INDEX idx_inventory_item_id (inventory_item_id),
    INDEX idx_customer_name (customer_name),
    INDEX idx_reported_date (reported_date),
    INDEX idx_repair_status (repair_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

