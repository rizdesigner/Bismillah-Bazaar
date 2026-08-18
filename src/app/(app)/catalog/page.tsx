import { createClient } from "@/lib/supabase-server";
import { CatalogTabs } from "@/components/catalog-tabs";

export const runtime = 'edge';
export const metadata = { title: "Catalog" };

export const dynamic = "force-dynamic";

type PieceSizeItem = {
  id: string;
  sizeLabel: string;
  sizeValue: number;
  sizeUnit: string;
};

type ClientOverride = {
  item_id: string;
  custom_price_kg: number | null;
  is_available: boolean;
};

export default async function CatalogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: inventory } = await supabase
    .from("inventory")
    .select("*")
    .eq("in_stock", true)
    .order("item_name");

  const { data: allPieceSizes } = await supabase
    .from("piece_sizes")
    .select("*")
    .order("size_value");

  const pieceSizesMap = new Map<string, PieceSizeItem[]>();
  for (const ps of allPieceSizes ?? []) {
    if (!pieceSizesMap.has(ps.item_id)) {
      pieceSizesMap.set(ps.item_id, []);
    }
    pieceSizesMap.get(ps.item_id)!.push({
      id: ps.id,
      sizeLabel: ps.size_label,
      sizeValue: ps.size_value,
      sizeUnit: ps.size_unit,
    });
  }

  let clientOverrides: ClientOverride[] = [];
  if (user) {
    const { data } = await supabase
      .from("client_product_overrides")
      .select("*")
      .eq("user_id", user.id);
    clientOverrides = (data ?? []) as ClientOverride[];
  }

  const overridesMap = new Map<string, ClientOverride>(
    clientOverrides.map((o) => [o.item_id, o])
  );

  const serializedInventory = (inventory ?? [])
    .filter((item) => {
      const override = overridesMap.get(item.id);
      if (override && override.is_available === false) {
        return false;
      }
      return true;
    })
    .map((item) => {
      const override = overridesMap.get(item.id);
      const finalPrice = override?.custom_price_kg
        ? Number(override.custom_price_kg)
        : Number(item.base_price_kg);

      return {
        ...item,
        id: item.id,
        itemName: item.item_name,
        category: item.category,
        unit: item.unit,
        basePriceKg: Number(item.base_price_kg),
        priceKg: finalPrice,
        hasCustomPrice: !!override?.custom_price_kg,
        inStock: item.in_stock,
        imageUrl: item.image_url,
        pieceSizes: pieceSizesMap.get(item.id) ?? [],
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
