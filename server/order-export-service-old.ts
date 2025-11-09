import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { getDb } from './db';
import { systemConfig } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface OrderItem {
  productName: string;
  quantity: number;
  pricePerUnit: string;
  subtotal: string;
  sku?: string;
  stock?: number;
  category?: string;
}

interface Order {
  orderNumber: string;
  createdAt: Date | null;
  subtotal: string;
  tax: string;
  total: string;
  user?: {
    name: string | null;
    email: string | null;
    companyName: string | null;
    phone: string | null;
    address: string | null;
  };
  items: OrderItem[];
}

interface PDFConfig {
  showImage: boolean;
  showSKU: boolean;
  showProduct: boolean;
  showQuantity: boolean;
  showPrice: boolean;
  showSubtotal: boolean;
  columnWidthSKU: number;
  columnWidthProduct: number;
  columnWidthQuantity: number;
  columnWidthPrice: number;
  columnWidthSubtotal: number;
  pageSize: 'A4' | 'LETTER' | 'LEGAL';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  imageWidth: number;
  imageHeight: number;
  fontSize: number;
  lineSpacing: number;
  showCustomerInfo: boolean;
  showClientId: boolean;
  showCompanyName: boolean;
  showContactPerson: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showAddress: boolean;
  showHeader: boolean;
  showFooter: boolean;
  headerText: string;
  footerText: string;
}

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
 * Get report configuration from database
 */
async function getReportConfig(usePreview = false): Promise<{ pdf: PDFConfig; excel: ExcelConfig }> {
  const db = await getDb();
  if (!db) {
    return getDefaultConfig();
  }

  try {
    // Check for preview config first if requested
    if (usePreview) {
      const previewResult = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, 'report_config_preview'))
        .limit(1);

      if (previewResult.length > 0 && previewResult[0].value) {
        return JSON.parse(previewResult[0].value);
      }
    }

    const result = await db
      .select()
      .from(systemConfig)
      .where(eq(systemConfig.key, 'report_config'))
      .limit(1);

    if (result.length > 0 && result[0].value) {
      return JSON.parse(result[0].value);
    }
  } catch (error) {
    console.error('Error loading report config:', error);
  }

  return getDefaultConfig();
}

/**
 * Get default configuration
 */
function getDefaultConfig(): { pdf: PDFConfig; excel: ExcelConfig } {
  return {
    pdf: {
      showImage: false,
      showSKU: true,
      showProduct: true,
      showQuantity: true,
      showPrice: true,
      showSubtotal: true,
      columnWidthSKU: 80,
      columnWidthProduct: 200,
      columnWidthQuantity: 60,
      columnWidthPrice: 80,
      columnWidthSubtotal: 80,
      pageSize: 'A4',
      marginTop: 50,
      marginBottom: 50,
      marginLeft: 50,
      marginRight: 50,
      imageWidth: 50,
      imageHeight: 50,
      fontSize: 10,
      lineSpacing: 25,
      showCustomerInfo: true,
      showClientId: true,
      showCompanyName: true,
      showContactPerson: true,
      showEmail: true,
      showPhone: true,
      showAddress: true,
      showHeader: true,
      showFooter: true,
      headerText: 'PEDIDO',
      footerText: 'Gracias por su pedido',
    },
    excel: {
      showImage: false,
      showSKU: true,
      showProduct: true,
      showQuantity: true,
      showPrice: true,
      showSubtotal: true,
      showStock: false,
      showCategory: false,
      showCustomerInfo: true,
      showTotals: true,
      headerColor: 'E0E0E0',
      alternateRows: true,
    },
  };
}

/**
 * Generate PDF for order with custom configuration
 */
export async function generateOrderPDF(order: Order, usePreview = false): Promise<Buffer> {
  try {
    const config = await getReportConfig(usePreview);
    const pdfConfig = config.pdf;

    // Validate config values
    const validatedConfig = {
      ...pdfConfig,
      pageSize: pdfConfig.pageSize || 'A4',
      marginTop: Math.max(20, Math.min(100, pdfConfig.marginTop || 50)),
      marginBottom: Math.max(20, Math.min(100, pdfConfig.marginBottom || 50)),
      marginLeft: Math.max(20, Math.min(100, pdfConfig.marginLeft || 50)),
      marginRight: Math.max(20, Math.min(100, pdfConfig.marginRight || 50)),
      fontSize: Math.max(6, Math.min(20, pdfConfig.fontSize || 10)),
      lineSpacing: Math.max(15, Math.min(50, pdfConfig.lineSpacing || 20)),
      columnWidthSKU: Math.max(40, Math.min(400, pdfConfig.columnWidthSKU || 80)),
      columnWidthProduct: Math.max(40, Math.min(400, pdfConfig.columnWidthProduct || 200)),
      columnWidthQuantity: Math.max(40, Math.min(400, pdfConfig.columnWidthQuantity || 60)),
      columnWidthPrice: Math.max(40, Math.min(400, pdfConfig.columnWidthPrice || 80)),
      columnWidthSubtotal: Math.max(40, Math.min(400, pdfConfig.columnWidthSubtotal || 80)),
    };

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: validatedConfig.pageSize,
        margins: {
          top: validatedConfig.marginTop,
          bottom: validatedConfig.marginBottom,
          left: validatedConfig.marginLeft,
          right: validatedConfig.marginRight,
        },
      });

      // Collect PDF chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      if (validatedConfig.showHeader) {
        doc.fontSize(20).text(validatedConfig.headerText || 'Pedido', { align: 'center' });
        doc.moveDown();
      }

      // Order Info
      doc.fontSize(12).text(`Número de Pedido: ${order.orderNumber}`, { bold: true });
      if (order.createdAt) {
        doc.text(`Fecha: ${new Date(order.createdAt).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`);
      }
      doc.moveDown();

      // Customer Info
      if (validatedConfig.showCustomerInfo && order.user) {
        doc.fontSize(14).text('Información del Cliente', { underline: true });
        doc.fontSize(validatedConfig.fontSize);
        if (validatedConfig.showClientId) {
        const clientId = (order.user as any).clientNumber || (order.user as any).id || 'N/A';
        doc.text(`ID Cliente: ${clientId}`);
      }
        if (validatedConfig.showCompanyName && order.user.companyName) 
        doc.text(`Empresa: ${order.user.companyName}`);
        if (validatedConfig.showContactPerson && order.user.name) 
        doc.text(`Contacto: ${order.user.name}`);
        if (validatedConfig.showEmail && order.user.email) 
        doc.text(`Email: ${order.user.email}`);
        if (validatedConfig.showPhone && order.user.phone) 
        doc.text(`Teléfono: ${order.user.phone}`);
        if (validatedConfig.showAddress && order.user.address) 
        doc.text(`Dirección: ${order.user.address}`);
        doc.moveDown();
      }

      // Items Table Header
      doc.fontSize(14).text('Productos', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      let currentX = 50;
      const columnWidths: { [key: string]: number } = {};
      
      // Use configured column widths
      if (validatedConfig.showSKU) {
        columnWidths.sku = validatedConfig.columnWidthSKU;
      }
      if (validatedConfig.showProduct) {
        columnWidths.product = validatedConfig.columnWidthProduct;
      }
      if (validatedConfig.showQuantity) {
        columnWidths.quantity = validatedConfig.columnWidthQuantity;
      }
      if (validatedConfig.showPrice) {
        columnWidths.price = validatedConfig.columnWidthPrice;
      }
      if (validatedConfig.showSubtotal) {
        columnWidths.subtotal = validatedConfig.columnWidthSubtotal;
      }

      // Draw headers
      doc.fontSize(validatedConfig.fontSize).font('Helvetica-Bold');
      if (validatedConfig.showSKU) {
        doc.text('SKU', currentX, tableTop);
        currentX += columnWidths.sku;
      }
      if (validatedConfig.showProduct) {
        doc.text('Producto', currentX, tableTop);
        currentX += columnWidths.product;
      }
      if (validatedConfig.showQuantity) {
        doc.text('Cant.', currentX, tableTop);
        currentX += columnWidths.quantity;
      }
      if (validatedConfig.showPrice) {
        doc.text('Precio', currentX, tableTop);
        currentX += columnWidths.price;
      }
      if (validatedConfig.showSubtotal) {
        doc.text('Total', currentX, tableTop);
      }

      doc.moveTo(50, tableTop + 15)
         .lineTo(550, tableTop + 15)
         .stroke();

      // Items
      doc.font('Helvetica');
      let currentY = tableTop + 25;

      order.items.forEach((item) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        currentX = 50;
        
        if (validatedConfig.showSKU) {
          doc.text(item.sku || '-', currentX, currentY, { width: columnWidths.sku - 10 });
          currentX += columnWidths.sku;
        }
        if (validatedConfig.showProduct) {
          doc.text(item.productName, currentX, currentY, { width: columnWidths.product - 10 });
          currentX += columnWidths.product;
        }
        if (validatedConfig.showQuantity) {
          doc.text(item.quantity.toString(), currentX, currentY);
          currentX += columnWidths.quantity;
        }
        if (validatedConfig.showPrice) {
          doc.text(`$${parseFloat(item.pricePerUnit).toFixed(2)}`, currentX, currentY);
          currentX += columnWidths.price;
        }
        if (validatedConfig.showSubtotal) {
          doc.text(`$${parseFloat(item.subtotal).toFixed(2)}`, currentX, currentY);
        }

        currentY += validatedConfig.lineSpacing;
      });

      // Totals
      doc.moveDown();
      currentY = doc.y + 20;
      doc.moveTo(50, currentY - 10)
         .lineTo(550, currentY - 10)
         .stroke();

      doc.text('Subtotal:', 400, currentY);
      doc.text(`$${parseFloat(order.subtotal).toFixed(2)}`, 480, currentY);

      currentY += 20;
      doc.text('Impuesto (10%):', 400, currentY);
      doc.text(`$${parseFloat(order.tax).toFixed(2)}`, 480, currentY);

      currentY += 20;
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('TOTAL:', 400, currentY);
      doc.text(`$${parseFloat(order.total).toFixed(2)}`, 480, currentY);

      // Footer
      if (validatedConfig.showFooter) {
        doc.fontSize(8).font('Helvetica').text(
          validatedConfig.footerText || 'Gracias por su compra',
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
      }

      doc.end();
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Generate Excel for order with custom configuration
 */
export async function generateOrderExcel(order: Order): Promise<Buffer> {
  const config = await getReportConfig();
  const excelConfig = config.excel;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Pedido');

  // Header
  const headerCols = [];
  if (excelConfig.showSKU) headerCols.push('A');
  if (excelConfig.showProduct) headerCols.push(String.fromCharCode(65 + headerCols.length));
  if (excelConfig.showQuantity) headerCols.push(String.fromCharCode(65 + headerCols.length));
  if (excelConfig.showPrice) headerCols.push(String.fromCharCode(65 + headerCols.length));
  if (excelConfig.showSubtotal) headerCols.push(String.fromCharCode(65 + headerCols.length));

  const lastCol = headerCols[headerCols.length - 1] || 'E';
  worksheet.mergeCells(`A1:${lastCol}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'PEDIDO';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  // Order Info
  worksheet.getCell('A3').value = 'Número de Pedido:';
  worksheet.getCell('B3').value = order.orderNumber;
  worksheet.getCell('B3').font = { bold: true };

  if (order.createdAt) {
    worksheet.getCell('A4').value = 'Fecha:';
    worksheet.getCell('B4').value = new Date(order.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Customer Info
  let currentRow = 6;
  if (excelConfig.showCustomerInfo && order.user) {
    worksheet.getCell(`A${currentRow}`).value = 'INFORMACIÓN DEL CLIENTE';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
    currentRow++;

    if (order.user.companyName) {
      worksheet.getCell(`A${currentRow}`).value = 'Empresa:';
      worksheet.getCell(`B${currentRow}`).value = order.user.companyName;
      currentRow++;
    }
    if (order.user.name) {
      worksheet.getCell(`A${currentRow}`).value = 'Contacto:';
      worksheet.getCell(`B${currentRow}`).value = order.user.name;
      currentRow++;
    }
    if (order.user.email) {
      worksheet.getCell(`A${currentRow}`).value = 'Email:';
      worksheet.getCell(`B${currentRow}`).value = order.user.email;
      currentRow++;
    }
    if (order.user.phone) {
      worksheet.getCell(`A${currentRow}`).value = 'Teléfono:';
      worksheet.getCell(`B${currentRow}`).value = order.user.phone;
      currentRow++;
    }
    if (order.user.address) {
      worksheet.getCell(`A${currentRow}`).value = 'Dirección:';
      worksheet.getCell(`B${currentRow}`).value = order.user.address;
      currentRow++;
    }
  }

  // Items Table
  currentRow += 2;
  worksheet.getCell(`A${currentRow}`).value = 'PRODUCTOS';
  worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
  currentRow++;

  // Table Headers
  const headerRow = worksheet.getRow(currentRow);
  const headers = [];
  if (excelConfig.showSKU) headers.push('SKU');
  if (excelConfig.showProduct) headers.push('Producto');
  if (excelConfig.showQuantity) headers.push('Cantidad');
  if (excelConfig.showPrice) headers.push('Precio Unitario');
  if (excelConfig.showSubtotal) headers.push('Subtotal');
  if (excelConfig.showStock) headers.push('Stock');
  if (excelConfig.showCategory) headers.push('Categoría');

  headerRow.values = headers;
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${excelConfig.headerColor}` }
  };
  currentRow++;

  // Items
  order.items.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    const values = [];
    
    if (excelConfig.showSKU) values.push(item.sku || '-');
    if (excelConfig.showProduct) values.push(item.productName);
    if (excelConfig.showQuantity) values.push(item.quantity);
    if (excelConfig.showPrice) values.push(parseFloat(item.pricePerUnit));
    if (excelConfig.showSubtotal) values.push(parseFloat(item.subtotal));
    if (excelConfig.showStock) values.push(item.stock || 0);
    if (excelConfig.showCategory) values.push(item.category || '-');

    row.values = values;

    // Alternate row colors
    if (excelConfig.alternateRows && index % 2 === 1) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' }
      };
    }

    currentRow++;
  });

  // Totals
  if (excelConfig.showTotals) {
    currentRow++;
    const totalColIndex = headers.length - 1;
    const totalCol = String.fromCharCode(65 + totalColIndex - 1);
    const valueCol = String.fromCharCode(65 + totalColIndex);

    worksheet.getCell(`${totalCol}${currentRow}`).value = 'Subtotal:';
    worksheet.getCell(`${totalCol}${currentRow}`).font = { bold: true };
    worksheet.getCell(`${valueCol}${currentRow}`).value = parseFloat(order.subtotal);
    worksheet.getCell(`${valueCol}${currentRow}`).numFmt = '$#,##0.00';

    currentRow++;
    worksheet.getCell(`${totalCol}${currentRow}`).value = 'Impuesto (10%):';
    worksheet.getCell(`${totalCol}${currentRow}`).font = { bold: true };
    worksheet.getCell(`${valueCol}${currentRow}`).value = parseFloat(order.tax);
    worksheet.getCell(`${valueCol}${currentRow}`).numFmt = '$#,##0.00';

    currentRow++;
    worksheet.getCell(`${totalCol}${currentRow}`).value = 'TOTAL:';
    worksheet.getCell(`${totalCol}${currentRow}`).font = { bold: true, size: 12 };
    worksheet.getCell(`${valueCol}${currentRow}`).value = parseFloat(order.total);
    worksheet.getCell(`${valueCol}${currentRow}`).numFmt = '$#,##0.00';
    worksheet.getCell(`${valueCol}${currentRow}`).font = { bold: true, size: 12 };
  }

  // Column widths
  let colIndex = 1;
  if (excelConfig.showSKU) worksheet.getColumn(colIndex++).width = 15;
  if (excelConfig.showProduct) worksheet.getColumn(colIndex++).width = 40;
  if (excelConfig.showQuantity) worksheet.getColumn(colIndex++).width = 12;
  if (excelConfig.showPrice) worksheet.getColumn(colIndex++).width = 18;
  if (excelConfig.showSubtotal) worksheet.getColumn(colIndex++).width = 15;
  if (excelConfig.showStock) worksheet.getColumn(colIndex++).width = 12;
  if (excelConfig.showCategory) worksheet.getColumn(colIndex++).width = 20;

  // Generate buffer
  return await workbook.xlsx.writeBuffer() as Buffer;
}

