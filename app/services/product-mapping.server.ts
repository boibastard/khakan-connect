export type ProductMapping = {
  sellerSku: string;
  fulfillmentSku: string;
};

const productMappings: ProductMapping[] = [
  {
    sellerSku: "SELLER1-BLACK-S",
    fulfillmentSku: "KC-TEST-BLK-S",
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