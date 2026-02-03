-- Shop Schedule Table
-- This table stores which days of the week the shop is open
-- Admin can configure which days are open/closed

CREATE TABLE IF NOT EXISTS shop_schedule (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  day_of_week TINYINT NOT NULL UNIQUE COMMENT '0 = Sunday, 1 = Monday, ..., 6 = Saturday',
  is_open TINYINT(1) DEFAULT 1 COMMENT '1 = Open, 0 = Closed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_day_of_week (day_of_week),
  INDEX idx_is_open (is_open)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default schedule (Monday to Saturday open, Sunday closed)
INSERT INTO shop_schedule (day_of_week, is_open) VALUES
(0, 0), -- Sunday - Closed
(1, 1), -- Monday - Open
(2, 1), -- Tuesday - Open
(3, 1), -- Wednesday - Open
(4, 1), -- Thursday - Open
(5, 1), -- Friday - Open
(6, 1)  -- Saturday - Open
ON DUPLICATE KEY UPDATE is_open = is_open;

