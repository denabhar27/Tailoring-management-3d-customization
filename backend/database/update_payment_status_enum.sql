-- Update payment_status enum to include down-payment and fully_paid
ALTER TABLE order_items 
MODIFY COLUMN payment_status ENUM('unpaid', 'paid', 'cancelled', 'down-payment', 'fully_paid') 
DEFAULT 'unpaid';

