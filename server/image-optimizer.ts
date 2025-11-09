import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

/**
 * Image optimization service
 * Optimizes and resizes images for product catalog
 */

// Standard catalog image dimensions
const CATALOG_WIDTH = 400;
const CATALOG_HEIGHT = 400;
const QUALITY = 85;

/**
 * Optimize an image for the product catalog
 * @param inputPath - Path to the original image
 * @param outputPath - Path where optimized image will be saved
 * @returns Promise with the output path
 */
export async function optimizeProductImage(
  inputPath: string,
  outputPath: string
): Promise<string> {
  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    await fs.mkdir(outputDir, { recursive: true });

    // Process image with sharp
    await sharp(inputPath)
      .resize(CATALOG_WIDTH, CATALOG_HEIGHT, {
        fit: "contain", // Mantener imagen completa sin recortar
        position: "center", // Centrar la imagen
        background: { r: 255, g: 255, b: 255, alpha: 1 }, // Fondo blanco
      })
      .jpeg({
        quality: QUALITY,
        progressive: true, // Progressive JPEG for better loading
      })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error("Error optimizing image:", error);
    throw new Error(`Failed to optimize image: ${error}`);
  }
}

/**
 * Optimize multiple images in batch
 * @param images - Array of {input, output} paths
 * @returns Promise with array of optimized paths
 */
export async function optimizeImagesBatch(
  images: Array<{ input: string; output: string }>
): Promise<string[]> {
  const results = await Promise.allSettled(
    images.map((img) => optimizeProductImage(img.input, img.output))
  );

  const optimized: string[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      optimized.push(result.value);
    } else {
      failed.push(images[index].input);
      console.error(`Failed to optimize ${images[index].input}:`, result.reason);
    }
  });

  if (failed.length > 0) {
    console.warn(`${failed.length} images failed to optimize:`, failed);
  }

  return optimized;
}

/**
 * Get image metadata
 * @param imagePath - Path to the image
 * @returns Image metadata
 */
export async function getImageMetadata(imagePath: string) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
    };
  } catch (error) {
    console.error("Error reading image metadata:", error);
    throw new Error(`Failed to read image metadata: ${error}`);
  }
}

/**
 * Validate if file is a valid image
 * @param filePath - Path to the file
 * @returns true if valid image, false otherwise
 */
export async function isValidImage(filePath: string): Promise<boolean> {
  try {
    await sharp(filePath).metadata();
    return true;
  } catch {
    return false;
  }
}

