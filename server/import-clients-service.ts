import * as XLSX from "xlsx";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

/**
 * Servicio de importación de clientes desde Excel
 * 
 * Formato esperado (15 columnas):
 * A: ID (clientNumber/agentNumber)
 * B: Rol (cliente/vendedor/operador/administrador)
 * C: Nombre (companyName)
 * D: Dirección
 * E: Correo
 * F: Persona de contacto
 * G: Teléfono
 * H: Agente asignado (agentNumber - solo para clientes)
 * I: Precio asignado (ciudad/interior/especial)
 * J: Ciudad
 * K: Estado/Departamento
 * L: Código Postal
 * M: País
 * N: Ubicación GPS
 * O: RUC/Tax ID
 */

interface ClientRow {
  id: string;
  rol: string;
  nombre: string;
  direccion: string;
  correo: string;
  personaContacto: string;
  telefono: string;
  agenteAsignado: string;
  precioAsignado: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
  pais: string;
  ubicacionGPS: string;
  ruc: string;
}

interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  total: number;
}

/**
 * Genera un email único agregando sufijo si ya existe
 */
async function generateUniqueEmail(baseEmail: string | null, clientId: string): Promise<string | null> {
  if (!baseEmail || !baseEmail.trim()) {
    return null;
  }
  
  const db = await getDb();
  
  // Verificar si el email ya existe
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, baseEmail))
    .limit(1);
  
  if (existingUser.length === 0) {
    // El email no existe, se puede usar
    return baseEmail;
  }
  
  // El email existe, agregar sufijo con el ID del cliente
  const [localPart, domain] = baseEmail.split('@');
  if (!domain) {
    // Email inválido, retornar null
    return null;
  }
  
  const uniqueEmail = `${localPart}+${clientId}@${domain}`;
  return uniqueEmail;
}

/**
 * Genera un username único basado en el nombre de la empresa
 */
function generateUsername(companyName: string, existingUsernames: Set<string>): string {
  let base = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[^a-z0-9]/g, "_") // Reemplazar caracteres especiales
    .substring(0, 20);
  
  let username = base;
  let counter = 1;
  
  while (existingUsernames.has(username)) {
    username = `${base}_${counter}`;
    counter++;
  }
  
  existingUsernames.add(username);
  return username;
}

/**
 * Valida y normaliza un rol
 */
function validateRole(rol: string): "cliente" | "vendedor" | "operador" | "administrador" | null {
  const normalized = rol.toLowerCase().trim();
  const validRoles = ["cliente", "vendedor", "operador", "administrador"];
  
  if (validRoles.includes(normalized)) {
    return normalized as any;
  }
  
  return null;
}

/**
 * Valida y normaliza un tipo de precio
 */
function validatePriceType(priceType: string): "ciudad" | "interior" | "especial" | null {
  const normalized = priceType.toLowerCase().trim();
  const validTypes = ["ciudad", "interior", "especial"];
  
  if (validTypes.includes(normalized)) {
    return normalized as any;
  }
  
  return null;
}

/**
 * Procesa el archivo Excel y retorna las filas parseadas
 */
function parseExcelFile(buffer: Buffer): ClientRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Saltar la primera fila (encabezados)
  const dataRows = rawData.slice(1);
  
  const clients: ClientRow[] = [];
  
  for (const row of dataRows) {
    // Saltar filas vacías
    if (!row || row.length === 0 || !row[0]) continue;
    
    clients.push({
      id: String(row[0] || "").trim(),
      rol: String(row[1] || "cliente").trim(),
      nombre: String(row[2] || "").trim(),
      direccion: String(row[3] || "").trim(),
      correo: String(row[4] || "").trim(),
      personaContacto: String(row[5] || "").trim(),
      telefono: String(row[6] || "").trim(),
      agenteAsignado: String(row[7] || "").trim(),
      precioAsignado: String(row[8] || "ciudad").trim(),
      ciudad: String(row[9] || "").trim(),
      estado: String(row[10] || "").trim(),
      codigoPostal: String(row[11] || "").trim(),
      pais: String(row[12] || "").trim(),
      ubicacionGPS: String(row[13] || "").trim(),
      ruc: String(row[14] || "").trim(),
    });
  }
  
  return clients;
}

/**
 * Importa clientes desde un archivo Excel
 */
export async function importClientsFromExcel(buffer: Buffer): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    created: 0,
    updated: 0,
    errors: [],
    total: 0,
  };
  
  try {
    const clients = parseExcelFile(buffer);
    result.total = clients.length;
    
    if (clients.length === 0) {
      result.errors.push({
        row: 0,
        error: "El archivo no contiene datos válidos",
      });
      return result;
    }
    
    const existingUsernames = new Set<string>();
    
    // Obtener todos los usernames existentes
    const db = await getDb();
    if (!db) {
      throw new Error("No se pudo conectar a la base de datos");
    }
    const existingUsers = await db.select({ username: users.username }).from(users);
    existingUsers.forEach(u => existingUsernames.add(u.username));
    
    // Procesar cada cliente
    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];
      const rowNumber = i + 2; // +2 porque empezamos en fila 1 y saltamos encabezados
      
      try {
        // Validaciones
        if (!client.nombre) {
          result.errors.push({
            row: rowNumber,
            error: "El nombre es obligatorio",
            data: client,
          });
          continue;
        }
        
        const role = validateRole(client.rol);
        if (!role) {
          result.errors.push({
            row: rowNumber,
            error: `Rol inválido: "${client.rol}". Debe ser: cliente, vendedor, operador o administrador`,
            data: client,
          });
          continue;
        }
        
        const priceType = validatePriceType(client.precioAsignado);
        if (!priceType) {
          result.errors.push({
            row: rowNumber,
            error: `Tipo de precio inválido: "${client.precioAsignado}". Debe ser: ciudad, interior o especial`,
            data: client,
          });
          continue;
        }
        
        // Generar username único
        const username = generateUsername(client.nombre, existingUsernames);
        
        // Generar contraseña por defecto (puede ser cambiada después)
        const defaultPassword = "123456";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        
        // Generar ID único si no se proporciona
        const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Generar email único si hay duplicados
        const uniqueEmail = await generateUniqueEmail(client.correo, client.id);
        
        // Preparar datos del usuario
        const userData: any = {
          id: userId,
          username,
          email: uniqueEmail,
          password: hashedPassword,
          companyName: client.nombre,
          contactPerson: client.personaContacto || null,
          phone: client.telefono || null,
          address: client.direccion || null,
          city: client.ciudad || null,
          state: client.estado || null,
          zipCode: client.codigoPostal || null,
          country: client.pais || null,
          gpsLocation: client.ubicacionGPS || null,
          companyTaxId: client.ruc || null,
          role,
          priceType,
          isActive: true,
          status: 'active',
          createdAt: new Date(),
        };
        
        // Agregar campos específicos según el rol
        if (role === "cliente" && client.id) {
          userData.clientNumber = client.id;
        }
        
        if (role === "vendedor" && client.id) {
          userData.agentNumber = client.id;
        }
        
        // Si es cliente y tiene agente asignado, validar que no esté vacío
        if (role === "cliente" && client.agenteAsignado && client.agenteAsignado.trim()) {
          // Guardar el agentNumber tal como viene, será null si está vacío
          userData.agentNumber = client.agenteAsignado.trim();
        } else if (role === "cliente") {
          // Si es cliente y no tiene agente asignado, dejar null
          userData.agentNumber = null;
        }
        
        // Verificar si el cliente ya existe por clientNumber o username
        let existingUser = null;
        if (client.id) {
          const found = await db
            .select()
            .from(users)
            .where(
              role === "cliente" 
                ? eq(users.clientNumber, client.id)
                : eq(users.agentNumber, client.id)
            )
            .limit(1);
          
          if (found.length > 0) {
            existingUser = found[0];
          }
        }
        
        if (existingUser) {
          // Generar email único para actualización si hay duplicados
          const updateEmail = await generateUniqueEmail(client.correo, client.id);
          
          // Actualizar usuario existente
          await db
            .update(users)
            .set({
              companyName: client.nombre,
              email: updateEmail,
              contactPerson: client.personaContacto || null,
              phone: client.telefono || null,
              address: client.direccion || null,
              city: client.ciudad || null,
              state: client.estado || null,
              zipCode: client.codigoPostal || null,
              country: client.pais || null,
              gpsLocation: client.ubicacionGPS || null,
              companyTaxId: client.ruc || null,
              role,
              priceType,
              status: 'active',
              agentNumber: role === "cliente" && client.agenteAsignado && client.agenteAsignado.trim() ? client.agenteAsignado.trim() : (role === "cliente" ? null : existingUser.agentNumber),
            })
            .where(eq(users.id, existingUser.id));
          
          result.updated++;
        } else {
          // Crear nuevo usuario
          await db.insert(users).values(userData);
          result.created++;
        }
        
      } catch (error: any) {
        result.errors.push({
          row: rowNumber,
          error: error.message || "Error desconocido",
          data: client,
        });
      }
    }
    
    result.success = result.errors.length < result.total;
    
  } catch (error: any) {
    result.errors.push({
      row: 0,
      error: `Error al procesar el archivo: ${error.message}`,
    });
  }
  
  return result;
}

/**
 * Exporta clientes a formato Excel
 */
export async function exportClientsToExcel(): Promise<Buffer> {
  const db = await getDb();
  if (!db) {
    throw new Error("No se pudo conectar a la base de datos");
  }
  
  // Obtener todos los usuarios
  const allUsers = await db.select().from(users).orderBy(users.createdAt);
  
  // Preparar datos para Excel
  const data = [
    // Encabezados
    ["ID", "Rol", "Nombre", "Dirección", "Correo", "Persona de Contacto", "Teléfono", "Agente Asignado", "Precio Asignado", "Ciudad", "Estado", "Código Postal", "País", "Ubicación GPS", "RUC"],
    // Datos
    ...allUsers.map(user => [
      user.role === "cliente" ? (user.clientNumber || "") : (user.agentNumber || ""),
      user.role || "cliente",
      user.companyName || "",
      user.address || "",
      user.email || "",
      user.contactPerson || "",
      user.phone || "",
      user.role === "cliente" ? (user.agentNumber || "") : "",
      user.priceType || "ciudad",
      user.city || "",
      user.state || "",
      user.zipCode || "",
      user.country || "",
      user.gpsLocation || "",
      user.companyTaxId || "",
    ]),
  ];
  
  // Crear workbook y worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clientes");
  
  // Generar buffer
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  
  return buffer;
}

