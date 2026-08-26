-- ============================================
-- Chunk Size Migration (String Types)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Alter available_chunk_sizes from INTEGER[] to TEXT[]
ALTER TABLE inventory ALTER COLUMN available_chunk_sizes TYPE TEXT[] USING available_chunk_sizes::text[];

-- 2. Alter requested_chunk_size from INTEGER to TEXT
ALTER TABLE order_items ALTER COLUMN requested_chunk_size TYPE TEXT USING requested_chunk_size::text;
