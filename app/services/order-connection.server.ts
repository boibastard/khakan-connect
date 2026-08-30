import db from "../db.server";

export async function findOrderConnection(
  sellerShop: string,
  sellerOrderId: string,
) {
  return db.orderConnection.findUnique({
    where: {
      sellerShop_sellerOrderId: {
        sellerShop,
        sellerOrderId,
      },
    },
  });
}

export async function createOrderConnection(input: {
  sellerShop: string;
  sellerOrderId: string;
  sellerOrderName: string;

  fulfillmentShop: string;
  fulfillmentOrderId: string;
  fulfillmentOrderName: string;
}) {
  return db.orderConnection.create({
    data: {
      sellerShop: input.sellerShop,
      sellerOrderId: input.sellerOrderId,
      sellerOrderName: input.sellerOrderName,

      fulfillmentShop: input.fulfillmentShop,
      fulfillmentOrderId: input.fulfillmentOrderId,
      fulfillmentOrderName:
        input.fulfillmentOrderName,

      status: "created",
    },
  });
}