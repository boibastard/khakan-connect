import shopify from "../shopify.server";

const FULFILLMENT_SHOP = "khakan-fulfillment-1.myshopify.com";

export async function testFulfillmentConnection() {
  const { admin } =
    await shopify.unauthenticated.admin(FULFILLMENT_SHOP);

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

  return json.data?.shop ?? null;
}