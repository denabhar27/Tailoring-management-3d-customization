-- Order Tracking Table
-- This table tracks the status progression of each order item

CREATE TABLE IF NOT EXISTS order_tracking (
  tracking_id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  updated_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_order_item_id (order_item_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Insert initial tracking for existing order items (if any)
INSERT INTO order_tracking (order_item_id, status, notes)
SELECT 
  oi.order_item_id, 
  'pending' as status,
  'Initial status' as notes
FROM order_items oi
WHERE NOT EXISTS (
  SELECT 1 FROM order_tracking ot WHERE ot.order_item_id = oi.order_item_id
);
