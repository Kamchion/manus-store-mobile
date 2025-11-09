import { Request, Response } from "express";
import { importClientsFromExcel, exportClientsToExcel } from "./import-clients-service";
import * as XLSX from "xlsx";

/**
 * Handle client import from Excel
 */
export async function handleClientImport(req: Request, res: Response) {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files || !files.excel) {
      return res.status(400).json({ 
        success: false,
        error: "Se requiere un archivo Excel" 
      });
    }

    const excelFile = files.excel[0];
    
    // Read the file as buffer
    const fs = await import("fs/promises");
    const buffer = await fs.readFile(excelFile.path);

    console.log("📊 Iniciando importación de clientes...");
    const result = await importClientsFromExcel(buffer);

    // Cleanup temporary file
    try {
      await fs.unlink(excelFile.path);
    } catch (error) {
      console.warn("No se pudo eliminar el archivo temporal:", error);
    }

    console.log(`✅ Importación completada: ${result.created} creados, ${result.updated} actualizados, ${result.errors.length} errores`);
    
    res.json(result);
  } catch (error: any) {
    console.error("❌ Error en la importación de clientes:", error);
    res.status(500).json({
      success: false,
      created: 0,
      updated: 0,
      total: 0,
      errors: [{ row: 0, error: error.message || "Error desconocido durante la importación" }],
    });
  }
}

/**
 * Handle client export to Excel
 */
export async function handleClientExport(req: Request, res: Response) {
  try {
    console.log("📊 Exportando clientes a Excel...");
    const buffer = await exportClientsToExcel();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=clientes_${new Date().toISOString().split("T")[0]}.xlsx`
    );

    console.log("✅ Exportación completada");
    res.send(buffer);
  } catch (error: any) {
    console.error("❌ Error en la exportación de clientes:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Error al exportar clientes",
    });
  }
}

