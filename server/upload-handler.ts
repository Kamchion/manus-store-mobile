import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";

/**
 * Upload handler for product import
 * Handles Excel and image file uploads
 */

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "/tmp/uploads";
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${nanoid()}_${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max per file
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files and images
    const allowedMimes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/octet-stream", // Para archivos .xlsx que no tienen el MIME correcto
      "text/csv",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    // También verificar la extensión del archivo
    const allowedExtensions = [".xlsx", ".xls", ".csv", ".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype} (${file.originalname})`));
    }
  },
});

// Multer middleware
export const uploadMiddleware = upload.fields([
  { name: "excel", maxCount: 1 },
  { name: "images", maxCount: 100 },
]);

/**
 * Handle file upload
 */
export async function handleUpload(req: Request, res: Response) {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files.excel) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    const excelFile = files.excel[0];
    const excelPath = excelFile.path;

    let imagesPath: string | undefined;

    // If images were uploaded, move them to a dedicated folder
    if (files.images && files.images.length > 0) {
      const imagesDir = path.join("/tmp/uploads", `images_${nanoid()}`);
      await fs.mkdir(imagesDir, { recursive: true });

      // Move all images to the dedicated folder
      for (const imageFile of files.images) {
        const destPath = path.join(imagesDir, imageFile.originalname);
        await fs.rename(imageFile.path, destPath);
      }

      imagesPath = imagesDir;
    }

    res.json({
      success: true,
      excelPath,
      imagesPath,
      imagesCount: files.images?.length || 0,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
}

/**
 * Handle import processing
 */
export async function handleProcess(req: Request, res: Response) {
  try {
    const { excelPath, imagesPath } = req.body;

    if (!excelPath) {
      return res.status(400).json({ error: "Excel path is required" });
    }

    // Import the new processing logic with 18-column format
    const { importProductsFromExcel } = await import("./import-excel-service");

    // Use the new import service with 18-column format
    console.log("📊 Starting import process...");
    const results = await importProductsFromExcel(excelPath, imagesPath || undefined);

    // Cleanup temporary files
    try {
      await fs.unlink(excelPath);
      if (imagesPath) {
        await fs.rm(imagesPath, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn("Failed to cleanup temporary files:", error);
    }

    console.log(`\n✅ Import complete: ${results.created} created, ${results.updated} updated`);
    res.json(results);
  } catch (error: any) {
    console.error("❌ Import processing failed:", error);
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    res.status(500).json({
      success: false,
      created: 0,
      updated: 0,
      errors: [{ row: 0, error: error.message || "Unknown error during import" }],
    });
  }
}


/**
 * Handle product export to Excel
 */
export async function handleProductExport(req: Request, res: Response) {
  try {
    console.log("📊 Exportando productos a Excel...");
    
    const { exportProductsToExcel } = await import("./import-excel-service");
    const buffer = await exportProductsToExcel();
    
    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `productos_${fecha}.xlsx`;
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    
    res.send(buffer);
    console.log("✅ Exportación completada");
  } catch (error: any) {
    console.error("❌ Error al exportar productos:", error);
    res.status(500).json({ error: error.message || "Error al exportar productos" });
  }
}

