import { prisma } from "@/lib/prisma";
import { CatalogTabs } from "@/components/catalog-tabs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "Catalog" };

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const session = await getServerSession(authOptions);

  const inventory = await prisma.inventory.findMany({
    where: {
      inStock: true,
    },
    orderBy: {
      itemName: "asc",
    },
  });

  let clientOverrides: any[] = [];
  if (session?.user?.id) {
    clientOverrides = await prisma.clientProductOverride.findMany({
      where: {
        userId: session.user.id,
      },
    });
  }

  const overridesMap = new Map(
    clientOverrides.map((o) => [o.itemId, o])
  );

  const serializedInventory = inventory
    .filter((item) => {
      const override = overridesMap.get(item.id);
      if (override && override.isAvailable === false) {
        return false;
      }
      return true;
    })
    .map((item) => {
      const override = overridesMap.get(item.id);
      const finalPrice = override?.customPriceKg
        ? Number(override.customPriceKg)
        : Number(item.basePriceKg);

      return {
        ...item,
        basePriceKg: Number(item.basePriceKg),
        priceKg: finalPrice,
        hasCustomPrice: !!override?.customPriceKg,
      };
    });

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
