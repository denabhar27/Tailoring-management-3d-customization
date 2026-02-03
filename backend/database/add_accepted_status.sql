-- Add 'accepted' status to order_tracking table
ALTER TABLE order_tracking 
MODIFY COLUMN status ENUM('pending','accepted','price_confirmation','in_progress','ready_to_pickup','picked_up','rented','returned','completed','cancelled','price_declined') 
DEFAULT 'pending';