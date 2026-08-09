import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@bismillahbazaar.com",
      password: await bcrypt.hash("admin123", 10),
      role: "admin",
      restaurantName: "Bismillah Bazaar Wholesale",
      phone: "+1 555 0100",
      location: "Unit 4, Wholesale Depot, Springfield",
      status: "active",
    },
  });

  const activeCustomer = await prisma.user.create({
    data: {
      email: "purchasing@spicegrill.com",
      password: await bcrypt.hash("customer123", 10),
      role: "customer",
      restaurantName: "Spice Grill House",
      phone: "+1 555 0123",
      location: "221 Market St, Springfield",
      status: "active",
    },
  });

  const pendingCustomer = await prisma.user.create({
    data: {
      email: "owner@tandoorinights.com",
      password: await bcrypt.hash("customer123", 10),
      role: "customer",
      restaurantName: "Tandoori Nights",
      phone: "+1 555 0999",
      location: "98 High St, Springfield",
      status: "pending_approval",
    },
  });

  type SeedInventory = {
    itemName: string;
    category: "Poultry" | "Meat" | "Dried";
    basePriceKg: number;
    inStock?: boolean;
  };

  const inventoryData: SeedInventory[] = [
    { itemName: "Chicken Breast", category: "Poultry", basePriceKg: 6.5 },
    { itemName: "Chicken Thigh", category: "Poultry", basePriceKg: 4.8 },
    { itemName: "Whole Chicken", category: "Poultry", basePriceKg: 3.9 },
    { itemName: "Chicken Wings", category: "Poultry", basePriceKg: 4.2 },
    { itemName: "Lamb Chops", category: "Meat", basePriceKg: 14.5 },
    { itemName: "Lamb Mince", category: "Meat", basePriceKg: 11.0 },
    { itemName: "Beef Mince", category: "Meat", basePriceKg: 8.9 },
    { itemName: "Beef Steak", category: "Meat", basePriceKg: 16.5 },
    { itemName: "Beef Jerky", category: "Dried", basePriceKg: 18.0 },
    { itemName: "Dried Sausage", category: "Dried", basePriceKg: 15.5, inStock: false },
  ];

  const inventory: { id: string; itemName: string }[] = [];
  for (const item of inventoryData) {
    inventory.push(
      await prisma.inventory.create({
        data: { ...item, imageUrl: null, inStock: item.inStock ?? true },
      })
    );
  }

  const byName = (name: string) => inventory.find((i) => i.itemName === name)!;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const order1 = await prisma.order.create({
    data: {
      userId: activeCustomer.id,
      status: "pending",
      originalTotal: 61.5,
      items: {
        create: [
          { itemId: byName("Chicken Breast").id, requestedKg: 5, fulfilledKg: null },
          { itemId: byName("Lamb Chops").id, requestedKg: 2, fulfilledKg: null },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      userId: activeCustomer.id,
      status: "modified",
      originalTotal: 119.2,
      finalTotal: 95.0,
      eta: new Date(now + 2 * day),
      items: {
        create: [
          { itemId: byName("Chicken Thigh").id, requestedKg: 10, fulfilledKg: 8 },
          { itemId: byName("Beef Mince").id, requestedKg: 8, fulfilledKg: 5 },
        ],
      },
    },
  });

  const order3 = await prisma.order.create({
    data: {
      userId: activeCustomer.id,
      status: "confirmed",
      originalTotal: 54.6,
      finalTotal: 54.6,
      eta: new Date(now + 3 * day),
      items: {
        create: [
          { itemId: byName("Chicken Breast").id, requestedKg: 6, fulfilledKg: 6 },
          { itemId: byName("Whole Chicken").id, requestedKg: 4, fulfilledKg: 4 },
        ],
      },
    },
  });

  const order4 = await prisma.order.create({
    data: {
      userId: activeCustomer.id,
      status: "delivered",
      originalTotal: 133.5,
      finalTotal: 133.5,
      eta: new Date(now - 5 * day),
      items: {
        create: [
          { itemId: byName("Beef Mince").id, requestedKg: 15, fulfilledKg: 15 },
        ],
      },
    },
  });

  console.log({
    admin: admin.email,
    activeCustomer: activeCustomer.email,
    pendingCustomer: pendingCustomer.email,
    inventoryItems: inventory.length,
    orders: [order1.id, order2.id, order3.id, order4.id].length,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
