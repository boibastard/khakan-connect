import db from "../db.server";

export async function findSellerProductRule(
  sellerShop: string,
  sellerSku: string | null,
) {
  if (!sellerSku) {
    return null;
  }

  return db.sellerProductRule.findUnique({
    where: {
      sellerShop_sellerSku: {
        sellerShop,
        sellerSku,
      },
    },
  });
}