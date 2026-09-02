import db from "../db.server";

export type StoreRole = "CLIENT" | "FULFILLMENT";

export async function getConnectedStore(shop: string) {
  return db.connectedStore.findUnique({
    where: {
      shop,
    },
  });
}

export async function registerConnectedStore(input: {
  shop: string;
  name?: string | null;
  role: StoreRole;
}) {
  return db.connectedStore.upsert({
    where: {
      shop: input.shop,
    },

    update: {
      name: input.name ?? undefined,
      role: input.role,
      isActive: true,
    },

    create: {
      shop: input.shop,
      name: input.name ?? null,
      role: input.role,
      isActive: true,
    },
  });
}