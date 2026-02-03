-- Action Logs Table
-- Stores all actions made by users and admins
CREATE TABLE IF NOT EXISTS action_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NULL COMMENT 'NULL for non-order actions like measurements',
  user_id INT NOT NULL,
  action_type VARCHAR(50) NOT NULL COMMENT 'cancel, accept, decline, status_update, price_update, add_measurements, etc.',
  action_by ENUM('user', 'admin') NOT NULL,
  previous_status VARCHAR(50) NULL,
  new_status VARCHAR(50) NULL,
  reason TEXT NULL COMMENT 'Reason for cancellation or other actions',
  notes TEXT NULL COMMENT 'Additional notes or details',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_item_id) REFERENCES order_items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  
  INDEX idx_order_item_id (order_item_id),
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

