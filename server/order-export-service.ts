import PDFDocument from 'pdfkit';
import { getDb } from './db';
import { systemConfig, products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: string;
  subtotal: string;
  customText?: string | null;
  customSelect?: string | null;
  sku?: string;
  stock?: number;
  location?: string;
  image?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: Date | null;
  subtotal: string;
  tax: string;
  total: string;
  notes?: string | null;
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    companyName: string | null;
    phone: string | null;
    address: string | null;
    clientNumber: string | null;
  };
  vendor?: {
    id: string;
    name: string | null;
    username: string | null;
  };
  items: OrderItem[];
}

/**
 * Descargar imagen desde URL o leer desde archivo local
 */
async function downloadImage(imagePathOrUrl: string): Promise<Buffer | null> {
  return new Promise((resolve) => {
    try {
      // Si es una ruta local (comienza con /uploads/ o ./public/)
      if (imagePathOrUrl.startsWith('/uploads/') || imagePathOrUrl.startsWith('./public/')) {
        // Construir ruta absoluta al archivo
        const localPath = imagePathOrUrl.startsWith('/uploads/')
          ? path.join(process.cwd(), 'public', imagePathOrUrl)
          : path.join(process.cwd(), imagePathOrUrl);
        
        console.log('[PDF] Reading local image:', localPath);
        
        // Leer archivo local
        fs.readFile(localPath, (err, data) => {
          if (err) {
            console.error(`[PDF] Failed to read local image: ${err.message}`);
            resolve(null);
            return;
          }
          console.log('[PDF] Successfully read image, size:', data.length, 'bytes');
          resolve(data);
        });
      } else if (imagePathOrUrl.startsWith('http://') || imagePathOrUrl.startsWith('https://')) {
        // Es una URL, descargar por HTTP/HTTPS
        const protocol = imagePathOrUrl.startsWith('https') ? https : http;
        protocol.get(imagePathOrUrl, (response) => {
          if (response.statusCode !== 200) {
            console.error(`[PDF] Failed to download image: ${response.statusCode}`);
            resolve(null);
            return;
          }

          const chunks: Buffer[] = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () => {
            console.log('[PDF] Successfully downloaded image, size:', Buffer.concat(chunks).length, 'bytes');
            resolve(Buffer.concat(chunks));
          });
          response.on('error', () => resolve(null));
        }).on('error', (err) => {
          console.error('[PDF] Error downloading image:', err);
          resolve(null);
        });
      } else {
        console.error('[PDF] Invalid image path/URL:', imagePathOrUrl);
        resolve(null);
      }
    } catch (error) {
      console.error('[PDF] Error loading image:', error);
      resolve(null);
    }
  });
}

/**
 * Obtener información completa de productos para el pedido
 */
async function enrichOrderItems(items: OrderItem[]): Promise<OrderItem[]> {
  const db = await getDb();
  if (!db) return items;

  const enrichedItems: OrderItem[] = [];

  for (const item of items) {
    try {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      enrichedItems.push({
        ...item,
        sku: product?.sku || item.sku || '-',
        stock: product?.stock || item.stock || 0,
        location: product?.location || '-',
        image: product?.image || '',
      });
    } catch (error) {
      console.error(`Error enriching item ${item.productId}:`, error);
      enrichedItems.push(item);
    }
  }

  return enrichedItems;
}

/**
 * Generar PDF con diseño exacto del Excel
 */
export async function generateOptimizedOrderPDF(order: Order, usePreview = false): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtener configuración de nombres de columnas y opciones de visualización
      const db = await getDb();
      let columnNames = {
        image: 'imagen',
        location: 'ubicación',
        code: 'codigo',
        quantity: 'cantidad',
        description: 'descripcion',
        inventory: 'inventario',
        customText: 'custom textbox',
        customSelect: 'customselect',
        price: 'precio unitario',
      };
      let showTotals = true; // Por defecto mostrar totales
      let showImage = false;
      let showSKU = true;
      let showProduct = true;
      let showQuantity = true;
      let showPrice = true;
      let showSubtotal = true;
      
      if (db) {
        try {
          const configKey = usePreview ? 'report_config_preview' : 'report_config';
          const [config] = await db
            .select()
            .from(systemConfig)
            .where(eq(systemConfig.key, configKey))
            .limit(1);
          
          if (config?.value) {
            const parsedConfig = JSON.parse(config.value);
            console.log('[PDF] Full parsedConfig.pdf:', JSON.stringify(parsedConfig.pdf, null, 2));
            if (parsedConfig.pdf) {
              columnNames = {
                image: parsedConfig.pdf.columnNameImage || columnNames.image,
                location: parsedConfig.pdf.columnNameLocation || columnNames.location,
                code: parsedConfig.pdf.columnNameCode || columnNames.code,
                quantity: parsedConfig.pdf.columnNameQuantity || columnNames.quantity,
                description: parsedConfig.pdf.columnNameDescription || columnNames.description,
                inventory: parsedConfig.pdf.columnNameInventory || columnNames.inventory,
                customText: parsedConfig.pdf.columnNameCustomText || columnNames.customText,
                customSelect: parsedConfig.pdf.columnNameCustomSelect || columnNames.customSelect,
                price: parsedConfig.pdf.columnNamePrice || columnNames.price,
              };
              // Leer configuración de mostrar totales
              if (parsedConfig.pdf.showTotals !== undefined) {
                showTotals = parsedConfig.pdf.showTotals;
                console.log('[PDF] showTotals from config:', showTotals);
              } else {
                console.log('[PDF] showTotals not found in config, using default:', showTotals);
              }
              // Leer configuración de columnas a mostrar
              if (parsedConfig.pdf.showImage !== undefined) showImage = parsedConfig.pdf.showImage;
              if (parsedConfig.pdf.showSKU !== undefined) showSKU = parsedConfig.pdf.showSKU;
              if (parsedConfig.pdf.showProduct !== undefined) showProduct = parsedConfig.pdf.showProduct;
              if (parsedConfig.pdf.showQuantity !== undefined) showQuantity = parsedConfig.pdf.showQuantity;
              if (parsedConfig.pdf.showPrice !== undefined) showPrice = parsedConfig.pdf.showPrice;
              if (parsedConfig.pdf.showSubtotal !== undefined) showSubtotal = parsedConfig.pdf.showSubtotal;
              console.log('[PDF] Column visibility:', { showImage, showSKU, showProduct, showQuantity, showPrice, showSubtotal });
            }
          }
        } catch (error) {
          console.error('[PDF] Error loading column names config:', error);
        }
      }
      
      // Enriquecer items con información de productos
      const enrichedItems = await enrichOrderItems(order.items);
      
      const chunks: Buffer[] = [];
      
      // Configuración de página A4
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
        },
      });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = 595.28; // A4 width in points
      const margin = 10;
      const usableWidth = pageWidth - (margin * 2);

      // Convertir anchos de Excel a puntos (1 unidad Excel ≈ 7.5 puntos)
      const colWidths = {
        image: 19.71 * 3.5,      // ~69pt
        location: 12.57 * 3.5,   // ~44pt
        code: 11.43 * 3.5,       // ~40pt
        quantity: 8.57 * 3.5,    // ~30pt
        description: 57.86 * 3.5, // ~202pt
        inventory: 10.71 * 3.5,  // ~37pt
        customText: 13.0 * 3.5,  // ~45pt
        customSelect: 13.0 * 3.5, // ~45pt
        price: 16.0 * 3.5,       // ~56pt
      };

      let currentY = margin;

      // ===== FILA 1: LOGO IMPORKAM (altura 30pt) =====
      const logoHeight = 30;
      doc.fontSize(18).font('Helvetica-Bold');
      doc.text('IMPORKAM', margin, currentY + 5, { 
        align: 'center', 
        width: usableWidth 
      });
      currentY += logoHeight;

      // ===== FILAS 2-5: INFORMACIÓN EN DOS COLUMNAS (altura 10pt cada una) =====
      doc.fontSize(8).font('Helvetica');
      
      const col1X = margin;
      const col2X = margin + colWidths.image + colWidths.location + colWidths.code + colWidths.quantity + colWidths.description;
      const col1Width = col2X - margin - 10;
      const col2Width = usableWidth - col1Width - 10;

      // Fila 2
      let infoY = currentY;
      doc.font('Helvetica-Bold').text('ID y Nombre Vendedor:', col1X, infoY, { continued: true });
      doc.font('Helvetica').text(` ${order.vendor?.id || 'N/A'} - ${order.vendor?.name || order.vendor?.username || 'N/A'}`);
      doc.font('Helvetica-Bold').text('ID del pedido:', col2X, infoY, { continued: true });
      doc.font('Helvetica').text(` ${order.orderNumber}`);
      infoY += 10;

      // Fila 3
      doc.font('Helvetica-Bold').text('Cliente:', col1X, infoY, { continued: true });
      doc.font('Helvetica').text(` ${order.user?.companyName || order.user?.name || order.user?.username || 'N/A'}`);
      doc.font('Helvetica-Bold').text('ID del Cliente:', col2X, infoY, { continued: true });
      doc.font('Helvetica').text(` ${order.user?.clientNumber || order.user?.id || 'N/A'}`);
      infoY += 10;

      // Fila 4
      doc.font('Helvetica-Bold').text('Direccion:', col1X, infoY, { continued: true });
      doc.font('Helvetica').text(` ${order.user?.address || 'N/A'}`);
      doc.font('Helvetica-Bold').text('Vendedor:', col2X, infoY, { continued: true });
      doc.font('Helvetica').text(` ${order.vendor?.name || order.vendor?.username || 'N/A'}`);
      infoY += 10;

      // Fila 5
      doc.font('Helvetica-Bold').text('observacion:', col1X, infoY, { continued: true });
      doc.font('Helvetica').text(` ${order.notes || 'Ninguna'}`);
      infoY += 10;

      // Fila 6: Espacio vacío
      infoY += 5;
      currentY = infoY;

      // ===== FILA 7: ENCABEZADOS DE TABLA (altura 10pt) =====
      doc.fontSize(7).font('Helvetica-Bold');
      let headerX = margin;
      const headerY = currentY;

      const headers = [
        { text: columnNames.image, width: colWidths.image },
        { text: columnNames.location, width: colWidths.location },
        { text: columnNames.code, width: colWidths.code },
        { text: columnNames.quantity, width: colWidths.quantity },
        { text: columnNames.description, width: colWidths.description },
        { text: columnNames.inventory, width: colWidths.inventory },
        { text: columnNames.customText, width: colWidths.customText },
        { text: columnNames.customSelect, width: colWidths.customSelect },
        { text: columnNames.price, width: colWidths.price },
      ];

      headers.forEach((header) => {
        doc.text(header.text, headerX, headerY, { width: header.width, align: 'center' });
        headerX += header.width;
      });

      currentY += 10;

      // Línea bajo encabezados
      doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
      currentY += 2;

      // ===== FILAS 8+: PRODUCTOS (altura 50pt cada una) =====
      const rowHeight = 50;
      const imageSize = 45; // Tamaño de imagen dentro de la celda
      
      doc.font('Helvetica').fontSize(7);

      for (const item of enrichedItems) {
        // Verificar si hay espacio en la página
        if (currentY + rowHeight > 841.89 - margin - 30) {
          doc.addPage();
          currentY = margin;
        }

        let colX = margin;
        const rowY = currentY;

        // Columna 1: Imagen
        if (item.image && item.image.trim() !== '') {
          try {
            const imageBuffer = await downloadImage(item.image);
            if (imageBuffer) {
              doc.image(imageBuffer, colX + 2, rowY + 2, {
                fit: [colWidths.image - 4, imageSize],
                align: 'center',
                valign: 'center',
              });
            } else {
              // Si falla la descarga, mostrar placeholder
              doc.rect(colX + 2, rowY + 2, colWidths.image - 4, imageSize).stroke();
              doc.fontSize(6).text('Sin img', colX, rowY + (imageSize / 2), {
                width: colWidths.image,
                align: 'center',
              });
              doc.fontSize(8);
            }
          } catch (error) {
            console.error('Error loading image:', error);
            doc.rect(colX + 2, rowY + 2, colWidths.image - 4, imageSize).stroke();
          }
        } else {
          // Sin imagen
          doc.rect(colX + 2, rowY + 2, colWidths.image - 4, imageSize).stroke();
        }
        colX += colWidths.image;

        // Columna 2: Ubicación
        doc.text(item.location || '-', colX + 2, rowY + 5, { width: colWidths.location - 4, align: 'center' });
        colX += colWidths.location;

        // Columna 3: Código
        doc.text(item.sku || '-', colX + 2, rowY + 5, { width: colWidths.code - 4, align: 'center' });
        colX += colWidths.code;

        // Columna 4: Cantidad
        doc.text(item.quantity.toString(), colX + 2, rowY + 5, { width: colWidths.quantity - 4, align: 'center' });
        colX += colWidths.quantity;

        // Columna 5: Descripción
        doc.text(item.productName, colX + 2, rowY + 5, { width: colWidths.description - 4, align: 'left' });
        colX += colWidths.description;

        // Columna 6: Inventario
        doc.text(item.stock?.toString() || '0', colX + 2, rowY + 5, { width: colWidths.inventory - 4, align: 'center' });
        colX += colWidths.inventory;

        // Columna 7: Custom Text
        doc.text(item.customText || '-', colX + 2, rowY + 5, { width: colWidths.customText - 4, align: 'center' });
        colX += colWidths.customText;

        // Columna 8: Custom Select
        doc.text(item.customSelect || '-', colX + 2, rowY + 5, { width: colWidths.customSelect - 4, align: 'center' });
        colX += colWidths.customSelect;

        // Columna 9: Precio Unitario
        doc.text(`$${parseFloat(item.pricePerUnit).toFixed(2)}`, colX + 2, rowY + 5, {
          width: colWidths.price - 4,
          align: 'right',
        });

        currentY += rowHeight;

        // Línea separadora muy fina
        doc.strokeColor('#CCCCCC').lineWidth(0.5);
        doc.moveTo(margin, currentY).lineTo(pageWidth - margin, currentY).stroke();
        doc.strokeColor('#000000').lineWidth(1);
      }

      // ===== TOTALES =====
      console.log('[PDF] Rendering totals section, showTotals =', showTotals);
      if (showTotals) {
        currentY += 10;
        doc.fontSize(10).font('Helvetica-Bold');
        const totalsX = pageWidth - margin - 150;
        
        doc.text(`Subtotal:`, totalsX, currentY, { width: 80, align: 'right' });
        doc.text(`$${parseFloat(order.subtotal).toFixed(2)}`, totalsX + 85, currentY, { width: 65, align: 'right' });
        currentY += 15;

        if (parseFloat(order.tax) > 0) {
          doc.text(`Impuesto:`, totalsX, currentY, { width: 80, align: 'right' });
          doc.text(`$${parseFloat(order.tax).toFixed(2)}`, totalsX + 85, currentY, { width: 65, align: 'right' });
          currentY += 15;
        }

        doc.fontSize(12);
        doc.text(`TOTAL:`, totalsX, currentY, { width: 80, align: 'right' });
        doc.text(`$${parseFloat(order.total).toFixed(2)}`, totalsX + 85, currentY, { width: 65, align: 'right' });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Excel for order (mantiene compatibilidad con sistema anterior)
 */

interface ExcelConfig {
  showImage: boolean;
  showSKU: boolean;
  showProduct: boolean;
  showQuantity: boolean;
  showPrice: boolean;
  showSubtotal: boolean;
  showStock: boolean;
  showCategory: boolean;
  showCustomerInfo: boolean;
  showTotals: boolean;
  headerColor: string;
  alternateRows: boolean;
}

/**
 * Obtener configuración de reportes desde la base de datos
 */
async function getExcelConfig(): Promise<ExcelConfig> {
  const db = await getDb();
  if (!db) {
    return getDefaultExcelConfig();
  }

  try {
    const [config] = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'report_config'))
      .limit(1);

    if (config && config.value) {
      const parsed = JSON.parse(config.value);
      return parsed.excel || getDefaultExcelConfig();
    }
  } catch (error) {
    console.error('[Excel] Error reading config:', error);
  }

  return getDefaultExcelConfig();
}

/**
 * Configuración por defecto de Excel
 */
function getDefaultExcelConfig(): ExcelConfig {
  return {
    showImage: false,
    showSKU: true,
    showProduct: true,
    showQuantity: true,
    showPrice: true,
    showSubtotal: true,
    showStock: true,
    showCategory: false,
    showCustomerInfo: true,
    showTotals: true,
    headerColor: 'FFE0E0E0',
    alternateRows: false,
  };
}

export async function generateOrderExcel(order: Order): Promise<Buffer> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pedido');
  
  // Leer configuración
  const config = await getExcelConfig();
  console.log('[Excel] Using config:', config);
  
  // Enriquecer items con información de productos
  const enrichedItems = await enrichOrderItems(order.items);
  
  // Header
  let maxCol = 'I';
  worksheet.mergeCells(`A1:${maxCol}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'IMPORKAM';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 60;
  
  // Order Info (dos columnas) - solo si showCustomerInfo está habilitado
  let currentRow = 2;
  if (config.showCustomerInfo) {
    worksheet.getCell(`A${currentRow}`).value = 'ID y Nombre Vendedor:';
    worksheet.getCell(`B${currentRow}`).value = `${order.vendor?.id || 'N/A'} - ${order.vendor?.name || order.vendor?.username || 'N/A'}`;
    worksheet.getCell(`F${currentRow}`).value = 'ID del pedido:';
    worksheet.getCell(`G${currentRow}`).value = order.orderNumber;
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'Cliente:';
    worksheet.getCell(`B${currentRow}`).value = order.user?.companyName || order.user?.name || order.user?.username || 'N/A';
    worksheet.getCell(`F${currentRow}`).value = 'ID del Cliente:';
    worksheet.getCell(`G${currentRow}`).value = order.user?.clientNumber || order.user?.id || 'N/A';
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'Direccion:';
    worksheet.getCell(`B${currentRow}`).value = order.user?.address || 'N/A';
    worksheet.getCell(`F${currentRow}`).value = 'Vendedor:';
    worksheet.getCell(`G${currentRow}`).value = order.vendor?.name || order.vendor?.username || 'N/A';
    currentRow++;
    worksheet.getCell(`A${currentRow}`).value = 'observacion:';
    worksheet.getCell(`B${currentRow}`).value = order.notes || 'Ninguna';
    currentRow += 2;
  }
  
  // Construir headers dinámicamente según configuración
  const headers: string[] = [];
  const columnWidths: number[] = [];
  
  if (config.showImage) {
    headers.push('imagen');
    columnWidths.push(19.71);
  }
  headers.push('ubicación'); // Siempre mostrar ubicación
  columnWidths.push(12.57);
  
  if (config.showSKU) {
    headers.push('codigo');
    columnWidths.push(11.43);
  }
  if (config.showQuantity) {
    headers.push('cantidad');
    columnWidths.push(8.57);
  }
  if (config.showProduct) {
    headers.push('descripcion');
    columnWidths.push(57.86);
  }
  if (config.showStock) {
    headers.push('inventario');
    columnWidths.push(10.71);
  }
  
  // Siempre mostrar custom fields
  headers.push('custom textbox');
  columnWidths.push(13.0);
  headers.push('customselect');
  columnWidths.push(13.0);
  
  if (config.showPrice) {
    headers.push('precio unitario');
    columnWidths.push(16.0);
  }
  
  // Table Headers
  const headerRow = worksheet.getRow(currentRow);
  headerRow.values = headers;
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: config.headerColor || 'FFE0E0E0' }
  };
  currentRow++;
  
  // Items
  enrichedItems.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    const values: any[] = [];
    
    if (config.showImage) {
      values.push('IMG'); // Placeholder para imagen
    }
    values.push(item.location || '-');
    
    if (config.showSKU) {
      values.push(item.sku || '-');
    }
    if (config.showQuantity) {
      values.push(item.quantity);
    }
    if (config.showProduct) {
      values.push(item.productName);
    }
    if (config.showStock) {
      values.push(item.stock || 0);
    }
    
    values.push(item.customText || '-');
    values.push(item.customSelect || '-');
    
    if (config.showPrice) {
      values.push(parseFloat(item.pricePerUnit));
    }
    
    row.values = values;
    
    // Alternar colores de fila si está habilitado
    if (config.alternateRows && index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };
    }
    
    currentRow++;
  });
  
  // Aplicar anchos de columna
  columnWidths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
  
  // Generate buffer
  return await workbook.xlsx.writeBuffer() as Buffer;
}

/**
 * Alias para compatibilidad con código existente
 */
export async function generateOrderPDF(order: Order, usePreview = false): Promise<Buffer> {
  return generateOptimizedOrderPDF(order, usePreview);
}

