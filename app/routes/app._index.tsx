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
  listFulfillmentOrderConnections,
} from "../services/order-connection.server";

import { getConnectedStore } from "../services/connected-store.server";

type FulfillmentOrderConnection = {
  id: number;
  sellerShop: string;
  sellerOrderName: string;
  fulfillmentOrderName: string;
  status: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } =
    await authenticate.admin(request);

  const sellerShop = session.shop;

  const connectedStore = await getConnectedStore(sellerShop);
  
  if (!connectedStore) {
    return {
      success: false,
      message: "This store is not registered in Khakan Connect.",
    };
  }

  if (connectedStore.role !== "CLIENT") {
    return {
      success: false,
      message:
        "Production orders can only be created from a Client store.",
    };
  }

  console.log("CONNECTED STORE:", connectedStore);

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

  const mappedItems = await Promise.all(
    order.items.map(async (item) => {
      const mapping = await findProductMapping(
        sellerShop,
        item.sku,
      );

      return {
        sellerItem: item,
        mapping,
      };
    }),
  );

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
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } =
    await authenticate.admin(request);

  const currentShop = session.shop;

  const connectedStore =
    await getConnectedStore(currentShop);

  if (!connectedStore) {
    return {
      currentShop,
      connectedStore: null,
      order: null,
      mappedItems: [],
      fulfillmentShop: null,
      fulfillmentOrders: [],
    };
  }

  if (connectedStore.role === "FULFILLMENT") {
    const fulfillmentOrders =
      await listFulfillmentOrderConnections(
        currentShop,
      );

    return {
      currentShop,
      connectedStore,
      order: null,
      mappedItems: [],
      fulfillmentShop: null,
      fulfillmentOrders,
    };
  }


  console.log(
    "CONNECTED STORE FROM LOADER:",
    connectedStore,
  );

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

  console.log(
    "SELLER LATEST ORDER RAW:",
    JSON.stringify(json, null, 2),
  );

  const shopifyOrder = json.data?.orders?.nodes?.[0] ?? null;

  const order = shopifyOrder
    ? normalizeShopifyOrder(shopifyOrder)
    : null;

    console.log("NORMALIZED SELLER ORDER:", order);

    const mappedItems = order
      ? await Promise.all(
          order.items.map(async (item) => {
            const mapping =
              await findProductMapping(
                currentShop,
                item.sku,
              );

            return {
              ...item,
              fulfillmentSku:
                mapping?.fulfillmentSku ?? null,
              fulfillmentVariantId:
                mapping?.fulfillmentVariantId ?? null,
            };
          }),
        )
      : [];

    console.log("SELLER MAPPED ITEMS:", mappedItems);

    await debugFulfillmentSession();

    const fulfillmentShop = await testFulfillmentConnection();



    return {
      order,
      mappedItems,
      fulfillmentShop,
      currentShop,
      connectedStore,
      fulfillmentOrders: [],
    };
    
  };


  

export default function Index() {
  const {
    order,
    mappedItems,
    fulfillmentShop,
    currentShop,
    connectedStore,
    fulfillmentOrders,
  } = useLoaderData<typeof loader>();

  const actionData =
    useActionData<typeof action>();

  console.log("UI RENDER DATA:", {
    order,
    mappedItems,
    fulfillmentShop,
    actionData,
  });

  if (connectedStore?.role === "FULFILLMENT") {
    return (
      <s-page heading="Khakan Connect">
        <s-section heading="Fulfillment Dashboard">

          <div style={{ marginBottom: "20px" }}>
            <h2>Khakan Connect Store Info</h2>

            <p>
              <strong>Shop:</strong> {currentShop}
            </p>

            <p>
              <strong>Name:</strong>{" "}
              {connectedStore.name ?? "Unknown store"}
            </p>

            <p>
              <strong>Role:</strong>{" "}
              {connectedStore.role}
            </p>
          </div>

          <h3>Incoming Production Orders</h3>

          {fulfillmentOrders.length === 0 ? (
            <p>No production orders yet.</p>
          ) : (
            fulfillmentOrders.map(
              (connection: FulfillmentOrderConnection) => (
              <div
                key={connection.id}
                style={{
                  marginBottom: "20px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <p>
                  <strong>Seller:</strong>{" "}
                  {connection.sellerShop}
                </p>

                <p>
                  <strong>Seller Order:</strong>{" "}
                  {connection.sellerOrderName}
                </p>

                <p>
                  <strong>Fulfillment Order:</strong>{" "}
                  {connection.fulfillmentOrderName}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {connection.status}
                </p>
              </div>
            ))
          )}

        </s-section>
      </s-page>
    );
  }

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
        <div style={{ marginBottom: "20px" }}>
        <h2>Khakan Connect Store Info</h2>

        <p>
          <strong>Shop:</strong> {currentShop}
        </p>

        <p>
          <strong>Name:</strong>{" "}
          {connectedStore?.name ?? "Unknown store"}
        </p>

        <p>
          <strong>Role:</strong>{" "}
          {connectedStore?.role ?? "UNREGISTERED"}
        </p>
      </div>
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


