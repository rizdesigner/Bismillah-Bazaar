import fs from 'fs';
import path from 'path';

const CONVERSION_RATE = 2.20462; // 1 kg = 2.20462 lbs

// Raw data extracted from PDF Page 1 and Page 2
const rawPdfItems = [
  // --- PAGE 1 ---
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

  // --- PAGE 2 ---
  { name: 'Ch Leg Qtr Cut Biryani Pcs', priceLb: 2.99, page: 2 },
  { name: 'Ch Leg Qtr Tikka cut', priceLb: 2.99, page: 2, normalizedName: 'Ch Leg Qtr Tikka Cut' },
  { name: 'Ch Ground (From Thai Meat)', priceLb: 5.49, page: 2 },
  { name: 'Whole Chicken BD cut (WL)', priceLb: 3.99, page: 2, normalizedName: 'Whole Chicken BD Cut (WL)' },
  { name: 'Whole Chicken Biryani cut (WL)', priceLb: 3.99, page: 2, normalizedName: 'Whole Chicken Biryani Cut (WL)' },
  { name: 'Ch. Boneless breast (35 grm)', priceLb: 6.49, page: 2, normalizedName: 'Ch. Boneless Breast (35 grm)' },
  { name: 'Chicken Thai bone in, skin off', priceLb: 5.49, page: 2, normalizedName: 'Chicken Thai Bone-In, Skin Off' },
  { name: 'Beef Bihari Kebab 6mm', priceLb: 9.49, page: 2 },
  { name: 'Beef ground Thin & Twice', priceLb: 6.99, page: 2, normalizedName: 'Beef Ground Thin & Twice' },
  { name: 'Beef shank boneless', priceLb: 7.99, page: 2, normalizedName: 'Beef Shank Boneless' }, // Note: Price updated to 7.99
  { name: 'Beef Bone in/ Bone less', priceLb: 7.49, page: 2, normalizedName: 'Beef Bone In / Boneless' },
  { name: 'Basa Fillet', priceLb: 3.49, page: 2 },
  { name: 'Lamb leg', priceLb: 7.99, page: 2, normalizedName: 'Lamb Leg' },
  { name: 'Paya cow/ goat/ lamb', priceLb: 3.99, page: 2, normalizedName: 'Paya Cow/Goat/Lamb' },
];

// Helper to determine category
function inferCategory(name) {
  const lower = name.toLowerCase();
  if (lower.includes('chicken') || lower.includes('ch.') || lower.includes('ch ')) {
    return 'Poultry';
  }
  // Default to Meat as we have Beef, Goat, Lamb, Paya, Basa
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
      // If we find a higher/newer price (e.g. page 2), update it
      if (item.page > existing.sourcePage || priceKg > existing.base_price_kg) {
        existing.base_price_kg = priceKg;
        existing.sourcePage = item.page;
        existing.priceLb = item.priceLb;
      }
    } else {
      processedMap.set(key, {
        item_name: finalName,
        category: category,
        base_price_kg: priceKg,
        in_stock: true,
        // metadata for verification
        priceLb: item.priceLb,
        sourcePage: item.page
      });
    }
  }

  return Array.from(processedMap.values());
}

const finalInventory = processAndDeduplicate();
console.log(JSON.stringify(finalInventory, null, 2));
console.log(`\nTotal unique items parsed: ${finalInventory.length}`);
