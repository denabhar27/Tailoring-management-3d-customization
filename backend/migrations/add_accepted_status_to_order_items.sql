-- Add 'accepted' status to order_items approval_status ENUM
ALTER TABLE order_items MODIFY COLUMN approval_status ENUM(
    'auto_confirmed',
    'pending_review', 
    'pending',
    'accepted',
    'price_confirmation', 
    'confirmed', 
    'cancelled', 
    'ready_for_pickup', 
    'completed', 
    'price_declined',
    'rented',
    'picked_up',
    'returned'
) DEFAULT 'pending_review';