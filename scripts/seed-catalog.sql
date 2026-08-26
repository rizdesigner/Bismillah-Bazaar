-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS available_chunk_sizes INTEGER[];
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS requested_chunk_size INTEGER;

-- 2. Clear old data
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM inventory;

-- 3. Insert 14 products with chunk sizes
INSERT INTO inventory (id, item_name, category, unit, base_price_kg, in_stock, image_url, available_chunk_sizes) VALUES

-- Chicken
('a1000000-0000-0000-0000-000000000001', 'Ch Leg Qtr Cut Biryani Pcs', 'Chicken', 'lb', 2.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000002', 'Ch Leg Qtr Cut in to 1" X 1"', 'Chicken', 'lb', 2.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000003', 'Chicken Thai Business Card Size', 'Chicken', 'lb', 5.49, true, NULL, '{20,25,35,45}'),
('a1000000-0000-0000-0000-000000000004', 'Ch Thai Cut In to 1" X 1"', 'Chicken', 'lb', 5.49, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000005', 'Ch Ground (From Thai Meat)', 'Chicken', 'lb', 5.49, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000006', 'Ch Boneless Breast 1" X 1"', 'Chicken', 'lb', 6.49, true, NULL, '{10,20,30,35,40}'),
('a1000000-0000-0000-0000-000000000007', 'Chicken Breast As Is', 'Chicken', 'lb', 6.49, true, NULL, '{15,25,40,80,100}'),
('a1000000-0000-0000-0000-000000000008', 'Whole Chicken Skin Off', 'Chicken', 'lb', 3.99, true, NULL, NULL),

-- Beef
('a1000000-0000-0000-0000-000000000009', 'Beef Ground (25% Fat) Thin/Thick', 'Beef', 'lb', 6.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000010', 'Beef Shank Boneless', 'Beef', 'lb', 7.49, true, NULL, '{35,40,50,60,80}'),
('a1000000-0000-0000-0000-000000000011', 'Beef Bone', 'Beef', 'lb', 3.49, true, NULL, '{30,40,50,60,70}'),

-- Goat & Lamb
('a1000000-0000-0000-0000-000000000012', 'Goat', 'Goat', 'lb', 7.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000013', 'Lamb', 'Lamb', 'lb', 7.99, true, NULL, NULL),
('a1000000-0000-0000-0000-000000000014', 'Paya (Cow/Goat/Lamb)', 'Mixed', 'lb', 3.99, true, NULL, NULL);
