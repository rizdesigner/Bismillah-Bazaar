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

const PIECE_SIZES = [
  { itemPattern: 'Ch. Boneless Breast 1" x 1"', sizes: [
      { label: '10 grm', value: 10, unit: 'grm' },
      { label: '20 grm', value: 20, unit: 'grm' },
      { label: '30 grm', value: 30, unit: 'grm' },
      { label: '35 grm', value: 35, unit: 'grm' },
      { label: '40 grm', value: 40, unit: 'grm' },
  ]},
  { itemPattern: 'Ch. Boneless Breast (35 grm)', sizes: [
      { label: '15 grm', value: 15, unit: 'grm' },
      { label: '25 grm', value: 25, unit: 'grm' },
      { label: '40 grm', value: 40, unit: 'grm' },
      { label: '80 grm', value: 80, unit: 'grm' },
      { label: '100 grm', value: 100, unit: 'grm' },
  ]},
  { itemPattern: 'Chicken Thai Bone-In, Skin Off', sizes: [
      { label: '20 grm', value: 20, unit: 'grm' },
      { label: '25 grm', value: 25, unit: 'grm' },
      { label: '35 grm', value: 35, unit: 'grm' },
      { label: '45 grm', value: 45, unit: 'grm' },
  ]},
  { itemPattern: 'Beef Shank Boneless', sizes: [
      { label: '35 grm', value: 35, unit: 'grm' },
      { label: '40 grm', value: 40, unit: 'grm' },
      { label: '50 grm', value: 50, unit: 'grm' },
      { label: '60 grm', value: 60, unit: 'grm' },
      { label: '80 grm', value: 80, unit: 'grm' },
  ]},
  { itemPattern: 'Beef Bone In / Boneless', sizes: [
      { label: '30 grm', value: 30, unit: 'grm' },
      { label: '40 grm', value: 40, unit: 'grm' },
      { label: '50 grm', value: 50, unit: 'grm' },
      { label: '60 grm', value: 60, unit: 'grm' },
      { label: '70 grm', value: 70, unit: 'grm' },
  ]},
  { itemPattern: 'Ch Leg Qtr Cut Biryani Pcs', sizes: [
      { label: '2 pcs', value: 2, unit: 'pcs' },
      { label: '3 pcs', value: 3, unit: 'pcs' },
      { label: '4 pcs', value: 4, unit: 'pcs' },
      { label: 'South Indian cut', value: 1, unit: 'pcs' },
  ]},
  { itemPattern: 'Ch Leg Qtr Tikka Cut', sizes: [
      { label: '2 pcs', value: 2, unit: 'pcs' },
      { label: '3 pcs', value: 3, unit: 'pcs' },
      { label: '4 pcs', value: 4, unit: 'pcs' },
      { label: 'South Indian cut', value: 1, unit: 'pcs' },
  ]},
  { itemPattern: 'Whole Chicken BD Cut (WL)', sizes: [
      { label: '4 pcs', value: 4, unit: 'pcs' },
      { label: '8 pcs', value: 8, unit: 'pcs' },
      { label: '16 pcs', value: 16, unit: 'pcs' },
      { label: 'bd cut', value: 1, unit: 'pcs' },
      { label: 'South Indian cut', value: 1, unit: 'pcs' },
  ]},
  { itemPattern: 'Whole Chicken Biryani Cut (WL)', sizes: [
      { label: '4 pcs', value: 4, unit: 'pcs' },
      { label: '8 pcs', value: 8, unit: 'pcs' },
      { label: '16 pcs', value: 16, unit: 'pcs' },
      { label: 'bd cut', value: 1, unit: 'pcs' },
      { label: 'South Indian cut', value: 1, unit: 'pcs' },
  ]},
];

async function getInventory() {
  const response = await fetch(`${supabaseUrl}/rest/v1/inventory?select=id,item_name`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    }
  });
  return response.json();
}

async function insertPieceSizes(itemId, sizes) {
  for (const size of sizes) {
    await fetch(`${supabaseUrl}/rest/v1/piece_sizes`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        item_id: itemId,
        size_label: size.label,
        size_value: size.value,
        size_unit: size.unit,
      })
    });
  }
}

async function seed() {
  console.log('Fetching inventory items...\n');
  const inventory = await getInventory();

  const inventoryMap = new Map(inventory.map(i => [i.item_name.toLowerCase(), i.id]));

  let totalInserted = 0;

  for (const entry of PIECE_SIZES) {
    const itemId = inventoryMap.get(entry.itemPattern.toLowerCase());
    if (!itemId) {
      console.log(`⚠ Could not find item: "${entry.itemPattern}"`);
      continue;
    }

    console.log(`✓ Inserting ${entry.sizes.length} sizes for: ${entry.itemPattern}`);
    await insertPieceSizes(itemId, entry.sizes);
    totalInserted += entry.sizes.length;
  }

  console.log(`\n✅ Seeded ${totalInserted} piece sizes across ${PIECE_SIZES.length} items`);
}

seed().catch(console.error);
