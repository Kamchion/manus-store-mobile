import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Convertir Excel a CSV usando Python
console.log('📖 Convirtiendo Excel a CSV...');
await execAsync(`python3 << 'PYTHON'
import openpyxl
import csv

wb = openpyxl.load_workbook('/home/ubuntu/upload/CopiadePEPPERIFINALRESULTADO.xlsx')
ws = wb.active

with open('/tmp/products.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in ws.iter_rows(values_only=True):
        writer.writerow(row)
print("CSV created")
PYTHON
`);

// Leer CSV
const csvContent = readFileSync('/tmp/products.csv', 'utf-8');
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

console.log('🔌 Conectando a la base de datos...');
const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
};

const connection = await createConnection(config);

// Limpiar tabla products
console.log('🗑️  Limpiando tabla products...');
await connection.query('DELETE FROM products');

console.log('📥 Importando productos...\n');
let imported = 0;
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const values = lines[i].split(',');
  
  const sku = values[4]?.trim(); // E: Codigo del articulo
  if (!sku) {
    skipped++;
    continue;
  }
  
  const product = {
    sku: sku,
    parentSku: values[3]?.trim() || null, // D: Código del modelo
    name: values[5]?.trim() || '', // F: Descripcion
    variantName: values[6]?.trim() || null, // G: Descripción del modelo
    category: values[1]?.trim() || '', // B: Categoría principal
    subcategory: values[2]?.trim() || null, // C: subcategoria
    dimension: values[7]?.trim() || null, // H: Dimensión 1
    line1Text: values[8]?.trim() || null, // I: linea1
    line2Text: values[10]?.trim() || null, // K: linea2
    minQuantity: parseInt(values[9]) || null, // J: Cantidad minima
    unitsPerBox: parseInt(values[12]) || null, // M: cant*cja
    hideInCatalog: values[13]?.toUpperCase() === 'TRUE', // N: Ocultar en catalogo
    stock: parseInt(values[14]) || 0, // O: STOCK
    precioCiudad: parseFloat(values[15]) || null, // P: ciudad
    precioInterior: parseFloat(values[16]) || null, // Q: interior
    precioEspecial: parseFloat(values[17]) || null, // R: revendedor
    image: values[18]?.trim() || null, // S: Imagenes
    isActive: true,
    basePrice: parseFloat(values[15]) || 0 // Usar precio ciudad como base
  };
  
  try {
    await connection.query(
      `INSERT INTO products (
        sku, parentSku, name, variantName, category, subcategory,
        dimension, line1Text, line2Text, minQuantity, unitsPerBox,
        hideInCatalog, stock, basePrice, isActive, image,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        product.sku, product.parentSku, product.name, product.variantName,
        product.category, product.subcategory, product.dimension,
        product.line1Text, product.line2Text, product.minQuantity,
        product.unitsPerBox, product.hideInCatalog, product.stock,
        product.basePrice, product.isActive, product.image
      ]
    );
    imported++;
    if (imported % 10 === 0) {
      console.log(`  ✓ Importados ${imported} productos...`);
    }
  } catch (err) {
    console.log(`  ❌ Error en fila ${i + 1}: ${err.message}`);
    skipped++;
  }
}

// Actualizar precios en productVariants si existen
console.log('\n💰 Actualizando precios en productVariants...');
const [variants] = await connection.query('SELECT id, sku FROM productVariants');
for (const variant of variants) {
  const [products] = await connection.query(
    'SELECT precioCiudad, precioInterior, precioEspecial FROM products WHERE sku = ?',
    [variant.sku]
  );
  if (products.length > 0) {
    const p = products[0];
    await connection.query(
      `UPDATE productVariants 
       SET basePrice = ?, precioCiudad = ?, precioInterior = ?, precioEspecial = ?
       WHERE id = ?`,
      [p.precioCiudad, p.precioCiudad, p.precioInterior, p.precioEspecial, variant.id]
    );
  }
}

await connection.end();

console.log(`\n✅ Importación completada:`);
console.log(`  📦 ${imported} productos importados`);
console.log(`  ⚠️  ${skipped} filas omitidas`);
