import XLSX from 'xlsx';
import { getDb } from './db';
import { products, pricingByType, productVariants } from '../drizzle/schema';
import { nanoid } from 'nanoid';
import { eq, and } from 'drizzle-orm';

interface ExcelRow {
  orden: string | null;
  categoria: string | null;
  subcategoria: string | null;
  codigoModelo: string | null;
  codigoArticulo: string;
  descripcion: string;
  descripcionModelo: string | null;
  dimension: string | null;
  linea1: string | null;
  cantidadMinima: number | null;
  linea2: string | null;
  itemUPC: string | null;
  cantPorCaja: number | null;
  ocultarCatalogo: string | null;
  stock: number;
  precioCiudad: number;
  precioInterior: number;
  precioEspecial: number;
  imageName: string | null;
}

interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string }>;
}

export async function importProductsFromExcel(filePath: string): Promise<ImportResult> {
  const db = await getDb();
  const result: ImportResult = {
    success: true,
    message: '',
    created: 0,
    updated: 0,
    errors: [],
  };

  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Saltar la fila de encabezados (fila 1)
    const dataRows = rawData.slice(1) as any[][];
    
    console.log(`Procesando ${dataRows.length} filas del Excel...`);
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 porque empezamos en fila 2 (después del header)
      
      try {
        // Extraer datos de las columnas (A-S = índices 0-18)
        const excelRow: ExcelRow = {
          orden: row[0] || null,
          categoria: row[1] || null,
          subcategoria: row[2] || null,
          codigoModelo: row[3] || null, // parentSku
          codigoArticulo: row[4], // SKU
          descripcion: row[5], // nombre
          descripcionModelo: row[6] || null, // variantName
          dimension: row[7] || null,
          linea1: row[8] || null,
          cantidadMinima: row[9] || null,
          linea2: row[10] || null,
          itemUPC: row[11] || null, // location
          cantPorCaja: row[12] || null,
          ocultarCatalogo: row[13] || null,
          stock: row[14] || 0,
          precioCiudad: row[15] || 0,
          precioInterior: row[16] || 0,
          precioEspecial: row[17] || 0,
          imageName: row[18] || null,
        };
        
        // Validar campos obligatorios
        console.log(`Fila ${rowNumber}: SKU=${excelRow.codigoArticulo}, Nombre=${excelRow.descripcion}`);
        if (!excelRow.codigoArticulo || !excelRow.descripcion) {
          console.error(`Fila ${rowNumber}: Falta SKU o descripción`);
          result.errors.push({
            row: rowNumber,
            error: 'Falta SKU o descripción',
          });
          continue;
        }
        
        // Determinar si ocultar en catálogo
        // Las variantes ahora respetan el valor de ocultarCatalogo del Excel
        const isVariant = excelRow.codigoModelo && excelRow.codigoModelo !== excelRow.codigoArticulo;
        const hideInCatalog = excelRow.ocultarCatalogo === 'TRUE';
        
        // Verificar si el producto ya existe
        const existingProduct = await db
          .select()
          .from(products)
          .where(eq(products.sku, excelRow.codigoArticulo))
          .limit(1);
        
        // Generate R2 image URL automatically based on SKU
        let imageUrl = null;
        const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-f12deb971fd349be80802a45b2296af3.r2.dev';
        const r2ImagePath = 'ikam-image/products/images';
        
        // Always generate R2 URL using SKU + .jpg
        imageUrl = `${r2PublicUrl}/${r2ImagePath}/${excelRow.codigoArticulo}.jpg`;
        console.log(`✓ Generated R2 URL for SKU ${excelRow.codigoArticulo}: ${imageUrl}`);
        
        const productData = {
          sku: excelRow.codigoArticulo,
          name: excelRow.descripcion,
          description: excelRow.descripcionModelo || '',
          category: excelRow.categoria || 'Sin categoría',
          subcategory: excelRow.subcategoria || null,
          basePrice: excelRow.precioCiudad.toString(),
          stock: excelRow.stock,
          isActive: true,
          displayOrder: excelRow.orden || null,
          parentSku: excelRow.codigoModelo || null,
          variantName: excelRow.dimension || null, // Use dimension (column H) as variant display name
          dimension: excelRow.dimension || null,
          line1Text: excelRow.linea1 || null,
          minQuantity: excelRow.cantidadMinima || 1,
          line2Text: excelRow.linea2 || null,
          location: excelRow.itemUPC || null,
          unitsPerBox: excelRow.cantPorCaja || 0,
          hideInCatalog: hideInCatalog,
          image: imageUrl,
        };
        
        let productId: string;
        
        if (existingProduct.length > 0) {
          // Actualizar producto existente
          productId = existingProduct[0].id;
          await db
            .update(products)
            .set(productData)
            .where(eq(products.id, productId));
          result.updated++;
        } else {
          // Crear nuevo producto
          productId = `prod_${nanoid()}`;
          await db.insert(products).values({
            id: productId,
            ...productData,
          });
          result.created++;
        }
        
        // Actualizar precios por tipo
        // Eliminar precios existentes
        await db
          .delete(pricingByType)
          .where(eq(pricingByType.productId, productId));
        
        // Insertar nuevos precios (uno por uno para evitar problemas con Drizzle)
        // Convertir a string con 2 decimales para compatibilidad con DECIMAL(10,2)
        await db.insert(pricingByType).values({
          productId: productId,
          priceType: 'ciudad' as const,
          price: Number(excelRow.precioCiudad).toFixed(2),
          minQuantity: excelRow.cantidadMinima || 1,
        });
        
        await db.insert(pricingByType).values({
          productId: productId,
          priceType: 'interior' as const,
          price: Number(excelRow.precioInterior).toFixed(2),
          minQuantity: excelRow.cantidadMinima || 1,
        });
        
        await db.insert(pricingByType).values({
          productId: productId,
          priceType: 'especial' as const,
          price: Number(excelRow.precioEspecial).toFixed(2),
          minQuantity: excelRow.cantidadMinima || 1,
        });
        
        // Handle product variants
        // If codigo modelo (D) != SKU (E), this is a variant
        // The parent is the product where SKU (E) == this product's codigo modelo (D)
        if (excelRow.codigoModelo && excelRow.codigoModelo !== excelRow.codigoArticulo) {
          // This is a variant product, find the parent product by matching parent's SKU with this codigo modelo
          const parentProduct = await db
            .select({ id: products.id, sku: products.sku })
            .from(products)
            .where(eq(products.sku, excelRow.codigoModelo))
            .limit(1);
          
          if (parentProduct.length > 0) {
            const parentProductId = parentProduct[0].id;
            
            // Delete existing variant entry if any
            await db
              .delete(productVariants)
              .where(
                and(
                  eq(productVariants.productId, parentProductId),
                  eq(productVariants.sku, excelRow.codigoArticulo)
                )
              );
            
            // Create variant entry
            const variantId = `var_${nanoid()}`;
            await db.insert(productVariants).values({
              id: variantId,
              productId: parentProductId,
              variantType: excelRow.descripcionModelo || 'Variante',
              variantValue: excelRow.dimension || excelRow.codigoArticulo,
              sku: excelRow.codigoArticulo,
              stock: excelRow.stock || 0,
              basePrice: excelRow.precioCiudad.toString(),
              precioCiudad: excelRow.precioCiudad.toString(),
              precioInterior: excelRow.precioInterior.toString(),
              precioEspecial: excelRow.precioEspecial.toString(),
              isActive: 1,
            });
            
            console.log(`✓ Variant linked: ${excelRow.codigoArticulo} (child) → ${parentProduct[0].sku} (parent)`);
          } else {
            console.warn(`⚠️ Parent product not found for variant ${excelRow.codigoArticulo} (looking for parent SKU: ${excelRow.codigoModelo}). Make sure parent product is imported first.`);
          }
        }
        
      } catch (error: any) {
        console.error(`Error en fila ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          error: error.message || 'Error desconocido',
        });
      }
    }
    
    // Delete products that are not in the Excel file
    console.log('🗑️ Eliminando productos que no están en el Excel...');
    const importedSkus = dataRows
      .map(row => row[4]) // Column E (SKU)
      .filter(sku => sku); // Remove empty values
    
    if (importedSkus.length > 0) {
      const { sql, not, inArray } = await import('drizzle-orm');
      
      // Get all products not in the imported list
      const productsToDelete = await db
        .select({ id: products.id, sku: products.sku })
        .from(products)
        .where(not(inArray(products.sku, importedSkus)));
      
      if (productsToDelete.length > 0) {
        console.log(`Eliminando ${productsToDelete.length} productos no incluidos en el Excel...`);
        
        for (const product of productsToDelete) {
          // Delete related pricing data first
          await db.delete(pricingByType).where(eq(pricingByType.productId, product.id));
          // Delete the product
          await db.delete(products).where(eq(products.id, product.id));
        }
        
        result.message = `Importación completada: ${result.created} creados, ${result.updated} actualizados, ${productsToDelete.length} eliminados, ${result.errors.length} errores`;
      } else {
        result.message = `Importación completada: ${result.created} creados, ${result.updated} actualizados, ${result.errors.length} errores`;
      }
    } else {
      result.message = `Importación completada: ${result.created} creados, ${result.updated} actualizados, ${result.errors.length} errores`;
    }
    
    result.success = result.errors.length === 0;
    
  } catch (error: any) {
    result.success = false;
    result.message = `Error al procesar el archivo: ${error.message}`;
  }
  
  return result;
}

// Función para generar plantilla Excel con el formato correcto
export function generateExcelTemplate(): XLSX.WorkBook {
  const headers = [
    'orden',
    'Categoría principal',
    'subcategoria',
    'Código del modelo',
    'Codigo del articulo',
    'Descripcion',
    'Descripción del modelo',
    'Dimensión 1',
    'linea1',
    'Cantidad minima',
    'linea2',
    'ItemUPC',
    'cant*cja',
    'Ocultar en catalogo',
    'STOCK',
    'ciudad',
    'interior',
    'especial',
  ];
  
  const exampleData = [
    [
      'A0001',
      'BATERIA',
      'TIENDA',
      null,
      'F002103',
      'BATERIA ALKALINA TROEN D 2pcs',
      null,
      null,
      null,
      null,
      '',
      '',
      96,
      'FALSE',
      172,
      2.38,
      2.5,
      2.6656,
    ],
    [
      'A0002',
      'BATERIA',
      'TIENDA',
      null,
      'F002102',
      'BATERIA ALKALINA TROEN AAA 12pqte',
      null,
      null,
      null,
      12,
      '',
      '',
      240,
      'FALSE',
      20,
      8.25,
      8.65,
      9.24,
    ],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exampleData]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  return workbook;
}


/**
 * Exporta todos los productos a formato Excel
 */
export async function exportProductsToExcel(): Promise<Buffer> {
  const database = await getDb();
  if (!database) {
    throw new Error("No se pudo conectar a la base de datos");
  }
  
  // Obtener todos los productos
  const allProducts = await database
    .select()
    .from(products);
  
  // Obtener precios para cada producto
  const productsWithPrices = await Promise.all(
    allProducts.map(async (product) => {
      const prices = await database
        .select()
        .from(pricingByType)
        .where(eq(pricingByType.productId, product.id));
      
      const precioCiudad = prices.find(p => p.priceType === 'ciudad')?.price || 0;
      const precioInterior = prices.find(p => p.priceType === 'interior')?.price || 0;
      const precioEspecial = prices.find(p => p.priceType === 'especial')?.price || 0;
      
      return {
        ...product,
        precioCiudad,
        precioInterior,
        precioEspecial,
      };
    })
  );
  
  // Preparar datos para Excel
  const headers = [
    'Orden',
    'Categoría',
    'Subcategoría',
    'Código del Modelo',
    'SKU',
    'Nombre',
    'Nombre Variante',
    'Dimensión',
    'Línea 1',
    'Cantidad Mínima',
    'Línea 2',
    'Ubicación',
    'Unidades/Caja',
    'Visible',
    'Stock',
    'Precio Ciudad',
    'Precio Interior',
    'Precio Especial',
  ];
  
  const data = [
    headers,
    ...productsWithPrices.map(product => [
      product.orden || '',
      product.categoria || '',
      product.subcategoria || '',
      product.parentSku || '',
      product.sku || '',
      product.nombre || '',
      product.variantName || '',
      product.dimension || '',
      product.linea1 || '',
      product.cantidadMinima || '',
      product.linea2 || '',
      product.itemUPC || '',
      product.cantPorCaja || '',
      product.ocultarCatalogo === 'TRUE' ? 'FALSE' : 'TRUE', // Invertir porque ocultarCatalogo es inverso a Visible
      product.stock || 0,
      product.precioCiudad || 0,
      product.precioInterior || 0,
      product.precioEspecial || 0,
    ]),
  ];
  
  // Crear workbook y worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
  
  // Generar buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

