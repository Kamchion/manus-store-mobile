import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Image, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ProductImport() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imagesFiles, setImagesFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const imagesInputRef = useRef<HTMLInputElement>(null);

  // Get import template info
  const { data: template } = trpc.import.getImportTemplate.useQuery();

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
    }
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImagesFiles(e.target.files);
    }
  };

  const handleImport = async () => {
    if (!excelFile) {
      toast.error("Por favor selecciona un archivo Excel");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("excel", excelFile);

      if (imagesFiles) {
        for (let i = 0; i < imagesFiles.length; i++) {
          formData.append("images", imagesFiles[i]);
        }
      }

      // Upload to server
      setUploadProgress(30);
      const response = await fetch("/api/import/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al subir archivos");
      }

      const uploadResult = await response.json();
      setUploadProgress(60);

      // Process import
      const result = await fetch("/api/import/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          excelPath: uploadResult.excelPath,
          imagesPath: uploadResult.imagesPath,
        }),
      });

      if (!result.ok) {
        throw new Error("Error al procesar importación");
      }

      const importData = await result.json();
      setUploadProgress(100);
      setImportResult(importData);

      // Clear files
      setExcelFile(null);
      setImagesFiles(null);
      if (excelInputRef.current) excelInputRef.current.value = "";
      if (imagesInputRef.current) imagesInputRef.current.value = "";
    } catch (error: any) {
      console.error("Error importing products:", error);
      setImportResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, error: error.message }],
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample Excel template
    const csvContent = `SKU,Nombre,Descripción,Categoría,Precio,Stock,Imagen
PROD-001,Producto Ejemplo 1,Descripción del producto 1,Electrónica,99.99,100,PROD-001.jpg
PROD-002,Producto Ejemplo 2,Descripción del producto 2,Ropa,49.99,50,PROD-002.jpg`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "plantilla_productos.csv";
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Productos Masivamente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Descarga la plantilla de Excel y llénala con los datos de tus productos</li>
              <li>En la columna "Imagen" coloca el nombre del archivo de imagen (ej: PROD-001.jpg)</li>
              <li>Prepara las imágenes de los productos (pueden ser de cualquier tamaño)</li>
              <li>Las imágenes se optimizarán automáticamente a 400x400px para el catálogo</li>
              <li>Sube el archivo Excel y las imágenes, luego haz clic en "Importar"</li>
            </ol>
          </div>

          <Button onClick={downloadTemplate} variant="outline" className="w-full">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Descargar Plantilla de Excel
          </Button>

          {/* Template Info */}
          {template && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Columnas del Excel:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {template.columns.map((col: any) => (
                  <div key={col.name} className="flex items-center gap-2">
                    <span className={col.required ? "font-semibold" : ""}>
                      {col.name}
                      {col.required && <span className="text-red-500">*</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Subir Archivos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Excel Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Archivo Excel <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={excelInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelChange}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {excelFile && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            {excelFile && (
              <p className="text-sm text-gray-600 mt-1">
                Archivo seleccionado: {excelFile.name}
              </p>
            )}
          </div>

          {/* Images Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Imágenes de Productos (opcional)
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={imagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {imagesFiles && imagesFiles.length > 0 && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            {imagesFiles && imagesFiles.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {imagesFiles.length} imagen(es) seleccionada(s)
              </p>
            )}
          </div>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!excelFile || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importando... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Importar Productos
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Card */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Resultado de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-700">Importados</p>
                <p className="text-2xl font-bold text-green-900">
                  {importResult.imported}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">Fallidos</p>
                <p className="text-2xl font-bold text-red-900">
                  {importResult.failed}
                </p>
              </div>
            </div>

            {/* Errors */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Errores Encontrados:
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {importResult.errors.map((error: any, index: number) => (
                    <div
                      key={index}
                      className="text-sm text-yellow-800 bg-yellow-100 rounded p-2"
                    >
                      <span className="font-semibold">Fila {error.row}:</span>{" "}
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Message */}
            {importResult.success && importResult.imported > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-900 font-semibold">
                  ¡Importación completada exitosamente!
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Los productos han sido agregados al catálogo
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

