import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { normalizeShopifyOrder } from "../services/order-normalizer.server";
import { findProductMapping } from "../services/product-mapping.server";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query LatestOrder {
        orders(first: 1, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            name
            createdAt
            displayFinancialStatus

            lineItems(first: 10) {
              nodes {
                name
                quantity
                sku
              }
            }
          }
        }
      }
    `,
  );

  const json = await response.json();

  const shopifyOrder = json.data?.orders?.nodes?.[0] ?? null;

  const order = shopifyOrder
    ? normalizeShopifyOrder(shopifyOrder)
    : null;

    const mappedItems =
      order?.items.map((item) => {
        const mapping = findProductMapping(item.sku);

        return {
          ...item,
          fulfillmentSku: mapping?.fulfillmentSku ?? null,
        };
      }) ?? [];

    return {
      order,
      mappedItems,
    };
  };
  

export default function Index() {
  const { order, mappedItems } = useLoaderData<typeof loader>();

  if (!order) {
    return (
      <s-page heading="Khakan Connect">
        <s-section heading="Latest Seller Order">
          <p>No orders found.</p>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Khakan Connect">
      <s-section heading="Latest Seller Order">
        <p>
          <strong>Order:</strong> {order.sourceOrderNumber}
        </p>

        <p>
          <strong>Shopify Order ID:</strong> {order.sourceOrderId}
        </p>

        <p>
          <strong>Created:</strong> {order.createdAt}
        </p>

        <p>
          <strong>Payment Status:</strong> {order.paymentStatus}
        </p>

        <h3>Line Items</h3>

        {order.items.map(
          (
            item: {
              name: string;
              quantity: number;
              sku: string | null;
            },
            index: number,
          ) => (
            <div key={index}>
              <p>
                <strong>Product:</strong> {item.name}
              </p>

              <p>
                <strong>SKU:</strong> {item.sku || "No SKU"}
              </p>

              <p>
                <strong>Quantity:</strong> {item.quantity}
              </p>
            </div>
          ),
        )}
        
        <h3>Fulfillment Mapping</h3>

        {mappedItems.map((item, index) => (
          <div key={index}>
            <p>
              <strong>Seller SKU:</strong> {item.sku || "No SKU"}
            </p>

            <p>
              <strong>Fulfillment SKU:</strong>{" "}
              {item.fulfillmentSku || "No mapping found"}
            </p>
          </div>
        ))}
      </s-section>
    </s-page>
  );
}