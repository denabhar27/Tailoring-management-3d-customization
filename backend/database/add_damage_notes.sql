-- Add damage_notes column to rental_inventory table
-- This column stores notes about damage when an item is under maintenance

ALTER TABLE rental_inventory
ADD COLUMN damage_notes TEXT DEFAULT NULL AFTER care_instructions;

-- Verify the change
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'rental_inventory' AND COLUMN_NAME = 'damage_notes';
