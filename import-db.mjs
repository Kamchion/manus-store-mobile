import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const connection = await createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
});

console.log('🗑️  Limpiando tabla products...');
await connection.query('DELETE FROM products');

console.log('📥 Importando productos desde CSV...\n');

const csv = readFileSync('/tmp/products.csv', 'utf-8');
const lines = csv.split('\n');

let imported = 0, skipped = 0;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const cols = lines[i].split(',');
  const sku = cols[4]?.trim();
  if (!sku) { skipped++; continue; }
  
  const id = `prod_${String(i).padStart(3, '0')}`;
  
  try {
    await connection.query(
      `INSERT INTO products (
        id, sku, parentSku, name, variantName, category, subcategory,
        dimension, line1Text, line2Text, minQuantity, unitsPerBox,
        hideInCatalog, stock, basePrice, isActive, image,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        sku,
        cols[3]?.trim() || null,
        cols[5]?.trim() || '',
        cols[6]?.trim() || null,
        cols[1]?.trim() || '',
        cols[2]?.trim() || null,
        cols[7]?.trim() || null,
        cols[8]?.trim() || null,
        cols[10]?.trim() || null,
        parseInt(cols[9]) || null,
        parseInt(cols[12]) || null,
        cols[13]?.toUpperCase() === 'TRUE',
        parseInt(cols[14]) || 0,
        parseFloat(cols[15]) || 0,
        true,
        cols[18]?.trim() || null
      ]
    );
    imported++;
    if (imported % 10 === 0) console.log(`  ✓ ${imported} productos...`);
  } catch (err) {
    console.log(`  ❌ Fila ${i+1}: ${err.message.substring(0,60)}`);
    skipped++;
  }
}

await connection.end();
console.log(`\n✅ ${imported} productos importados, ${skipped} omitidos`);
