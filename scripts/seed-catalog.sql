ALTER TABLE inventory ADD COLUMN IF NOT EXISTS available_chunk_sizes TEXT[];
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS requested_chunk_size TEXT;

DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM inventory;

INSERT INTO inventory (id, item_name, category, base_price_kg, in_stock, image_url, available_chunk_sizes) VALUES
('a1000000-0000-0000-0000-000000000001', 'Chicken Leg Quarter', 'Poultry', 2.99, true, NULL, '{"2 pcs","3 pcs","4 pcs","South Indian cut","Tikka cut","Biryani cut","1x1 inch"}'),
('a1000000-0000-0000-0000-000000000002', 'Chicken Thai Boneless', 'Poultry', 5.49, true, NULL, '{"20g","25g","35g","45g","Business card size","1x1 inch"}'),
('a1000000-0000-0000-0000-000000000003', 'Chicken Thai Bone-in (Skin off)', 'Poultry', 5.49, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000004', 'Chicken Ground', 'Poultry', 5.49, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000005', 'Chicken Breast Boneless', 'Poultry', 6.49, true, NULL, '{"10g","20g","30g","35g","40g","1x1 inch"}'),
('a1000000-0000-0000-0000-000000000006', 'Chicken Breast Bone-in', 'Poultry', 6.49, true, NULL, '{"15g","25g","40g","80g","100g"}'),
('a1000000-0000-0000-0000-000000000007', 'Whole Chicken', 'Poultry', 3.99, true, NULL, '{"Skin off","4 pcs","8 pcs","16 pcs","BD cut","South Indian cut","Biryani cut"}'),
('a1000000-0000-0000-0000-000000000008', 'Beef Ground', 'Meat', 6.99, true, NULL, '{"Thin","Thick","Twice"}'),
('a1000000-0000-0000-0000-000000000009', 'Beef Boneless', 'Meat', 7.99, true, NULL, '{"35g","40g","50g","60g","80g"}'),
('a1000000-0000-0000-0000-000000000010', 'Beef Bone-in', 'Meat', 7.49, true, NULL, '{"30g","40g","50g","60g","70g"}'),
('a1000000-0000-0000-0000-000000000011', 'Beef Bihari Kebab (6mm)', 'Meat', 9.49, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000012', 'Beef Bone', 'Meat', 3.49, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000013', 'Goat', 'Meat', 7.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000014', 'Lamb Leg', 'Meat', 7.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000015', 'Paya (Cow / Goat / Lamb)', 'Meat', 3.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000016', 'Basa Fillet', 'Dried', 3.49, true, NULL, NULL);
