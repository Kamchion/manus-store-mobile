const XLSX = require('xlsx');
const { getDb } = require('./server/db');
const { products, pricingByType } = require('./drizzle/schema');
const { eq } = require('drizzle-orm');

async function populatePricing() {
  console.log('Iniciando población de precios...');
  
  const db = await getDb();
  if (!db) {
    console.error('No se pudo conectar a la base de datos');
    process.exit(1);
  }

  // Leer el archivo Excel
  const workbook = XLSX.readFile('/home/ubuntu/upload/CopiadePEPPERIFINALRESULTADO.xlsx');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const dataRows = rawData.slice(1);

  let processed = 0;
  let errors = 0;

  for (const row of dataRows) {
    const sku = row[4]; // Columna E: Codigo del articulo
    const precioCiudad = parseFloat(row[15]) || 0; // Columna P
    const precioInterior = parseFloat(row[16]) || 0; // Columna Q
    const precioEspecial = parseFloat(row[17]) || 0; // Columna R
    const cantidadMinima = row[9] || 1; // Columna J

    if (!sku) continue;

    try {
      // Buscar el producto por SKU
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.sku, sku))
        .limit(1);

      if (existingProduct.length === 0) {
        console.log(`Producto ${sku} no encontrado, saltando...`);
        continue;
      }

      const productId = existingProduct[0].id;

      // Eliminar precios existentes
      await db
        .delete(pricingByType)
        .where(eq(pricingByType.productId, productId));

      // Insertar nuevos precios
      const pricingData = [
        {
          productId: productId,
          priceType: 'ciudad',
          price: precioCiudad,
          minQuantity: cantidadMinima,
        },
        {
          productId: productId,
          priceType: 'interior',
          price: precioInterior,
          minQuantity: cantidadMinima,
        },
        {
          productId: productId,
          priceType: 'especial',
          price: precioEspecial,
          minQuantity: cantidadMinima,
        },
      ];

      await db.insert(pricingByType).values(pricingData);
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`Procesados ${processed} productos...`);
      }
    } catch (error) {
      console.error(`Error procesando ${sku}:`, error.message);
      errors++;
    }
  }

  console.log(`\nCompletado: ${processed} productos procesados, ${errors} errores`);
  process.exit(0);
}

populatePricing().catch(console.error);
