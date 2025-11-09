import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Servicio para subir archivos a Cloudflare R2
 * Usa las credenciales de AWS S3 configuradas en las variables de entorno
 */

// Configurar el cliente de S3 para Cloudflare R2
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "ikam-image";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

/**
 * Sube un archivo a Cloudflare R2
 * @param key - Ruta del archivo en R2 (ej: "products/images/PROD-001.jpg")
 * @param fileBuffer - Buffer del archivo a subir
 * @param contentType - Tipo MIME del archivo (ej: "image/jpeg")
 * @returns URL pública del archivo en R2
 */
export async function uploadToR2(
  key: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    // Construir la URL pública del archivo
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;
    
    console.log(`✅ Archivo subido a R2: ${publicUrl}`);
    
    return publicUrl;
  } catch (error) {
    console.error("❌ Error al subir archivo a R2:", error);
    throw new Error(`Error al subir archivo a R2: ${error}`);
  }
}

/**
 * Verifica si R2 está configurado correctamente
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_ENDPOINT &&
    process.env.AWS_S3_BUCKET &&
    process.env.R2_PUBLIC_URL
  );
}
