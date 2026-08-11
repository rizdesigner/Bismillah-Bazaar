ALTER TABLE "orders" RENAME COLUMN "eta" TO "admin_eta";
ALTER TABLE "orders" ADD COLUMN "requested_eta" TIMESTAMP(3);
