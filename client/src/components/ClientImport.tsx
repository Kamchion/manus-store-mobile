import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errorUtils";

/**
 * Componente para importar y exportar clientes desde/hacia Excel
 */
export default function ClientImport() {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExcelFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!excelFile) {
      toast.error("Por favor selecciona un archivo Excel");
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("excel", excelFile);

      const response = await fetch("/api/import/clients", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setImportResult(result);

      if (result.success) {
        toast.success(`Importación exitosa! Creados: ${result.created}, Actualizados: ${result.updated}, Errores: ${result.errors.length}`);
      } else {
        toast.warning(`Importación completada con errores. Creados: ${result.created}, Actualizados: ${result.updated}, Errores: ${result.errors.length}`);
      }
    } catch (error: any) {
      console.error("Error al importar:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch("/api/import/clients/export", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Error al exportar clientes");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clientes_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Clientes exportados exitosamente");
    } catch (error: any) {
      console.error("Error al exportar:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  const downloadTemplate = () => {
    // Descargar plantilla completa de Excel
    const link = document.createElement("a");
    link.href = "/plantillas/PLANTILLA_CLIENTES_COMPLETA.xlsx";
    link.download = "PLANTILLA_CLIENTES_COMPLETA.xlsx";
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar y Exportar Clientes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Instrucciones</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Descarga la plantilla CSV o exporta los clientes existentes</li>
              <li>Completa el archivo Excel con los datos de los clientes</li>
              <li>Sube el archivo para importar los clientes</li>
              <li>Los clientes existentes se actualizarán, los nuevos se crearán</li>
            </ol>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Importante</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              <li>La contraseña por defecto para usuarios nuevos es: <code className="bg-yellow-100 px-1 rounded">123456</code></li>
              <li>Los usuarios deben cambiar su contraseña después del primer login</li>
              <li>El ID es obligatorio para clientes y vendedores</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Formato de Columnas */}
      <Card>
        <CardHeader>
          <CardTitle>Formato del Archivo Excel (15 Columnas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">Columna</th>
                  <th className="border px-3 py-2 text-left">Campo</th>
                  <th className="border px-3 py-2 text-left">Descripción</th>
                  <th className="border px-3 py-2 text-left">Ejemplo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2 font-mono">A</td>
                  <td className="border px-3 py-2 font-semibold">ID</td>
                  <td className="border px-3 py-2">Número de cliente o agente</td>
                  <td className="border px-3 py-2 font-mono text-xs">CLI-001, VEN-15</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border px-3 py-2 font-mono">B</td>
                  <td className="border px-3 py-2 font-semibold">Rol</td>
                  <td className="border px-3 py-2">cliente, vendedor, operador, administrador</td>
                  <td className="border px-3 py-2 font-mono text-xs">cliente</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-mono">C</td>
                  <td className="border px-3 py-2 font-semibold">Nombre</td>
                  <td className="border px-3 py-2">Nombre de la empresa/negocio</td>
                  <td className="border px-3 py-2 font-mono text-xs">Tienda ABC S.A.</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border px-3 py-2 font-mono">D</td>
                  <td className="border px-3 py-2 font-semibold">Dirección</td>
                  <td className="border px-3 py-2">Dirección completa</td>
                  <td className="border px-3 py-2 font-mono text-xs">Calle 123, Ciudad</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-mono">E</td>
                  <td className="border px-3 py-2 font-semibold">Correo</td>
                  <td className="border px-3 py-2">Email (opcional)</td>
                  <td className="border px-3 py-2 font-mono text-xs">contacto@tienda.com</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border px-3 py-2 font-mono">F</td>
                  <td className="border px-3 py-2 font-semibold">Persona de Contacto</td>
                  <td className="border px-3 py-2">Nombre del contacto</td>
                  <td className="border px-3 py-2 font-mono text-xs">Juan Pérez</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-mono">G</td>
                  <td className="border px-3 py-2 font-semibold">Teléfono</td>
                  <td className="border px-3 py-2">Número de teléfono</td>
                  <td className="border px-3 py-2 font-mono text-xs">555-1234</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border px-3 py-2 font-mono">H</td>
                  <td className="border px-3 py-2 font-semibold">Agente Asignado</td>
                  <td className="border px-3 py-2">ID del vendedor (solo para clientes)</td>
                  <td className="border px-3 py-2 font-mono text-xs">VEN-15</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-mono">I</td>
                  <td className="border px-3 py-2 font-semibold">Precio Asignado</td>
                  <td className="border px-3 py-2">ciudad, interior, especial</td>
                  <td className="border px-3 py-2 font-mono text-xs">ciudad</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border px-3 py-2 font-mono">J</td>
                  <td className="border px-3 py-2 font-semibold">Ciudad</td>
                  <td className="border px-3 py-2">Ciudad del cliente</td>
                  <td className="border px-3 py-2 font-mono text-xs">Montevideo</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-mono">K</td>
                  <td className="border px-3 py-2 font-semibold">Estado/Departamento</td>
                  <td className="border px-3 py-2">Estado o departamento</td>
                  <td className="border px-3 py-2 font-mono text-xs">Montevideo</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border px-3 py-2 font-mono">L</td>
                  <td className="border px-3 py-2 font-semibold">Código Postal</td>
                  <td className="border px-3 py-2">Código postal</td>
                  <td className="border px-3 py-2 font-mono text-xs">11200</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-mono">M</td>
                  <td className="border px-3 py-2 font-semibold">País</td>
                  <td className="border px-3 py-2">País del cliente</td>
                  <td className="border px-3 py-2 font-mono text-xs">Uruguay</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="border px-3 py-2 font-mono">N</td>
                  <td className="border px-3 py-2 font-semibold">Ubicación GPS</td>
                  <td className="border px-3 py-2">Coordenadas GPS o enlace</td>
                  <td className="border px-3 py-2 font-mono text-xs">-34.123, -56.789</td>
                </tr>
                <tr>
                  <td className="border px-3 py-2 font-mono">O</td>
                  <td className="border px-3 py-2 font-semibold">RUC/Tax ID</td>
                  <td className="border px-3 py-2">Número de RUC o Tax ID</td>
                  <td className="border px-3 py-2 font-mono text-xs">123456789012</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Exportar Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Clientes Existentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Descarga todos los clientes actuales en formato Excel para editarlos o como respaldo.
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar Clientes a Excel"}
          </Button>
        </CardContent>
      </Card>

      {/* Descargar Plantilla */}
      <Card>
        <CardHeader>
          <CardTitle>Descargar Plantilla</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Descarga una plantilla Excel completa con 15 columnas y 8 ejemplos de usuarios (3 vendedores y 5 clientes).
          </p>
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Descargar Plantilla Completa con Ejemplos
          </Button>
          <p className="text-xs text-gray-600 mt-2">
            Incluye todos los campos: ID, Rol, Nombre, Dirección, Correo, Contacto, Teléfono, Agente, Precio, Ciudad, Estado, CP, País, GPS, RUC
          </p>
        </CardContent>
      </Card>

      {/* Importar Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Importar Clientes desde Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Archivo Excel (.xlsx, .xls, .csv)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {excelFile && (
              <p className="text-sm text-gray-600 mt-2">
                Archivo seleccionado: {excelFile.name}
              </p>
            )}
          </div>

          <Button
            onClick={handleImport}
            disabled={!excelFile || isImporting}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importando..." : "Importar Clientes"}
          </Button>
        </CardContent>
      </Card>

      {/* Resultados de Importación */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Resultados de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">{importResult.created}</p>
                <p className="text-sm text-green-600">Creados</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">{importResult.updated}</p>
                <p className="text-sm text-blue-600">Actualizados</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-red-700">{importResult.errors.length}</p>
                <p className="text-sm text-red-600">Errores</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">Errores Encontrados:</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {importResult.errors.map((error: any, index: number) => (
                    <div key={index} className="text-sm text-red-800 bg-white p-2 rounded">
                      <p className="font-semibold">Fila {error.row}: {error.error}</p>
                      {error.data && (
                        <p className="text-xs text-red-600 mt-1">
                          Datos: {JSON.stringify(error.data)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

