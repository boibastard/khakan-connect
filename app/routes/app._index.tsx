import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

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

  const order = json.data?.orders?.nodes?.[0] ?? null;

  return {
    order,
  };
};

export default function Index() {
  const { order } = useLoaderData<typeof loader>();

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
          <strong>Order:</strong> {order.name}
        </p>

        <p>
          <strong>Shopify Order ID:</strong> {order.id}
        </p>

        <p>
          <strong>Created:</strong> {order.createdAt}
        </p>

        <p>
          <strong>Payment Status:</strong> {order.displayFinancialStatus}
        </p>

        <h3>Line Items</h3>

        {order.lineItems.nodes.map(
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
      </s-section>
    </s-page>
  );
}