import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { uploadToR2 } from "./r2-storage";

/**
 * Dedicated handler for product image uploads
 * Images are uploaded independently and stored with their original names
 */

// Configure multer storage for images only
const imageStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "/tmp/product-images";
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename for easy association with SKU
    cb(null, file.originalname);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per image
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Multer middleware for multiple images
export const imageUploadMiddleware = imageUpload.array("images", 100);

/**
 * Handle image upload - Upload to Cloudflare R2
 */
export async function handleImageUpload(req: Request, res: Response) {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const uploadedFiles = [];
    const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://pub-f12deb971fd349be80802a45b2296af3.r2.dev';
    
    for (const file of files) {
      try {
        // Read file content
        const fileContent = await fs.readFile(file.path);
        
        // Upload to R2
        const r2Key = `ikam-image/products/images/${file.originalname}`;
        const r2Url = await uploadToR2(r2Key, fileContent, file.mimetype);
        
        console.log(`✅ Uploaded to R2: ${file.originalname} -> ${r2Url}`);
        
        uploadedFiles.push({
          originalName: file.originalname,
          r2Url: r2Url,
          publicPath: r2Url, // For backward compatibility
          size: file.size,
        });
        
        // Clean up temp file
        await fs.unlink(file.path).catch(() => {});
      } catch (error: any) {
        console.error(`Error uploading ${file.originalname} to R2:`, error);
        uploadedFiles.push({
          originalName: file.originalname,
          error: error.message,
          size: file.size,
        });
      }
    }

    res.json({
      success: true,
      uploaded: uploadedFiles.filter(f => !f.error).length,
      failed: uploadedFiles.filter(f => f.error).length,
      files: uploadedFiles,
      message: `${uploadedFiles.filter(f => !f.error).length} image(s) uploaded to R2 successfully`,
    });
  } catch (error: any) {
    console.error("Image upload error:", error);
    res.status(500).json({ error: error.message || "Image upload failed" });
  }
}

