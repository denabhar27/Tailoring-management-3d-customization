-- Alter rental_inventory table to change size column from VARCHAR(20) to TEXT
-- This allows storing JSON measurements data

ALTER TABLE rental_inventory 
MODIFY COLUMN size TEXT NULL;

