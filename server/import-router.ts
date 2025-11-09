import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { parseExcelFile, processProductImages, validateProduct, generateProductId } from "./import-service";
import { upsertProduct } from "./db";
import { nanoid } from "nanoid";

/**
 * Import router for bulk product imports
 */

// Configure multer for file uploads
const upload = multer({
  dest: "/tmp/uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

export const importRouter = router({
  /**
   * Import products from Excel with images
   * Admin only
   */
  importProducts: protectedProcedure
    .input(
      z.object({
        excelPath: z.string(),
        imagesPath: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can import products");
      }

      const results = {
        success: true,
        imported: 0,
        failed: 0,
        errors: [] as Array<{ row: number; error: string }>,
        products: [] as any[],
      };

      try {
        // Parse Excel file
        console.log("📊 Parsing Excel file...");
        const productsData = await parseExcelFile(input.excelPath);
        console.log(`Found ${productsData.length} products in Excel`);

        // Process images if directory provided
        let imageMap = new Map<string, string>();
        if (input.imagesPath) {
          console.log("🖼️  Processing images...");
          const outputDir = path.join(process.cwd(), "public", "uploads", "products");
          imageMap = await processProductImages(
            input.imagesPath,
            productsData,
            outputDir
          );
          console.log(`Optimized ${imageMap.size} images`);
        }

        // Import products
        console.log("💾 Importing products to database...");
        for (let i = 0; i < productsData.length; i++) {
          const productData = productsData[i];

          try {
            // Validate product
            const validationError = validateProduct(productData);
            if (validationError) {
              results.errors.push({
                row: i + 2, // +2 because Excel rows start at 1 and header is row 1
                error: validationError,
              });
              results.failed++;
              continue;
            }

            // Generate product ID
            const productId = generateProductId(productData.sku);

            // Get optimized image path
            const imagePath = imageMap.get(productData.sku);

            // Create product
            const product = await upsertProduct({
              id: productId,
              sku: productData.sku,
              name: productData.name,
              description: productData.description || "",
              category: productData.category || "",
              basePrice: productData.basePrice.toString(),
              stock: productData.stock,
              image: imagePath || "",
              isActive: true,
            });

            results.products.push(product);
            results.imported++;
            console.log(`✓ Imported: ${productData.sku} - ${productData.name}`);
          } catch (error: any) {
            results.errors.push({
              row: i + 2,
              error: error.message || "Unknown error",
            });
            results.failed++;
            console.error(`✗ Failed to import ${productData.sku}:`, error.message);
          }
        }

        // Cleanup temporary files
        try {
          await fs.unlink(input.excelPath);
          if (input.imagesPath) {
            await fs.rm(input.imagesPath, { recursive: true, force: true });
          }
        } catch (error) {
          console.warn("Failed to cleanup temporary files:", error);
        }

        console.log(`\n✅ Import complete: ${results.imported} imported, ${results.failed} failed`);
        return results;
      } catch (error: any) {
        console.error("❌ Import failed:", error);
        results.success = false;
        results.errors.push({
          row: 0,
          error: error.message || "Unknown error during import",
        });
        return results;
      }
    }),

  /**
   * Get import template
   * Returns a sample Excel structure
   */
  getImportTemplate: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Only admins can access import templates");
    }

    return {
      columns: [
        { name: "SKU", required: true, example: "PROD-001" },
        { name: "Nombre", required: true, example: "Producto Ejemplo" },
        { name: "Descripción", required: false, example: "Descripción del producto" },
        { name: "Categoría", required: false, example: "Electrónica" },
        { name: "Precio", required: true, example: "99.99" },
        { name: "Stock", required: true, example: "100" },
        { name: "Imagen", required: false, example: "PROD-001.jpg" },
      ],
    };
  }),
});

