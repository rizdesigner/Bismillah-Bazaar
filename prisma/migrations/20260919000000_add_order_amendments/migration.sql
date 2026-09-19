-- AlterTable
ALTER TABLE "orders" ADD COLUMN "amendment_pending" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "proposed_changes" JSONB;
ALTER TABLE "orders" ADD COLUMN "amendment_requested_by" UUID;
