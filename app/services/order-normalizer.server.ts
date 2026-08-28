import type { KhakanOrder } from "../types/khakan-order";

export function normalizeShopifyOrder(order: any): KhakanOrder {
  return {
    sourceOrderId: order.id,
    sourceOrderNumber: order.name,
    createdAt: order.createdAt,
    paymentStatus: order.displayFinancialStatus,

    items: order.lineItems.nodes.map((item: any) => ({
      name: item.name,
      sku: item.sku ?? null,
      quantity: item.quantity,
    })),
  };
}