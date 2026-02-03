-- Add columns for multiple images (front, back, side) in rental_inventory table
-- This allows admin to upload 3 pictures for each rental item

ALTER TABLE rental_inventory
ADD COLUMN front_image VARCHAR(500) DEFAULT NULL AFTER image_url,
ADD COLUMN back_image VARCHAR(500) DEFAULT NULL AFTER front_image,
ADD COLUMN side_image VARCHAR(500) DEFAULT NULL AFTER back_image;

-- Note: The existing image_url column will be kept for backward compatibility
-- and can be used as the main/primary image
