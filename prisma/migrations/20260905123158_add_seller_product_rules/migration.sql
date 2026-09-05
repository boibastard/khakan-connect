-- CreateTable
CREATE TABLE "SellerProductRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerShop" TEXT NOT NULL,
    "sellerProductId" TEXT,
    "sellerVariantId" TEXT,
    "sellerSku" TEXT NOT NULL,
    "fulfillmentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "SellerProductRule_sellerShop_fulfillmentEnabled_idx" ON "SellerProductRule"("sellerShop", "fulfillmentEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "SellerProductRule_sellerShop_sellerSku_key" ON "SellerProductRule"("sellerShop", "sellerSku");
