-- Add damaged_by column to rental_inventory table
-- This column stores the name of the client who damaged the item

ALTER TABLE rental_inventory
ADD COLUMN damaged_by VARCHAR(255) DEFAULT NULL AFTER damage_notes;

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'rental_inventory' AND COLUMN_NAME = 'damaged_by';
