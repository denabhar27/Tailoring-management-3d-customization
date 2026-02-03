-- Create dry_cleaning_services table
CREATE TABLE IF NOT EXISTS dry_cleaning_services (
  service_id INT(11) NOT NULL AUTO_INCREMENT,
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  base_price VARCHAR(20) NOT NULL,
  price_per_item VARCHAR(20) NOT NULL,
  min_items INT(11) DEFAULT 1,
  max_items INT(11) DEFAULT 50,
  estimated_time VARCHAR(100),
  requires_image TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (service_id),
  INDEX idx_service_name (service_name),
  INDEX idx_price (price_per_item)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample dry cleaning services
INSERT INTO dry_cleaning_services (service_name, description, base_price, price_per_item, min_items, max_items, estimated_time, requires_image) VALUES
('Basic Dry Cleaning', 'Standard dry cleaning for everyday garments', '200', '150', 1, 50, '2-3 days', 0),
('Premium Dry Cleaning', 'High-quality dry cleaning for delicate fabrics', '350', '250', 1, 30, '3-4 days', 1),
('Delicate Items', 'Specialized care for silk, wool, and other delicate fabrics', '450', '350', 1, 20, '4-5 days', 1),
('Express Service', 'Same-day or next-day dry cleaning service', '500', '400', 1, 10, '1-2 days', 0),
('Wedding Dress Cleaning', 'Professional cleaning and preservation for wedding dresses', '800', '600', 1, 5, '1-2 weeks', 1),
('Suit Cleaning', 'Complete suit cleaning and pressing', '300', '200', 1, 20, '2-3 days', 0),
('Winter Coat Cleaning', 'Heavy coat and jacket cleaning service', '400', '300', 1, 15, '3-4 days', 0),
('Curtain Cleaning', 'Professional curtain and drapery cleaning', '250', '180', 1, 25, '3-5 days', 0);

-- Create uploads directory for dry cleaning images (this would be done manually)
-- mkdir -p uploads/drycleaning-images
