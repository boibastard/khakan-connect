import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "react-router";
import {
  Form,
  useActionData,
  useLoaderData,
} from "react-router";
import { authenticate } from "../shopify.server";
import { normalizeShopifyOrder } from "../services/order-normalizer.server";
import { findProductMapping } from "../services/product-mapping.server";
import {
  testFulfillmentConnection,
  createFulfillmentOrder,
  FULFILLMENT_SHOP,
  debugFulfillmentSession,
} from "../services/fulfillment-shopify.server";
import {
  findOrderConnection,
  createOrderConnection,
} from "../services/order-connection.server";


export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } =
    await authenticate.admin(request);

  const sellerShop = session.shop;

  const response = await admin.graphql(
    `#graphql
      query LatestOrderForProduction {
        orders(first: 1, sortKey: CREATED_AT, reverse: true) {
          nodes {
            id
            name
            createdAt
            displayFinancialStatus
            shippingAddress {
              firstName
              lastName
              company
              address1
              address2
              city
              provinceCode
              zip
              countryCodeV2
              phone
            }

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

  const shopifyOrder =
    json.data?.orders?.nodes?.[0] ?? null;

  if (!shopifyOrder) {
    return {
      success: false,
      message: "No Seller order found.",
    };
  }

  const order =
      normalizeShopifyOrder(shopifyOrder);

  const existingConnection =
      await findOrderConnection(
        sellerShop,
        order.sourceOrderId,
      );

    if (existingConnection) {
      return {
        success: true,
        message:
          `Production order ${existingConnection.fulfillmentOrderName} already exists. No duplicate was created.`,
        fulfillmentOrderId:
          existingConnection.fulfillmentOrderId,
      };
    }

    if (order.items.length === 0) {
    return {
      success: false,
      message: "Seller order has no line items.",
    };
  }

  const mappedItems = order.items.map((item) => {
    const mapping = findProductMapping(item.sku);

    return {
      sellerItem: item,
      mapping,
    };
  });

  const unmappedItems = mappedItems.filter(
    (item) => !item.mapping,
  );

  if (unmappedItems.length > 0) {
    const missingSkus = unmappedItems
      .map(
        (item) =>
          item.sellerItem.sku || "No SKU",
      )
      .join(", ");

    return {
      success: false,
      message:
        `Production order not created. Missing mappings for: ${missingSkus}`,
    };
  }

  const fulfillmentItems = mappedItems.map(
    ({ sellerItem, mapping }) => ({
      fulfillmentVariantId:
        mapping!.fulfillmentVariantId,
      quantity: sellerItem.quantity,
    }),
  );

  console.log("PRODUCTION ORDER ITEMS:", fulfillmentItems);

  const fulfillmentOrder =
    await createFulfillmentOrder({
    sellerOrderId: order.sourceOrderId,
    sellerOrderName: order.sourceOrderNumber,
    shippingAddress: order.shippingAddress,
    items: fulfillmentItems,
    });

  if (!fulfillmentOrder) {
    return {
      success: false,
      message: "Failed to create fulfillment order.",
    };
  }

  if ("alreadyExists" in fulfillmentOrder) {
    await createOrderConnection({
      sellerShop,
      sellerOrderId: order.sourceOrderId,
      sellerOrderName: order.sourceOrderNumber,

      fulfillmentShop: FULFILLMENT_SHOP,
      fulfillmentOrderId:
        fulfillmentOrder.id,
      fulfillmentOrderName:
        fulfillmentOrder.name,
    });

    return {
      success: true,
      message:
        `Production order ${fulfillmentOrder.name} already exists. Khakan Connect relationship saved.`,
      fulfillmentOrderId:
        fulfillmentOrder.id,
    };
  }

  await createOrderConnection({
    sellerShop,
    sellerOrderId: order.sourceOrderId,
    sellerOrderName: order.sourceOrderNumber,

    fulfillmentShop: FULFILLMENT_SHOP,
    fulfillmentOrderId:
      fulfillmentOrder.id,
    fulfillmentOrderName:
      fulfillmentOrder.name,
  });

  return {
    success: true,
    message:
      `Created Shop B order ${fulfillmentOrder.name} and saved the Khakan Connect relationship.`,
    fulfillmentOrderId:
      fulfillmentOrder.id,
  };

  return {
    success: true,
    message:
      `Created Shop B order ${fulfillmentOrder.name}`,
    fulfillmentOrderId:
      fulfillmentOrder.id,
  };
};

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
            shippingAddress {
              firstName
              lastName
              company
              address1
              address2
              city
              provinceCode
              zip
              countryCodeV2
              phone
            }

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
          fulfillmentVariantId:
            mapping?.fulfillmentVariantId ?? null,
        };
      }) ?? [];
    

    await debugFulfillmentSession();
    
    const fulfillmentShop = await testFulfillmentConnection();
    //const fulfillmentShop = null as {
    //  name: string;
    //  myshopifyDomain: string;
    //} | null;


    return {
      order,
      mappedItems,
      fulfillmentShop,
    };
    
  };
  

export default function Index() {
  const {
    order,
    mappedItems,
    fulfillmentShop,
  } = useLoaderData<typeof loader>();

  const actionData =
    useActionData<typeof action>();

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

            <p>
              <strong>Fulfillment Variant ID:</strong>{" "}
              {item.fulfillmentVariantId || "No mapping found"}
            </p>
          </div>
        ))}

        <h3>Create Production Order</h3>

        <Form method="post">
          <button type="submit">
            Create Production Order
          </button>
        </Form>

        {actionData && (
          <p>
            <strong>
              {actionData.success
                ? "Success:"
                : "Error:"}
            </strong>{" "}
            {actionData.message}
          </p>
        )}

        <h3>Fulfillment Store Connection</h3>

        <p>
          <strong>Store:</strong>{" "}
          {fulfillmentShop?.name || "Not connected"}
        </p>

        <p>
          <strong>Domain:</strong>{" "}
          {fulfillmentShop?.myshopifyDomain || "Not connected"}
        </p>
      </s-section>
    </s-page>
  );
}