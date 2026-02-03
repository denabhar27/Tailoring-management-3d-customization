-- Update action_logs table to allow NULL order_item_id for non-order actions
ALTER TABLE action_logs 
MODIFY COLUMN order_item_id INT NULL COMMENT 'NULL for non-order actions like measurements';

