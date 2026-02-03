-- Fabric Types Table
-- This table stores available fabric types with their prices and descriptions

CREATE TABLE IF NOT EXISTS fabric_types (
  fabric_id INT AUTO_INCREMENT PRIMARY KEY,
  fabric_name VARCHAR(100) NOT NULL UNIQUE,
  fabric_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_fabric_name (fabric_name),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default fabric types
INSERT INTO fabric_types (fabric_name, fabric_price, description, is_active) VALUES
('Silk', 500.00, 'Premium silk fabric - smooth and luxurious', 1),
('Linen', 350.00, 'Natural linen fabric - breathable and durable', 1),
('Cotton', 300.00, 'High-quality cotton fabric - comfortable and versatile', 1),
('Wool', 450.00, 'Premium wool fabric - warm and elegant', 1),
('Jusi', 400.00, 'Traditional jusi fabric - smooth and semi-transparent', 1),
('Piña', 600.00, 'Premium piña fabric - very smooth and elegant', 1)
ON DUPLICATE KEY UPDATE fabric_name = fabric_name;

