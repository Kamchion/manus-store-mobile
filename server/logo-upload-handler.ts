import { Request, Response } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { uploadToR2 } from "./r2-storage";
import sharp from "sharp";

/**
 * Upload handler for logo images - uploads to Cloudflare R2
 */

// Configure multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido. Solo se aceptan imágenes.`));
    }
  },
});

// Multer middleware
export const uploadMiddleware = upload.single("file");

/**
 * Handle logo upload - uploads to Cloudflare R2
 */
export async function handleLogoUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo" });
    }

    // Generate unique filename
    const ext = req.file.originalname.substring(req.file.originalname.lastIndexOf("."));
    const uniqueName = `logo_${nanoid()}${ext}`;
    const r2Key = `ikam-image/logos/${uniqueName}`;

    let fileBuffer = req.file.buffer;

    // Optimize image if it's not SVG
    if (req.file.mimetype !== "image/svg+xml") {
      try {
        fileBuffer = await sharp(req.file.buffer)
          .resize(800, 800, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 90 })
          .toBuffer();
      } catch (error) {
        console.warn("Could not optimize image, using original:", error);
      }
    }

    // Upload to R2
    const r2Url = await uploadToR2(
      r2Key,
      fileBuffer,
      req.file.mimetype === "image/svg+xml" ? req.file.mimetype : "image/jpeg"
    );

    console.log(`✅ Logo uploaded to R2: ${r2Url}`);

    res.json({
      success: true,
      url: r2Url,
      filename: uniqueName,
      size: fileBuffer.length,
    });
  } catch (error: any) {
    console.error("Logo upload error:", error);
    res.status(500).json({ error: error.message || "Error al subir el logo" });
  }
}
