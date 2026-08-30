import type { KhakanOrder } from "../types/khakan-order";

export function normalizeShopifyOrder(order: any): KhakanOrder {
  return {
    sourceOrderId: order.id,
    sourceOrderNumber: order.name,
    createdAt: order.createdAt,
    paymentStatus: order.displayFinancialStatus,

    shippingAddress: order.shippingAddress
      ? {
          firstName: order.shippingAddress.firstName ?? null,
          lastName: order.shippingAddress.lastName ?? null,
          company: order.shippingAddress.company ?? null,
          address1: order.shippingAddress.address1 ?? null,
          address2: order.shippingAddress.address2 ?? null,
          city: order.shippingAddress.city ?? null,
          provinceCode: order.shippingAddress.provinceCode ?? null,
          zip: order.shippingAddress.zip ?? null,
          countryCode: order.shippingAddress.countryCodeV2 ?? null,
          phone: order.shippingAddress.phone ?? null,
        }
      : null,

    items: order.lineItems.nodes.map((item: any) => ({
      name: item.name,
      sku: item.sku ?? null,
      quantity: item.quantity,
    })),
  };
}