-- Time Slots Table
-- This table defines available time slots with their capacity
-- All services (dry_cleaning, repair, customization) share the same time slots

CREATE TABLE IF NOT EXISTS time_slots (
  slot_id INT AUTO_INCREMENT PRIMARY KEY,
  time_slot TIME NOT NULL UNIQUE COMMENT 'Time in HH:MM:SS format (e.g., 10:30:00)',
  capacity INT NOT NULL DEFAULT 5 COMMENT 'Maximum number of appointments allowed at this time',
  is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether this time slot is active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_time_slot (time_slot),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default time slots (8:00 AM to 5:00 PM, 30-minute intervals)
INSERT INTO time_slots (time_slot, capacity, is_active) VALUES
('08:00:00', 5, 1),
('08:30:00', 5, 1),
('09:00:00', 5, 1),
('09:30:00', 5, 1),
('10:00:00', 5, 1),
('10:30:00', 5, 1),
('11:00:00', 5, 1),
('11:30:00', 5, 1),
('12:00:00', 5, 1),
('12:30:00', 5, 1),
('13:00:00', 5, 1),
('13:30:00', 5, 1),
('14:00:00', 5, 1),
('14:30:00', 5, 1),
('15:00:00', 5, 1),
('15:30:00', 5, 1),
('16:00:00', 5, 1),
('16:30:00', 5, 1),
('17:00:00', 5, 1)
ON DUPLICATE KEY UPDATE capacity = capacity;

-- Update appointment_slots table to remove unique constraint
-- This allows multiple appointments per time slot
-- Note: If the unique_slot index doesn't exist, this will generate a warning which can be ignored

-- Add index for better query performance (if it doesn't already exist)
-- Note: If index already exists, this will generate a warning which can be ignored

