import * as XLSX from "xlsx";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs/promises";
import { optimizeProductImage } from "./image-optimizer";

/**
 * Product import service
 * Handles Excel import and image processing
 */

export interface ProductImportRow {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  basePrice: number;
  stock: number;
  image?: string; // Image filename
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
  products: any[];
}

/**
 * Parse Excel file and extract product data
 * @param filePath - Path to the Excel file
 * @returns Array of product data
 */
export async function parseExcelFile(
  filePath: string
): Promise<ProductImportRow[]> {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<any>(worksheet);

    // Map to ProductImportRow format
    const products: ProductImportRow[] = data.map((row) => ({
      sku: String(row.SKU || row.sku || "").trim(),
      name: String(row.Nombre || row.nombre || row.Name || row.name || "").trim(),
      description: String(row.Descripción || row.descripcion || row.Description || row.description || "").trim() || undefined,
      category: String(row.Categoría || row.categoria || row.Category || row.category || "").trim() || undefined,
      basePrice: parseFloat(row.Precio || row.precio || row.Price || row.price || 0),
      stock: parseInt(row.Stock || row.stock || row.Inventario || row.inventario || 0, 10),
      image: String(row.Imagen || row.imagen || row.Image || row.image || "").trim() || undefined,
    }));

    return products.filter((p) => p.sku && p.name); // Filter out invalid rows
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    throw new Error(`Failed to parse Excel file: ${error}`);
  }
}

/**
 * Process and optimize product images
 * @param imagesDir - Directory containing uploaded images
 * @param products - Array of products with image filenames
 * @param outputDir - Directory to save optimized images
 * @returns Map of SKU to optimized image path
 */
export async function processProductImages(
  imagesDir: string,
  products: ProductImportRow[],
  outputDir: string
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  for (const product of products) {
    if (!product.image) continue;

    try {
      // Find image file (case-insensitive)
      const files = await fs.readdir(imagesDir);
      const imageFile = files.find(
        (f) => f.toLowerCase() === product.image!.toLowerCase()
      );

      if (!imageFile) {
        console.warn(`Image not found for SKU ${product.sku}: ${product.image}`);
        continue;
      }

      const inputPath = path.join(imagesDir, imageFile);
      const outputFilename = `${product.sku}.jpg`;
      const outputPath = path.join(outputDir, outputFilename);

      // Optimize image
      await optimizeProductImage(inputPath, outputPath);

      // Store relative path for database
      imageMap.set(product.sku, `/uploads/products/${outputFilename}`);

      console.log(`✓ Optimized image for ${product.sku}`);
    } catch (error) {
      console.error(`Error processing image for ${product.sku}:`, error);
    }
  }

  return imageMap;
}

/**
 * Validate product data
 * @param product - Product data to validate
 * @returns Validation errors or null if valid
 */
export function validateProduct(product: ProductImportRow): string | null {
  if (!product.sku) return "SKU is required";
  if (!product.name) return "Name is required";
  if (product.basePrice < 0) return "Price must be positive";
  if (product.stock < 0) return "Stock cannot be negative";
  return null;
}

/**
 * Generate product ID from SKU
 * @param sku - Product SKU
 * @returns Product ID
 */
export function generateProductId(sku: string): string {
  // Clean SKU and use it as base for ID
  const cleanSku = sku.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  return `prod_${cleanSku}_${nanoid(6)}`;
}

