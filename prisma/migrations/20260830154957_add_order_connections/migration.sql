-- CreateTable
CREATE TABLE "OrderConnection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sellerShop" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "sellerOrderName" TEXT NOT NULL,
    "fulfillmentShop" TEXT NOT NULL,
    "fulfillmentOrderId" TEXT NOT NULL,
    "fulfillmentOrderName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "OrderConnection_fulfillmentShop_fulfillmentOrderId_idx" ON "OrderConnection"("fulfillmentShop", "fulfillmentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderConnection_sellerShop_sellerOrderId_key" ON "OrderConnection"("sellerShop", "sellerOrderId");
