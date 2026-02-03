-- Update rental_inventory table schema for new rental system
-- Remove daily_rate, rename base_rental_fee to price, rename deposit_amount to downpayment

-- Step 1: Rename base_rental_fee to price
ALTER TABLE rental_inventory 
CHANGE COLUMN base_rental_fee price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Step 2: Rename deposit_amount to downpayment  
ALTER TABLE rental_inventory 
CHANGE COLUMN deposit_amount downpayment DECIMAL(10,2) NULL DEFAULT 0;

-- Step 3: Drop daily_rate column
ALTER TABLE rental_inventory 
DROP COLUMN daily_rate;
