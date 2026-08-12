-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('unpaid', 'partially_paid', 'paid', 'overdue');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('etransfer', 'cash', 'check', 'credit_card');

-- AlterTable: Add new columns to orders
ALTER TABLE "orders" ADD COLUMN "due_date" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "order_number" TEXT;
ALTER TABLE "orders" ADD COLUMN "paid_at" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "payment_method" "PaymentMethod";
ALTER TABLE "orders" ADD COLUMN "payment_status" "PaymentStatus" NOT NULL DEFAULT 'unpaid';

-- Generate order numbers for existing orders
DO $$
DECLARE
    rec RECORD;
    counter INTEGER := 1001;
BEGIN
    FOR rec IN SELECT id FROM "orders" WHERE order_number IS NULL ORDER BY created_at ASC
    LOOP
        UPDATE "orders" SET order_number = 'ORD-' || counter WHERE id = rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Make order_number required and unique
ALTER TABLE "orders" ALTER COLUMN "order_number" SET NOT NULL;
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
