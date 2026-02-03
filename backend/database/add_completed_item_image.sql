-- Add completed_item_image column to order_items table
-- This column stores the image of the completed item after service is done

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS completed_item_image VARCHAR(500) NULL DEFAULT NULL 
AFTER specific_data;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_completed_item_image ON order_items(completed_item_image) 
WHERE completed_item_image IS NOT NULL;

