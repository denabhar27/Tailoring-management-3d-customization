-- Create custom_3d_models table for storing admin-uploaded GLB files
CREATE TABLE IF NOT EXISTS custom_3d_models (
  model_id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  model_type ENUM('garment', 'button', 'accessory') DEFAULT 'garment',
  file_path VARCHAR(500) NOT NULL COMMENT 'Path to GLB file in uploads directory',
  file_url VARCHAR(500) NOT NULL COMMENT 'URL to access the GLB file',
  garment_category VARCHAR(100) COMMENT 'Category like coat-men, barong, suit, pants, etc.',
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_by INT COMMENT 'Admin user_id who uploaded the model',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_model_type (model_type),
  INDEX idx_garment_category (garment_category),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

