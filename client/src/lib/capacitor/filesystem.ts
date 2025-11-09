import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export interface DownloadResult {
  total: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ productId: string; error: string }>;
}

/**
 * Image Manager para gestión de imágenes offline
 * Descarga y almacena imágenes en el sistema de archivos nativo
 */
class ImageManager {
  private readonly IMAGE_DIR = 'productos';
  private readonly MAX_CONCURRENT_DOWNLOADS = 5;

  /**
   * Obtener la ruta de una imagen (local o remota)
   */
  async getImagePath(productId: string, remoteUrl?: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      // En web, retornar URL remota directamente
      return remoteUrl || this.getRemoteUrl(productId);
    }

    // Intentar obtener imagen local primero
    const localPath = await this.getLocalPath(productId);
    
    if (await this.exists(productId)) {
      // Convertir ruta nativa a URL que puede usar el WebView
      return Capacitor.convertFileSrc(localPath);
    }

    // Si no existe local, retornar URL remota
    return remoteUrl || this.getRemoteUrl(productId);
  }

  /**
   * Descargar una imagen y guardarla localmente
   */
  async downloadImage(url: string, productId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Image download only works on native platforms');
      return;
    }

    try {
      // Descargar imagen
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);

      // Guardar en sistema de archivos nativo
      await Filesystem.writeFile({
        path: `${this.IMAGE_DIR}/${productId}.jpg`,
        data: base64,
        directory: Directory.Data,
        recursive: true
      });

      console.log(`Image downloaded successfully: ${productId}`);
    } catch (error) {
      console.error(`Error downloading image for product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Descargar múltiples imágenes en lotes
   */
  async downloadImages(
    products: Array<{ id: string; image?: string }>
  ): Promise<DownloadResult> {
    if (!Capacitor.isNativePlatform()) {
      return {
        total: products.length,
        successCount: 0,
        failedCount: 0,
        errors: []
      };
    }

    const result: DownloadResult = {
      total: products.length,
      successCount: 0,
      failedCount: 0,
      errors: []
    };

    // Filtrar productos que tienen imagen
    const productsWithImages = products.filter(p => p.image);

    // Descargar en lotes para no saturar
    for (let i = 0; i < productsWithImages.length; i += this.MAX_CONCURRENT_DOWNLOADS) {
      const batch = productsWithImages.slice(i, i + this.MAX_CONCURRENT_DOWNLOADS);

      const batchResults = await Promise.allSettled(
        batch.map(product => this.downloadImage(product.image!, product.id))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          result.successCount++;
        } else {
          result.failedCount++;
          result.errors.push({
            productId: batch[index].id,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Pequeña pausa entre lotes
      if (i + this.MAX_CONCURRENT_DOWNLOADS < productsWithImages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return result;
  }

  /**
   * Verificar si una imagen existe localmente
   */
  async exists(productId: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      await Filesystem.stat({
        path: `${this.IMAGE_DIR}/${productId}.jpg`,
        directory: Directory.Data
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Eliminar una imagen local
   */
  async deleteImage(productId: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Filesystem.deleteFile({
        path: `${this.IMAGE_DIR}/${productId}.jpg`,
        directory: Directory.Data
      });
    } catch (error) {
      console.error(`Error deleting image for product ${productId}:`, error);
    }
  }

  /**
   * Limpiar todas las imágenes del cache
   */
  async clearImageCache(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await Filesystem.rmdir({
        path: this.IMAGE_DIR,
        directory: Directory.Data,
        recursive: true
      });
      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Error clearing image cache:', error);
    }
  }

  /**
   * Obtener tamaño total de imágenes locales (en bytes)
   */
  async getLocalImageSize(): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      return 0;
    }

    try {
      const result = await Filesystem.readdir({
        path: this.IMAGE_DIR,
        directory: Directory.Data
      });

      let totalSize = 0;
      for (const file of result.files) {
        const stat = await Filesystem.stat({
          path: `${this.IMAGE_DIR}/${file.name}`,
          directory: Directory.Data
        });
        totalSize += stat.size;
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * Obtener número de imágenes locales
   */
  async getLocalImageCount(): Promise<number> {
    if (!Capacitor.isNativePlatform()) {
      return 0;
    }

    try {
      const result = await Filesystem.readdir({
        path: this.IMAGE_DIR,
        directory: Directory.Data
      });
      return result.files.length;
    } catch {
      return 0;
    }
  }

  /**
   * Obtener ruta local de una imagen
   */
  private async getLocalPath(productId: string): Promise<string> {
    const uri = await Filesystem.getUri({
      path: `${this.IMAGE_DIR}/${productId}.jpg`,
      directory: Directory.Data
    });
    return uri.uri;
  }

  /**
   * Construir URL remota de una imagen
   */
  private getRemoteUrl(productId: string): string {
    // Usar variable de entorno o configuración
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}/uploads/products/${productId}.jpg`;
  }

  /**
   * Convertir Blob a Base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remover prefijo data:image/...;base64,
        resolve(base64.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Exportar instancia singleton
export const imageManager = new ImageManager();
