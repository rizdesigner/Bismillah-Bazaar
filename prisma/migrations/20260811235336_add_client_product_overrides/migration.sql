-- CreateTable
CREATE TABLE "client_product_overrides" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "custom_price_kg" DECIMAL(10,2),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_product_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_product_overrides_user_id_idx" ON "client_product_overrides"("user_id");

-- CreateIndex
CREATE INDEX "client_product_overrides_item_id_idx" ON "client_product_overrides"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_product_overrides_user_id_item_id_key" ON "client_product_overrides"("user_id", "item_id");

-- AddForeignKey
ALTER TABLE "client_product_overrides" ADD CONSTRAINT "client_product_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_product_overrides" ADD CONSTRAINT "client_product_overrides_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
