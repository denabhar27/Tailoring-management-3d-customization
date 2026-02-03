-- Appointment Slots Table
-- This table stores booked appointment slots for dry cleaning, repair, and customization services
-- Each service type has separate availability (they don't share slots)

CREATE TABLE IF NOT EXISTS appointment_slots (
  slot_id INT AUTO_INCREMENT PRIMARY KEY,
  service_type ENUM('dry_cleaning', 'repair', 'customization') NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  user_id INT NOT NULL,
  order_item_id INT NULL COMMENT 'Reference to the order item when order is created',
  cart_item_id INT NULL COMMENT 'Reference to cart item if still in cart',
  status ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
  FOREIGN KEY (order_item_id) REFERENCES order_items(item_id) ON DELETE SET NULL,
  FOREIGN KEY (cart_item_id) REFERENCES cart(cart_id) ON DELETE SET NULL,
  
  -- Ensure unique slots per service type (one booking per time slot per service)
  UNIQUE KEY unique_slot (service_type, appointment_date, appointment_time),
  INDEX idx_service_date (service_type, appointment_date),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_appointment_datetime (appointment_date, appointment_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

