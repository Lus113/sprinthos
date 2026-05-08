CREATE TYPE "UserRole" AS ENUM ('user', 'admin');
CREATE TYPE "OrderStatus" AS ENUM ('collecting', 'in_transit', 'delivered');
CREATE TYPE "TariffType" AS ENUM ('basic', 'standard', 'pro');
CREATE TYPE "TariffRequestStatus" AS ENUM ('not_completed', 'in_queue', 'completed');

CREATE TABLE "users" (
  "id" SERIAL NOT NULL,
  "email" TEXT NOT NULL,
  "password_hash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'user',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "short_description" TEXT NOT NULL DEFAULT '',
  "manufacturer" TEXT NOT NULL DEFAULT '',
  "rating" NUMERIC(2,1) NOT NULL DEFAULT 4.8,
  "price" NUMERIC(12,2) NOT NULL,
  "category_id" INTEGER NOT NULL,
  "stock_quantity" INTEGER NOT NULL DEFAULT 0,
  "specs_json" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_images" (
  "id" SERIAL NOT NULL,
  "product_id" INTEGER NOT NULL,
  "image_url" TEXT NOT NULL,
  "is_main" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "bucket" TEXT,
  "storage_path" TEXT,
  CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog_posts" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "preview_text" TEXT NOT NULL,
  "full_text" TEXT NOT NULL,
  "cover_image_url" TEXT,
  "images" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER,
  "total_amount" NUMERIC(12,2) NOT NULL,
  "discount_applied" BOOLEAN NOT NULL DEFAULT false,
  "status" "OrderStatus" NOT NULL DEFAULT 'collecting',
  "delivery_address" TEXT NOT NULL,
  "recipient_name" TEXT NOT NULL,
  "recipient_phone" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_items" (
  "id" SERIAL NOT NULL,
  "order_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "price_at_time" NUMERIC(12,2) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cart_items" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "favorites" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "product_id" INTEGER NOT NULL,
  CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tariff_requests" (
  "id" SERIAL NOT NULL,
  "user_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "tariff_type" "TariffType" NOT NULL,
  "status" "TariffRequestStatus" NOT NULL DEFAULT 'not_completed',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tariff_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_addresses" (
  "id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "address_text" TEXT NOT NULL,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
CREATE UNIQUE INDEX "cart_items_user_id_product_id_key" ON "cart_items"("user_id", "product_id");
CREATE UNIQUE INDEX "favorites_user_id_product_id_key" ON "favorites"("user_id", "product_id");

ALTER TABLE "products"
  ADD CONSTRAINT "products_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites"
  ADD CONSTRAINT "favorites_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "favorites"
  ADD CONSTRAINT "favorites_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_addresses"
  ADD CONSTRAINT "user_addresses_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
