-- ============================================
-- Chunk Size Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add available_chunk_sizes to inventory (integer array)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS available_chunk_sizes INTEGER[];

-- 2. Add requested_chunk_size to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS requested_chunk_size INTEGER;
