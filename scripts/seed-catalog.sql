-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add order note column (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;

-- 2. Clear old data
DELETE FROM piece_sizes;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM inventory;

-- 3. Insert 14 products
INSERT INTO inventory (id, item_name, category, unit, base_price_kg, in_stock, image_url) VALUES

-- Chicken
('a1000000-0000-0000-0000-000000000001', 'Ch Leg Qtr Cut Biryani Pcs', 'Chicken', 'lb', 2.99, true, NULL),
('a1000000-0000-0000-0000-000000000002', 'Ch Leg Qtr Cut in to 1" X 1"', 'Chicken', 'lb', 2.99, true, NULL),
('a1000000-0000-0000-0000-000000000003', 'Chicken Thai Business Card Size', 'Chicken', 'lb', 5.49, true, NULL),
('a1000000-0000-0000-0000-000000000004', 'Ch Thai Cut In to 1" X 1"', 'Chicken', 'lb', 5.49, true, NULL),
('a1000000-0000-0000-0000-000000000005', 'Ch Ground (From Thai Meat)', 'Chicken', 'lb', 5.49, true, NULL),
('a1000000-0000-0000-0000-000000000006', 'Ch Boneless Breast 1" X 1"', 'Chicken', 'lb', 6.49, true, NULL),
('a1000000-0000-0000-0000-000000000007', 'Chicken Breast As Is', 'Chicken', 'lb', 6.49, true, NULL),
('a1000000-0000-0000-0000-000000000008', 'Whole Chicken Skin Off', 'Chicken', 'lb', 3.99, true, NULL),

-- Beef
('a1000000-0000-0000-0000-000000000009', 'Beef Ground (25% Fat) Thin/Thick', 'Beef', 'lb', 6.99, true, NULL),
('a1000000-0000-0000-0000-000000000010', 'Beef Shank Boneless', 'Beef', 'lb', 7.49, true, NULL),
('a1000000-0000-0000-0000-000000000011', 'Beef Bone', 'Beef', 'lb', 3.49, true, NULL),

-- Goat & Lamb
('a1000000-0000-0000-0000-000000000012', 'Goat', 'Goat', 'lb', 7.99, true, NULL),
('a1000000-0000-0000-0000-000000000013', 'Lamb', 'Lamb', 'lb', 7.99, true, NULL),
('a1000000-0000-0000-0000-000000000014', 'Paya (Cow/Goat/Lamb)', 'Mixed', 'lb', 3.99, true, NULL);

-- 4. Insert Piece Sizes

-- Ch Breast Boneless → "Ch Boneless Breast 1 X 1"
-- Piece sizes in grams: customer selects e.g. 20 grm, orders qty of pieces
INSERT INTO piece_sizes (item_id, size_label, size_value, size_unit) VALUES
('a1000000-0000-0000-0000-000000000006', '10 grm', 10, 'grm'),
('a1000000-0000-0000-0000-000000000006', '20 grm', 20, 'grm'),
('a1000000-0000-0000-0000-000000000006', '30 grm', 30, 'grm'),
('a1000000-0000-0000-0000-000000000006', '35 grm', 35, 'grm'),
('a1000000-0000-0000-0000-000000000006', '40 grm', 40, 'grm');

-- Ch Breast Bone In → "Chicken Breast As Is"
INSERT INTO piece_sizes (item_id, size_label, size_value, size_unit) VALUES
('a1000000-0000-0000-0000-000000000007', '15 grm', 15, 'grm'),
('a1000000-0000-0000-0000-000000000007', '25 grm', 25, 'grm'),
('a1000000-0000-0000-0000-000000000007', '40 grm', 40, 'grm'),
('a1000000-0000-0000-0000-000000000007', '80 grm', 80, 'grm'),
('a1000000-0000-0000-0000-000000000007', '100 grm', 100, 'grm');

-- Ch Thai Boneless → "Chicken Thai Business Card Size"
INSERT INTO piece_sizes (item_id, size_label, size_value, size_unit) VALUES
('a1000000-0000-0000-0000-000000000003', '20 grm', 20, 'grm'),
('a1000000-0000-0000-0000-000000000003', '25 grm', 25, 'grm'),
('a1000000-0000-0000-0000-000000000003', '35 grm', 35, 'grm'),
('a1000000-0000-0000-0000-000000000003', '45 grm', 45, 'grm');

-- Beef Boneless → "Beef Shank Boneless"
INSERT INTO piece_sizes (item_id, size_label, size_value, size_unit) VALUES
('a1000000-0000-0000-0000-000000000010', '35 grm', 35, 'grm'),
('a1000000-0000-0000-0000-000000000010', '40 grm', 40, 'grm'),
('a1000000-0000-0000-0000-000000000010', '50 grm', 50, 'grm'),
('a1000000-0000-0000-0000-000000000010', '60 grm', 60, 'grm'),
('a1000000-0000-0000-0000-000000000010', '80 grm', 80, 'grm');

-- Beef Bone In → "Beef Bone"
INSERT INTO piece_sizes (item_id, size_label, size_value, size_unit) VALUES
('a1000000-0000-0000-0000-000000000011', '30 grm', 30, 'grm'),
('a1000000-0000-0000-0000-000000000011', '40 grm', 40, 'grm'),
('a1000000-0000-0000-0000-000000000011', '50 grm', 50, 'grm'),
('a1000000-0000-0000-0000-000000000011', '60 grm', 60, 'grm'),
('a1000000-0000-0000-0000-000000000011', '70 grm', 70, 'grm');

-- Ch Leg Qtr → "Ch Leg Qtr Cut Biryani Pcs"
-- "pcs" = cut style (pieces per quarter). size_value=454 (≈1lb in grams) so qty in lbs prices correctly.
INSERT INTO piece_sizes (item_id, size_label, size_value, size_unit) VALUES
('a1000000-0000-0000-0000-000000000001', '2 Pcs', 454, 'cut'),
('a1000000-0000-0000-0000-000000000001', '3 Pcs', 454, 'cut'),
('a1000000-0000-0000-0000-000000000001', '4 Pcs', 454, 'cut'),
('a1000000-0000-0000-0000-000000000001', 'South Indian Cut', 454, 'cut');

-- Whole Chicken → "Whole Chicken Skin Off"
-- Same logic: "pcs" = cut pieces per bird. size_value=454 so qty=lb works.
INSERT INTO piece_sizes (item_id, size_label, size_value, size_unit) VALUES
('a1000000-0000-0000-0000-000000000008', '4 Pcs', 454, 'cut'),
('a1000000-0000-0000-0000-000000000008', '8 Pcs', 454, 'cut'),
('a1000000-0000-0000-0000-000000000008', '16 Pcs', 454, 'cut'),
('a1000000-0000-0000-0000-000000000008', 'BD Cut', 454, 'cut'),
('a1000000-0000-0000-0000-000000000008', 'South Indian Cut', 454, 'cut');
