-- Add status and created_at fields to user table
-- This script adds the necessary fields for customer management
-- Note: Run this script manually. If columns already exist, you may need to modify the script.

-- Add status field (active/inactive)
-- If the column already exists, you can skip this or modify the script
ALTER TABLE user 
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active' AFTER phone_number;

-- Add created_at field
-- If the column already exists, you can skip this or modify the script
ALTER TABLE user 
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP AFTER status;

-- Create customer_measurements table
CREATE TABLE IF NOT EXISTS customer_measurements (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

