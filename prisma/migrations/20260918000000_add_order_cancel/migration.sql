-- Add 'cancelled' to the OrderStatus enum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'cancelled';