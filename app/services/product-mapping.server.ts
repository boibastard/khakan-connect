export type ProductMapping = {
  sellerSku: string;
  fulfillmentSku: string;
  fulfillmentVariantId: string;
};

const productMappings: ProductMapping[] = [
  {
    sellerSku: "SELLER1-BLACK-S",
    fulfillmentSku: "KC-TEST-BLK-S",
     fulfillmentVariantId:
      "gid://shopify/ProductVariant/53060481352000",
  },

  {
    sellerSku: "SELLER1-BLACK-M",
    fulfillmentSku: "KC-TEST-BLK-M",
    fulfillmentVariantId:
      "gid://shopify/ProductVariant/53060481384768",
  },

  {
    sellerSku: "SELLER1-BLACK-L",
    fulfillmentSku: "KC-TEST-BLK-L",
    fulfillmentVariantId:
      "gid://shopify/ProductVariant/53060481417536",
  },
];

export function findProductMapping(
  sellerSku: string | null,
): ProductMapping | null {
  if (!sellerSku) {
    return null;
  }

  return (
    productMappings.find(
      (mapping) => mapping.sellerSku === sellerSku,
    ) ?? null
  );
}