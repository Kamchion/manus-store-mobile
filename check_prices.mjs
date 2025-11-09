import { getDb } from './server/db.ts';
import { products, pricingByType } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = await getDb();

// Buscar variantes de AS001004
const variantes = await db
  .select()
  .from(products)
  .where(eq(products.parentSku, 'AS001004'))
  .limit(5);

console.log(`Variantes de AS001004 (primeras 5):\n`);

for (const variant of variantes) {
  const pricing = await db
    .select()
    .from(pricingByType)
    .where(eq(pricingByType.productId, variant.id));
  
  console.log(`SKU: ${variant.sku}`);
  console.log(`  Name: ${variant.name}`);
  console.log(`  basePrice: ${variant.basePrice}`);
  
  if (pricing.length > 0) {
    pricing.forEach(p => {
      console.log(`  ${p.priceType}: ${p.price}`);
    });
  } else {
    console.log(`  No pricing data found`);
  }
  console.log('');
}

process.exit(0);
