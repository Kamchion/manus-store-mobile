import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Image, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

/**
 * Componente de importación de productos con formato de 18 columnas
 */
export default function ProductImportNew() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [imageUploadResult, setImageUploadResult] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
      setUploadResult(null);
      setImportResult(null);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(e.target.files);
      setImageUploadResult(null);
    }
  };

  const handleUploadImages = async () => {
    if (!imageFiles || imageFiles.length === 0) {
      toast.error("Por favor selecciona al menos una imagen");
      return;
    }

    setIsUploadingImages(true);
    setImageUploadResult(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < imageFiles.length; i++) {
        formData.append("images", imageFiles[i]);
      }

      const response = await fetch("/api/upload/images", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageUploadResult(result);
        toast.success(`${result.uploaded} imagen(es) subida(s) exitosamente`);
      } else {
        toast.error('Error al subir imágenes');
      }
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(getErrorMessage(error) || 'Error al subir imágenes');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile) {
      toast.error("Por favor selecciona un archivo Excel");
      return;
    }

    setIsUploadingExcel(true);
    setUploadResult(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("excel", excelFile);

      const response = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResult(result);
        // Auto-process after upload
        await handleProcess(result.excelPath);
      } else {
        toast.error('Error al subir Excel');
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(getErrorMessage(error) || 'Error al subir Excel');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleProcess = async (excelPath: string, imagesPath?: string) => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/import/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ excelPath, imagesPath }),
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        toast.success(`Importación exitosa: ${result.created} creados, ${result.updated} actualizados`);
      } else {
        console.log('Import result:', result);
        const errorCount = result.errors?.length || 0;
        const errorSummary = errorCount > 0 ? `${errorCount} error(es)` : 'Error desconocido';
        toast.error(`Importación con errores: ${result.created || 0} creados, ${result.updated || 0} actualizados. ${errorSummary}`);
      }
    } catch (error: any) {
      console.error("Process error:", error);
      toast.error(getErrorMessage(error) || 'Error al procesar');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    // Descargar plantilla completa de Excel
    const link = document.createElement("a");
    link.href = "/plantillas/PLANTILLA_PRODUCTOS_COMPLETA.xlsx";
    link.download = "PLANTILLA_PRODUCTOS_COMPLETA.xlsx";
    link.click();
  };

  const exportProducts = async () => {
    try {
      setIsExporting(true);
      
      const response = await fetch("/api/import/products/export");
      
      if (!response.ok) {
        throw new Error("Error al exportar productos");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Generar nombre con fecha
      const fecha = new Date().toISOString().split('T')[0];
      link.download = `productos_${fecha}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error: any) {
      console.error("Error al exportar:", error);
      toast.error(getErrorMessage(error) || 'Error al exportar');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importación de Productos - Formato 18 Columnas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Descarga la plantilla de Excel haciendo clic en el botón abajo</li>
              <li>Revisa los ejemplos incluidos (productos simples y con variantes)</li>
              <li>Llena las 18 columnas con la información de tus productos</li>
              <li>Sube el archivo Excel completado</li>
              <li>(Opcional) Sube las imágenes de los productos</li>
              <li>Haz clic en "Importar Productos"</li>
            </ol>
          </div>

          {/* Download Template and Export Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Button onClick={downloadTemplate} variant="outline" className="w-full">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Descargar Plantilla con Ejemplos
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                20 productos de ejemplo incluidos
              </p>
            </div>
            <div>
              <Button 
                onClick={exportProducts} 
                variant="outline" 
                className="w-full"
                disabled={isExporting}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                {isExporting ? "Exportando..." : "Exportar Productos Existentes"}
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Descargar todos los productos actuales
              </p>
            </div>
          </div>

          {/* Column Description */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold mb-3 text-blue-900">📊 Descripción de las 19 Columnas</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">A - Orden:</span> Orden en catálogo</div>
              <div><span className="font-medium">B - Categoría:</span> Categoría principal</div>
              <div><span className="font-medium">C - Subcategoría:</span> Subcategoría</div>
              <div><span className="font-medium">D - Código modelo:</span> SKU padre (variantes)</div>
              <div><span className="font-medium">E - SKU:</span> SKU único del producto</div>
              <div><span className="font-medium">F - Nombre:</span> Nombre del producto</div>
              <div><span className="font-medium">G - Nombre variante:</span> Ej: "Rojo", "Talla M"</div>
              <div><span className="font-medium">H - Dimensión:</span> Ej: "Color", "Tamaño"</div>
              <div><span className="font-medium">I - Línea 1:</span> Texto arriba de cantidad</div>
              <div><span className="font-medium">J - Cant. mínima:</span> Cantidad mínima</div>
              <div><span className="font-medium">K - Línea 2:</span> Texto en rojo</div>
              <div><span className="font-medium">L - Ubicación:</span> Ubicación física</div>
              <div><span className="font-medium">M - Unidades/caja:</span> Unidades por caja</div>
              <div><span className="font-medium">N - Visible:</span> TRUE/FALSE</div>
              <div><span className="font-medium">O - Stock:</span> Cantidad en stock</div>
              <div><span className="font-medium">P - Precio Ciudad:</span> Precio tipo ciudad</div>
              <div><span className="font-medium">Q - Precio Interior:</span> Precio tipo interior</div>
              <div><span className="font-medium">R - Precio Especial:</span> Precio tipo especial</div>
              <div><span className="font-medium">S - Nombre Imagen:</span> Nombre base del archivo sin extensión (ej: PROD-001)</div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="border-2 border-dashed border-green-300 rounded-lg p-6 bg-green-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Image className="mr-2 h-5 w-5 text-green-600" />
              1. Subir Imágenes de Productos (Opcional)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sube las imágenes con nombre de SKU (ej: PROD-001.jpg, PROD-002.png). El sistema detectará automáticamente la extensión.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Seleccionar Imágenes
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImagesChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-green-100 file:text-green-700
                    hover:file:bg-green-200"
                />
                {imageFiles && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {imageFiles.length} imagen(es) seleccionada(s)
                  </p>
                )}
                {imageUploadResult && (
                  <p className="mt-2 text-sm text-green-600 font-semibold">
                    ✓ {imageUploadResult.uploaded} imagen(es) subida(s) exitosamente
                  </p>
                )}
              </div>
              <Button
                onClick={handleUploadImages}
                disabled={!imageFiles || isUploadingImages}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {isUploadingImages ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Subiendo Imágenes...
                  </>
                ) : (
                  <>
                    <Image className="mr-2 h-4 w-4" />
                    Subir Imágenes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Excel Upload Section */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileSpreadsheet className="mr-2 h-5 w-5 text-blue-600" />
              2. Importar Productos desde Excel
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sube el archivo Excel con las 19 columnas. En la columna S (Nombre Imagen), indica solo el nombre base sin extensión (ej: PROD-001). El sistema buscará automáticamente la imagen con cualquier extensión común (.jpg, .png, .webp, .gif).
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Archivo Excel * (obligatorio)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-100 file:text-blue-700
                    hover:file:bg-blue-200"
                />
                {excelFile && (
                  <p className="mt-2 text-sm text-blue-600">
                    ✓ Archivo seleccionado: {excelFile.name}
                  </p>
                )}
              </div>
              <Button
                onClick={handleUploadExcel}
                disabled={!excelFile || isUploadingExcel || isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isUploadingExcel || isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isUploadingExcel ? "Subiendo..." : "Procesando..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar Productos
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results */}
          {importResult && (
            <div className={`border rounded-lg p-4 ${importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start space-x-3">
                {importResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">
                    {importResult.success ? "✅ Importación Exitosa" : "❌ Error en Importación"}
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>Productos importados: <span className="font-semibold">{importResult.imported}</span></p>
                    <p>Productos fallidos: <span className="font-semibold">{importResult.failed}</span></p>
                    {importResult.errors && importResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Errores:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {importResult.errors.slice(0, 10).map((err: any, idx: number) => (
                            <li key={idx}>
                              Fila {err.row}: {err.error}
                            </li>
                          ))}
                          {importResult.errors.length > 10 && (
                            <li className="text-gray-600">
                              ... y {importResult.errors.length - 10} errores más
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

