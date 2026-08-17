import fs from 'fs';
import path from 'path';

const envLocalPath = path.join(process.cwd(), '.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

const getEnvVar = (name) => {
  const match = envLocalContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase configuration in .env.local");
  process.exit(1);
}

const CONVERSION_RATE = 2.20462;

const rawPdfItems = [
  { name: 'Ch Leg Qtr Cut Biryani Pcs', priceLb: 2.99, page: 1 },
  { name: 'Ch Leg Qtr Cut in to 1" X !"', priceLb: 2.99, page: 1, normalizedName: 'Ch Leg Qtr Cut into 1" x 1"' },
  { name: 'Chicken Thai Business card Size', priceLb: 5.49, page: 1, normalizedName: 'Chicken Thai Business Card Size' },
  { name: 'Ch. Thai Cut In to 1" X 1"', priceLb: 5.49, page: 1, normalizedName: 'Ch. Thai Cut into 1" x 1"' },
  { name: 'Ch Ground (From Thai Meat)', priceLb: 5.49, page: 1 },
  { name: 'Ch. Boneless breast 1" X 1"', priceLb: 6.49, page: 1, normalizedName: 'Ch. Boneless Breast 1" x 1"' },
  { name: 'Chicken Breast As is', priceLb: 6.49, page: 1, normalizedName: 'Chicken Breast As Is' },
  { name: 'Whole Chicken Skin Off', priceLb: 3.99, page: 1 },
  { name: 'Beef ground (25% Fat) Thin/Thick', priceLb: 6.99, page: 1, normalizedName: 'Beef Ground (25% Fat) Thin/Thick' },
  { name: 'Beef shank boneless', priceLb: 7.49, page: 1, normalizedName: 'Beef Shank Boneless' },
  { name: 'Beef Bone', priceLb: 3.49, page: 1 },
  { name: 'Goat', priceLb: 7.99, page: 1 },
  { name: 'Lamb', priceLb: 7.99, page: 1 },
  { name: 'Paya cow/ goat/ lamb', priceLb: 3.99, page: 1, normalizedName: 'Paya Cow/Goat/Lamb' },
  { name: 'Ch Leg Qtr Cut Biryani Pcs', priceLb: 2.99, page: 2 },
  { name: 'Ch Leg Qtr Tikka cut', priceLb: 2.99, page: 2, normalizedName: 'Ch Leg Qtr Tikka Cut' },
  { name: 'Ch Ground (From Thai Meat)', priceLb: 5.49, page: 2 },
  { name: 'Whole Chicken BD cut (WL)', priceLb: 3.99, page: 2, normalizedName: 'Whole Chicken BD Cut (WL)' },
  { name: 'Whole Chicken Biryani cut (WL)', priceLb: 3.99, page: 2, normalizedName: 'Whole Chicken Biryani Cut (WL)' },
  { name: 'Ch. Boneless breast (35 grm)', priceLb: 6.49, page: 2, normalizedName: 'Ch. Boneless Breast (35 grm)' },
  { name: 'Chicken Thai bone in, skin off', priceLb: 5.49, page: 2, normalizedName: 'Chicken Thai Bone-In, Skin Off' },
  { name: 'Beef Bihari Kebab 6mm', priceLb: 9.49, page: 2 },
  { name: 'Beef ground Thin & Twice', priceLb: 6.99, page: 2, normalizedName: 'Beef Ground Thin & Twice' },
  { name: 'Beef shank boneless', priceLb: 7.99, page: 2, normalizedName: 'Beef Shank Boneless' },
  { name: 'Beef Bone in/ Bone less', priceLb: 7.49, page: 2, normalizedName: 'Beef Bone In / Boneless' },
  { name: 'Basa Fillet', priceLb: 3.49, page: 2 },
  { name: 'Lamb leg', priceLb: 7.99, page: 2, normalizedName: 'Lamb Leg' },
  { name: 'Paya cow/ goat/ lamb', priceLb: 3.99, page: 2, normalizedName: 'Paya Cow/Goat/Lamb' },
];

function inferCategory(name) {
  const lower = name.toLowerCase();
  if (lower.includes('chicken') || lower.includes('ch.') || lower.includes('ch ')) {
    return 'Poultry';
  }
  return 'Meat';
}

function processAndDeduplicate() {
  const processedMap = new Map();

  for (const item of rawPdfItems) {
    const finalName = item.normalizedName || item.name;
    const key = finalName.toLowerCase().trim();
    const priceKg = parseFloat((item.priceLb * CONVERSION_RATE).toFixed(2));
    const category = inferCategory(finalName);

    if (processedMap.has(key)) {
      const existing = processedMap.get(key);
      if (item.page > existing.sourcePage || priceKg > existing.base_price_kg) {
        existing.base_price_kg = priceKg;
        existing.sourcePage = item.page;
      }
    } else {
      processedMap.set(key, {
        item_name: finalName,
        category: category,
        base_price_kg: priceKg,
        in_stock: true,
        sourcePage: item.page
      });
    }
  }

  return Array.from(processedMap.values());
}

const inventoryItems = processAndDeduplicate();

async function insertInventory() {
  console.log(`Inserting ${inventoryItems.length} items into inventory...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const item of inventoryItems) {
    try {
      const insertItem = {
        item_name: item.item_name,
        category: item.category,
        base_price_kg: item.base_price_kg,
        in_stock: item.in_stock
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/inventory`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(insertItem)
      });

      if (response.status === 201 || response.status === 200) {
        successCount++;
        console.log(`✓ ${item.item_name}`);
      } else if (response.status === 409) {
        console.log(`○ Skipped (duplicate): ${item.item_name}`);
      } else {
        const errText = await response.text();
        console.error(`✗ ${item.item_name}: ${response.status} - ${errText}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`✗ ${item.item_name}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Inserted: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${inventoryItems.length}`);
}

insertInventory();
