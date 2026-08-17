-- Piece Sizes table for chunk/piece size options
CREATE TABLE "piece_sizes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "item_id" UUID NOT NULL,
    "size_label" TEXT NOT NULL,
    "size_value" INTEGER NOT NULL,
    "size_unit" TEXT NOT NULL DEFAULT 'grm',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "piece_sizes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "piece_sizes" ADD CONSTRAINT "piece_sizes_item_id_fkey"
    FOREIGN KEY ("item_id") REFERENCES "inventory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "piece_sizes_item_id_idx" ON "piece_sizes"("item_id");

-- Add piece_size_id to order_items (nullable, so existing orders still work)
ALTER TABLE "order_items" ADD COLUMN "piece_size_id" UUID;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_piece_size_id_fkey"
    FOREIGN KEY ("piece_size_id") REFERENCES "piece_sizes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Conversations table for chat
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "admin_unread_count" INTEGER NOT NULL DEFAULT 0,
    "customer_unread_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "conversations_user_id_idx" ON "conversations"("user_id");

-- Messages table for chat
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "sender_role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");
CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");
