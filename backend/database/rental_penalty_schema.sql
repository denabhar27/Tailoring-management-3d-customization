-- ================================================================
-- RENTAL PENALTY TRACKING SCHEMA UPDATE
-- Adds tables and columns for tracking rental penalties and email notifications
-- ================================================================

-- Add penalty tracking columns to order_items if not exists
-- These columns help track penalty-related information

-- Create rental_email_logs table to track sent emails
CREATE TABLE IF NOT EXISTS rental_email_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  user_id INT NOT NULL,
  email_type ENUM('reminder', 'overdue', 'penalty_applied', 'status_update') NOT NULL,
  email_status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  sent_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_item_id) REFERENCES order_items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  INDEX idx_order_item_id (order_item_id),
  INDEX idx_user_id (user_id),
  INDEX idx_email_type (email_type),
  INDEX idx_sent_at (sent_at),
  INDEX idx_email_status (email_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rental_penalty_tracking table to track penalty calculations over time
CREATE TABLE IF NOT EXISTS rental_penalty_tracking (
  tracking_id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  user_id INT NOT NULL,
  rental_end_date DATE NOT NULL,
  check_date DATE NOT NULL,
  days_overdue INT DEFAULT 0,
  penalty_amount DECIMAL(10,2) DEFAULT 0.00,
  penalty_rate DECIMAL(10,2) DEFAULT 100.00,
  is_notified TINYINT(1) DEFAULT 0,
  notification_sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_item_id) REFERENCES order_items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  INDEX idx_order_item_id (order_item_id),
  INDEX idx_check_date (check_date),
  INDEX idx_is_notified (is_notified),
  UNIQUE KEY unique_daily_check (order_item_id, check_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rental_reminders_sent table to prevent duplicate reminders
CREATE TABLE IF NOT EXISTS rental_reminders_sent (
  reminder_id INT AUTO_INCREMENT PRIMARY KEY,
  order_item_id INT NOT NULL,
  user_id INT NOT NULL,
  reminder_type ENUM('1_day', '2_day', '3_day', 'same_day', 'overdue_1', 'overdue_3', 'overdue_7', 'daily_overdue') NOT NULL,
  reminder_date DATE NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_item_id) REFERENCES order_items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  INDEX idx_order_item_id (order_item_id),
  INDEX idx_reminder_date (reminder_date),
  INDEX idx_reminder_type (reminder_type),
  UNIQUE KEY unique_reminder (order_item_id, reminder_type, reminder_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- View to get active rentals with their current penalty status
CREATE OR REPLACE VIEW v_active_rentals_with_penalty AS
SELECT 
  oi.item_id,
  oi.order_id,
  oi.service_type,
  oi.rental_start_date,
  oi.rental_end_date,
  oi.final_price,
  oi.pricing_factors,
  oi.approval_status,
  oi.payment_status,
  o.user_id,
  u.email,
  u.first_name,
  u.last_name,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  CASE 
    WHEN oi.rental_end_date IS NULL THEN 0
    WHEN CURDATE() > oi.rental_end_date THEN DATEDIFF(CURDATE(), oi.rental_end_date)
    ELSE 0
  END as days_overdue,
  CASE 
    WHEN oi.rental_end_date IS NULL THEN 0
    WHEN CURDATE() > oi.rental_end_date THEN DATEDIFF(CURDATE(), oi.rental_end_date) * 100
    ELSE 0
  END as calculated_penalty,
  CASE 
    WHEN oi.rental_end_date IS NULL THEN 'no_end_date'
    WHEN CURDATE() > oi.rental_end_date THEN 'overdue'
    WHEN CURDATE() = oi.rental_end_date THEN 'due_today'
    WHEN DATEDIFF(oi.rental_end_date, CURDATE()) <= 3 THEN 'due_soon'
    ELSE 'active'
  END as rental_status,
  JSON_EXTRACT(oi.specific_data, '$.item_name') as item_name
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN user u ON o.user_id = u.user_id
WHERE oi.service_type = 'rental'
  AND oi.approval_status IN ('rented', 'picked_up', 'accepted', 'ready_to_pickup');

-- View to get rentals needing reminders (ending in 1-3 days)
CREATE OR REPLACE VIEW v_rentals_needing_reminders AS
SELECT 
  oi.item_id,
  oi.order_id,
  oi.rental_end_date,
  oi.approval_status,
  o.user_id,
  u.email,
  u.first_name,
  u.last_name,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  DATEDIFF(oi.rental_end_date, CURDATE()) as days_remaining,
  JSON_UNQUOTE(JSON_EXTRACT(oi.specific_data, '$.item_name')) as item_name
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN user u ON o.user_id = u.user_id
WHERE oi.service_type = 'rental'
  AND oi.approval_status IN ('rented', 'picked_up')
  AND oi.rental_end_date IS NOT NULL
  AND DATEDIFF(oi.rental_end_date, CURDATE()) BETWEEN 0 AND 3;

-- View to get overdue rentals
CREATE OR REPLACE VIEW v_overdue_rentals AS
SELECT 
  oi.item_id,
  oi.order_id,
  oi.rental_end_date,
  oi.final_price,
  oi.pricing_factors,
  oi.approval_status,
  o.user_id,
  u.email,
  u.first_name,
  u.last_name,
  CONCAT(u.first_name, ' ', u.last_name) as full_name,
  DATEDIFF(CURDATE(), oi.rental_end_date) as days_overdue,
  DATEDIFF(CURDATE(), oi.rental_end_date) * 100 as current_penalty,
  JSON_UNQUOTE(JSON_EXTRACT(oi.specific_data, '$.item_name')) as item_name
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN user u ON o.user_id = u.user_id
WHERE oi.service_type = 'rental'
  AND oi.approval_status IN ('rented', 'picked_up')
  AND oi.rental_end_date IS NOT NULL
  AND CURDATE() > oi.rental_end_date;
