import { prisma } from "@/lib/prisma";
import { CatalogTabs } from "@/components/catalog-tabs";

export const metadata = { title: "Catalog" };

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const inventory = await prisma.inventory.findMany({
    where: {
      inStock: true,
    },
    orderBy: {
      itemName: "asc",
    },
  });

  const serializedInventory = inventory.map((item) => ({
    ...item,
    basePriceKg: Number(item.basePriceKg),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Catalog</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Browse today&apos;s available stock.
      </p>

      <CatalogTabs inventory={serializedInventory} />
    </div>
  );
}
