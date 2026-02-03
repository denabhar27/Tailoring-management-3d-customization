-- Create transaction_logs table
CREATE TABLE IF NOT EXISTS transaction_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  user_id INT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL COMMENT 'payment, refund, adjustment, etc.',
  amount DECIMAL(10, 2) NOT NULL,
  previous_payment_status VARCHAR(50) NULL,
  new_payment_status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50) NULL COMMENT 'cash, card, online, etc.',
  notes TEXT NULL,
  created_by VARCHAR(50) NOT NULL DEFAULT 'admin' COMMENT 'admin, system, user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_item_id) REFERENCES order_items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  INDEX idx_order_item (order_item_id),
  INDEX idx_user (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

