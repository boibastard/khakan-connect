import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.connectedStore.upsert({
    where: {
      shop: "khakan-seller-1.myshopify.com",
    },
    update: {
      name: "Khakan Seller 1",
      role: "CLIENT",
      isActive: true,
    },
    create: {
      shop: "khakan-seller-1.myshopify.com",
      name: "Khakan Seller 1",
      role: "CLIENT",
      isActive: true,
    },
  });

  await prisma.connectedStore.upsert({
    where: {
      shop: "khakan-fulfillment-2.myshopify.com",
    },
    update: {
      name: "Khakan Fulfillment 2",
      role: "FULFILLMENT",
      isActive: true,
    },
    create: {
      shop: "khakan-fulfillment-2.myshopify.com",
      name: "Khakan Fulfillment 2",
      role: "FULFILLMENT",
      isActive: true,
    },
  });

  console.log("Dev stores registered.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });