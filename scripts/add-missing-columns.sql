-- Add missing columns that the code expects but Prisma migrations never created
-- Run this in Supabase SQL Editor

-- 1. Add note column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS note TEXT;

-- 2. Add requested_chunk_size to order_items (TEXT type)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS requested_chunk_size TEXT;

-- 3. Add available_chunk_sizes to inventory (TEXT[] type)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS available_chunk_sizes TEXT[];
