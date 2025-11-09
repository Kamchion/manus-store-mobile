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
  const sku = cols[4]?.trim(); // E: Codigo del articulo
  if (!sku) { skipped++; continue; }
  
  const parentSku = cols[3]?.trim() || null; // D: Código del modelo (puede estar vacío)
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
        parentSku, // Puede ser NULL si es producto padre/independiente
        cols[5]?.trim() || '', // F: Descripcion
        cols[6]?.trim() || null, // G: Descripción del modelo
        cols[1]?.trim() || '', // B: Categoría principal
        cols[2]?.trim() || null, // C: subcategoria
        cols[7]?.trim() || null, // H: Dimensión 1
        cols[8]?.trim() || null, // I: linea1
        cols[10]?.trim() || null, // K: linea2
        parseInt(cols[9]) || null, // J: Cantidad minima
        parseInt(cols[12]) || null, // M: cant*cja
        cols[13]?.toUpperCase() === 'TRUE', // N: Ocultar en catalogo
        parseInt(cols[14]) || 0, // O: STOCK
        parseFloat(cols[15]) || 0, // P: ciudad (precio base)
        true,
        cols[18]?.trim() || null // S: Imagenes
      ]
    );
    imported++;
    if (imported % 10 === 0) console.log(`  ✓ ${imported} productos...`);
  } catch (err) {
    console.log(`  ❌ Fila ${i+1} (${sku}): ${err.message.substring(0,60)}`);
    skipped++;
  }
}

// Contar padres e hijos
const [parents] = await connection.query('SELECT COUNT(*) as count FROM products WHERE parentSku IS NULL');
const [children] = await connection.query('SELECT COUNT(*) as count FROM products WHERE parentSku IS NOT NULL');

await connection.end();

console.log(`\n✅ Importación completada:`);
console.log(`  📦 ${imported} productos importados`);
console.log(`  📁 ${parents[0].count} productos padre/independientes`);
console.log(`  🔗 ${children[0].count} variantes (hijos)`);
console.log(`  ⚠️  ${skipped} filas omitidas`);
