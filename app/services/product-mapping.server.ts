import db from "../db.server";

// export type ProductMapping = {
//   sellerSku: string;
//   fulfillmentSku: string;
//   fulfillmentVariantId: string;
// };

// const productMappings: ProductMapping[] = [
//   {
//     sellerSku: "SELLER1-BLACK-S",
//     fulfillmentSku: "KC-TEST-BLK-S",
//      fulfillmentVariantId:
//       "gid://shopify/ProductVariant/52328842789080",
//   },

//   {
//     sellerSku: "SELLER1-BLACK-M",
//     fulfillmentSku: "KC-TEST-BLK-M",
//     fulfillmentVariantId:
//       "gid://shopify/ProductVariant/52328842821848",
//   },

//   {
//     sellerSku: "SELLER1-BLACK-L",
//     fulfillmentSku: "KC-TEST-BLK-L",
//     fulfillmentVariantId:
//       "gid://shopify/ProductVariant/52328842854616",
//   },
// ];

// export function findProductMapping(
//   sellerSku: string | null,
// ): ProductMapping | null {
//   if (!sellerSku) {
//     return null;
//   }

//   return (
//     productMappings.find(
//       (mapping) => mapping.sellerSku === sellerSku,
//     ) ?? null
//   );
// }
export async function findProductMapping(
  sellerShop: string,
  sellerSku: string | null,
) {
  if (!sellerSku) {
    return null;
  }

  const mapping = await db.productMapping.findFirst({
    where: {
      sellerShop,
      sellerSku,
      status: "ACTIVE",
    },
  });

  console.log("PRISMA PRODUCT MAPPING LOOKUP:", {
    sellerShop,
    sellerSku,
    mapping,
  });

  if (!mapping) {
    return null;
  }

  return {
    ...mapping,
    fulfillmentVariantId:
      mapping.fulfillmentVariantId.startsWith(
        "gid://shopify/ProductVariant/",
      )
        ? mapping.fulfillmentVariantId
        : `gid://shopify/ProductVariant/${mapping.fulfillmentVariantId}`,
  };

  //return mapping;
}