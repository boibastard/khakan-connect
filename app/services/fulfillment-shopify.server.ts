import shopify from "../shopify.server";

const FULFILLMENT_SHOP = "khakan-fulfillment-1.myshopify.com";

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