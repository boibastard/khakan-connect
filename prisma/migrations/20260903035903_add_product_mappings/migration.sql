-- CreateTable
CREATE TABLE "ProductMapping" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerShop" TEXT NOT NULL,
    "sellerProductId" TEXT,
    "sellerVariantId" TEXT,
    "sellerSku" TEXT NOT NULL,
    "fulfillmentShop" TEXT NOT NULL,
    "fulfillmentProductId" TEXT,
    "fulfillmentVariantId" TEXT NOT NULL,
    "fulfillmentSku" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ProductMapping_fulfillmentShop_fulfillmentVariantId_idx" ON "ProductMapping"("fulfillmentShop", "fulfillmentVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMapping_sellerShop_sellerSku_key" ON "ProductMapping"("sellerShop", "sellerSku");
