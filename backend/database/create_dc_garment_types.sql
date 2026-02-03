-- Create dry_cleaning_garment_types table
-- This table stores garment types specific to dry cleaning with their prices
-- Separate from customization garment_types table

CREATE TABLE IF NOT EXISTS dry_cleaning_garment_types (
  dc_garment_id INT AUTO_INCREMENT PRIMARY KEY,
  garment_name VARCHAR(100) NOT NULL,
  garment_price DECIMAL(10,2) DEFAULT 0.00,
  description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_garment_name (garment_name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default dry cleaning garment types with prices
INSERT INTO dry_cleaning_garment_types (garment_name, garment_price, description, is_active) VALUES
('Shirt', 100.00, 'Regular shirt dry cleaning', 1),
('Pants', 120.00, 'Pants/trousers dry cleaning', 1),
('Dress', 180.00, 'Ladies dress dry cleaning', 1),
('Suit (2-piece)', 350.00, 'Complete 2-piece suit cleaning', 1),
('Suit (3-piece)', 450.00, 'Complete 3-piece suit cleaning', 1),
('Blazer/Jacket', 200.00, 'Blazer or jacket dry cleaning', 1),
('Coat', 250.00, 'Winter coat or overcoat cleaning', 1),
('Gown', 400.00, 'Formal gown/evening wear cleaning', 1),
('Wedding Dress', 800.00, 'Wedding dress specialized cleaning', 1),
('Barong Tagalog', 300.00, 'Traditional barong cleaning', 1),
('Skirt', 100.00, 'Ladies skirt dry cleaning', 1),
('Blouse', 90.00, 'Ladies blouse dry cleaning', 1),
('Sweater', 150.00, 'Sweater/cardigan cleaning', 1),
('Tie', 50.00, 'Necktie cleaning', 1),
('Scarf', 80.00, 'Scarf/shawl cleaning', 1);
