import { getDb } from './server/db.ts';
import { products } from './drizzle/schema.ts';
import { eq, and } from 'drizzle-orm';

const db = await getDb();

// Buscar el producto AS001004
const [padre] = await db.select().from(products).where(eq(products.sku, 'AS001004'));

console.log('Producto padre AS001004:');
console.log('  SKU:', padre?.sku);
console.log('  Name:', padre?.name);
console.log('  parentSku:', padre?.parentSku);
console.log('  hideInCatalog:', padre?.hideInCatalog);
console.log('  isActive:', padre?.isActive);

// Buscar variantes
const variantes = await db
  .select()
  .from(products)
  .where(
    and(
      eq(products.parentSku, 'AS001004'),
      eq(products.isActive, true)
    )
  );

console.log(`\nVariantes encontradas: ${variantes.length}`);
console.log('Primeras 5 variantes:');
variantes.slice(0, 5).forEach(v => {
  console.log(`  ${v.sku}: hideInCatalog=${v.hideInCatalog}`);
});

const hasVisibleVariant = variantes.some(v => !v.hideInCatalog);
console.log(`\n¿Tiene variantes visibles?: ${hasVisibleVariant}`);
console.log(`¿Debería mostrarse el padre?: ${variantes.length > 0 && hasVisibleVariant ? 'SÍ' : 'NO'}`);

process.exit(0);
