import shopify from "../shopify.server";

export const FULFILLMENT_SHOP =
  "khakan-fulfillment-2.myshopify.com";

export async function findFulfillmentVariantBySku(sku: string) {
  try {
    const { admin } =
      await shopify.unauthenticated.admin(FULFILLMENT_SHOP);

    const response = await admin.graphql(
      `#graphql
        query FindFulfillmentVariant($query: String!) {
          productVariants(first: 50, query: $query) {
            nodes {
              id
              sku
              title
              product {
                id
                title
              }
            }
          }
        }
      `,
      {
        variables: {
          query: `sku:${sku}`,
        },
      },
    );

    const json = await response.json();

    const variants = json.data?.productVariants?.nodes ?? [];

    console.log("SKU SEARCH RESULTS:", {
      searchedSku: sku,
      variants,
    });

    const variant = variants.find(
      (item: any) => item.sku === sku,
    );

    console.log("Fulfillment variant lookup:", {
      searchedSku: sku,
      variant,
    });

    return variant ?? null;
  } catch (error) {
    console.error(
      `Failed to find fulfillment variant for SKU ${sku}:`,
      error,
    );

    return null;
  }
}

export async function findExistingFulfillmentOrder(
  sellerOrderId: string,
) {
  try {
    const { admin } =
      await shopify.unauthenticated.admin(FULFILLMENT_SHOP);

    const response = await admin.graphql(
      `#graphql
        query FindExistingFulfillmentOrder($query: String!) {
          orders(first: 1, query: $query) {
            nodes {
              id
              name
              sourceIdentifier
            }
          }
        }
      `,
      {
        variables: {
          query: `source_identifier:${sellerOrderId}`,
        },
      },
    );

    const json = await response.json();

    const existingOrder =
      json.data?.orders?.nodes?.[0] ?? null;

    console.log("DUPLICATE CHECK:", {
      sellerOrderId,
      existingOrder,
    });

    return existingOrder;
  } catch (error) {
    console.error(
      "Failed to check for existing fulfillment order:",
      error,
    );

    return null;
  }
}

export async function createFulfillmentOrder(input: {
  sellerOrderId: string;
  sellerOrderName: string;

  shippingAddress: {
    firstName: string | null;
    lastName: string | null;
    company: string | null;
    address1: string | null;
    address2: string | null;
    city: string | null;
    provinceCode: string | null;
    zip: string | null;
    countryCode: string | null;
    phone: string | null;
  } | null;

  items: {
    fulfillmentVariantId: string;
    quantity: number;
  }[];
}) {
  try {
    const existingOrder =
      await findExistingFulfillmentOrder(
        input.sellerOrderId,
      );

    if (existingOrder) {
      console.log(
        "Production order already exists:",
        existingOrder,
      );

      return {
        ...existingOrder,
        alreadyExists: true,
      };
    }



    const { admin } =
      await shopify.unauthenticated.admin(FULFILLMENT_SHOP);

    const response = await admin.graphql(
      `#graphql
        mutation CreateFulfillmentOrder(
          $order: OrderCreateOrderInput!
        ) {
          orderCreate(order: $order) {
            order {
              id
              name
              displayFinancialStatus

              lineItems(first: 10) {
                nodes {
                  title
                  quantity
                  variant {
                    id
                    sku
                  }
                }
              }
            }

            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          order: {
            lineItems: input.items.map((item) => ({
              variantId: item.fulfillmentVariantId,
              quantity: item.quantity,
            })),

            financialStatus: "PAID",

            shippingAddress: input.shippingAddress
              ? {
                  firstName: input.shippingAddress.firstName,
                  lastName: input.shippingAddress.lastName,
                  company: input.shippingAddress.company,
                  address1: input.shippingAddress.address1,
                  address2: input.shippingAddress.address2,
                  city: input.shippingAddress.city,
                  provinceCode: input.shippingAddress.provinceCode,
                  zip: input.shippingAddress.zip,
                  countryCode: input.shippingAddress.countryCode,
                  phone: input.shippingAddress.phone,
                }
              : undefined,

            sourceIdentifier: input.sellerOrderId,

            note:
              `Khakan Connect production order from ${input.sellerOrderName}`,

            customAttributes: [
              {
                key: "Seller Order",
                value: input.sellerOrderName,
              },
              {
                key: "Seller Order ID",
                value: input.sellerOrderId,
              },
            ],

            tags: [
              "khakan-connect",
              "production-order",
            ],
          },
        },
      },
    );

    const json = await response.json();

    console.log(
      "FULFILLMENT ORDER CREATE RESPONSE:",
      JSON.stringify(json, null, 2),
    );

    const userErrors =
      json.data?.orderCreate?.userErrors ?? [];

    if (userErrors.length > 0) {
      console.error(
        "Fulfillment order user errors:",
        userErrors,
      );

      return null;
    }

    return json.data?.orderCreate?.order ?? null;
  } catch (error) {
    console.error(
      "Failed to create fulfillment order:",
      error,
    );

    return null;
  }
}

export async function debugFulfillmentSession() {
  try {
    const offlineId =
      `offline_${FULFILLMENT_SHOP}`;

    const session =
      await shopify.sessionStorage.loadSession(offlineId);

    console.log("FULFILLMENT SESSION DEBUG:", {
      offlineId,
      found: Boolean(session),
      shop: session?.shop,
      isOnline: session?.isOnline,
      scope: session?.scope,
      hasAccessToken: Boolean(session?.accessToken),
    });

    return session;
  } catch (error) {
    console.error(
      "Failed to inspect fulfillment session:",
      error,
    );

    return null;
  }
}

export async function testFulfillmentConnection() {
  try {
    const { admin, session } =
      await shopify.unauthenticated.admin(FULFILLMENT_SHOP);

    console.log("Fulfillment connected:", session.shop);

    const response = await admin.graphql(
      `#graphql
        query FulfillmentShopTest {
          shop {
            name
            myshopifyDomain
          }
        }
      `,
    );
    

    const json = await response.json();

    console.log("Fulfillment shop:", json.data?.shop);

    return json.data?.shop ?? null;
  } catch (error) {
    console.error("Fulfillment connection failed:", error);
    return null;
  }
  
}

