import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { optimizeProductImage } from "./image-optimizer";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { uploadToR2, isR2Configured } from "./r2-storage";

/**
 * Handler para carga de imagen individual de producto
 */

// Configure multer storage para imágenes individuales
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "/tmp/product-images";
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
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG, WebP, GIF"));
    }
  },
});

export const uploadMiddleware = upload.single('image');

/**
 * Handle single product image upload
 */
export async function handleProductImageUpload(req: Request, res: Response) {
  try {
    const file = req.file;
    const { sku } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No se proporcionó ninguna imagen" });
    }

    if (!sku) {
      return res.status(400).json({ error: "SKU es requerido" });
    }

    console.log(`📸 Subiendo imagen para producto ${sku}...`);

    // Define output path
    const outputDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(outputDir, { recursive: true });

    const outputFilename = `${sku}.jpg`;
    const outputPath = path.join(outputDir, outputFilename);

    // Optimize image to a temporary location
    const tempOptimizedPath = path.join("/tmp", `optimized_${outputFilename}`);
    await optimizeProductImage(file.path, tempOptimizedPath);

    let imagePath: string;

    // Subir a R2 si está configurado, sino guardar localmente
    if (isR2Configured()) {
      console.log(`📤 Subiendo imagen a R2...`);
      
      // Leer el archivo optimizado
      const imageBuffer = await fs.readFile(tempOptimizedPath);
      
      // Subir a R2 en la ruta ikam-image/products/images/
      const r2Key = `ikam-image/products/images/${outputFilename}`;
      imagePath = await uploadToR2(r2Key, imageBuffer, "image/jpeg");
      
      console.log(`✅ Imagen subida a R2: ${imagePath}`);
    } else {
      console.log(`💾 Guardando imagen localmente (R2 no configurado)...`);
      
      // Guardar localmente si R2 no está configurado
      await fs.copyFile(tempOptimizedPath, outputPath);
      imagePath = `/uploads/products/${outputFilename}`;
      
      console.log(`✅ Imagen guardada localmente: ${imagePath}`);
    }

    // Limpiar archivos temporales
    try {
      await fs.unlink(file.path);
      await fs.unlink(tempOptimizedPath);
    } catch (error) {
      console.warn("Failed to cleanup temporary files:", error);
    }
    
    console.log(`✅ Imagen guardada: ${imagePath}`);

    // Agregar timestamp a la URL para evitar problemas de caché del navegador
    const timestamp = Date.now();
    const imagePathWithVersion = `${imagePath}?v=${timestamp}`;

    // Actualizar la base de datos con la nueva ruta de imagen
    try {
      const db = await getDb();
      if (db) {
        await db
          .update(products)
          .set({ image: imagePath }) // Guardar sin timestamp en BD
          .where(eq(products.sku, sku));
        
        console.log(`✅ Base de datos actualizada para SKU: ${sku}`);
      } else {
        console.warn("⚠️ Base de datos no disponible, imagen guardada pero BD no actualizada");
      }
    } catch (dbError) {
      console.error("❌ Error al actualizar la base de datos:", dbError);
      // No fallar la petición si la actualización de BD falla
    }

    res.json({
      success: true,
      imagePath: imagePathWithVersion, // Retornar con timestamp para el frontend
      message: "Imagen subida y actualizada correctamente",
    });
  } catch (error: any) {
    console.error("❌ Error al subir imagen:", error);
    res.status(500).json({ 
      error: error.message || "Error al procesar la imagen" 
    });
  }
}

