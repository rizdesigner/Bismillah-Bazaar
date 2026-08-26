-- Convert inventory.category from enum to TEXT so we can use proper categories
ALTER TABLE inventory ALTER COLUMN category TYPE TEXT;

-- Update existing categories to proper names
UPDATE inventory SET category = 'Chicken' WHERE category = 'Poultry';
UPDATE inventory SET category = 'Beef' WHERE item_name LIKE 'Beef%';
UPDATE inventory SET category = 'Goat' WHERE item_name = 'Goat';
UPDATE inventory SET category = 'Lamb' WHERE item_name LIKE 'Lamb%';
UPDATE inventory SET category = 'Beef' WHERE item_name LIKE 'Paya%';
UPDATE inventory SET category = 'Fish' WHERE category = 'Dried';

-- Drop the old enum type (no longer needed)
DROP TYPE IF EXISTS "InventoryCategory";
