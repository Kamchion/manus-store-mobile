import { eq, and, or, like, desc, sql, isNotNull } from "drizzle-orm";
import { users, orders } from "../drizzle/schema";
import { getDb } from "./db";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

/**
 * Crear un nuevo usuario
 */
export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  gpsLocation?: string;
  clientNumber?: string;
  agentNumber?: string;
  role: "cliente" | "operador" | "administrador" | "vendedor";
  priceType?: "ciudad" | "interior" | "especial";
}) {
  const db = await getDb();

  // Verificar si el email ya existe
  const existingEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingEmail.length > 0) {
    throw new Error("El correo electrónico ya está registrado");
  }

  // Verificar si el username ya existe
  const existingUsername = await db
    .select()
    .from(users)
    .where(eq(users.username, data.username))
    .limit(1);

  if (existingUsername.length > 0) {
    throw new Error("El nombre de usuario ya está en uso");
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Crear el usuario
  const userId = nanoid();
  
  // Generar números automáticos si no se proporcionan
  let clientNumber = data.clientNumber;
  let agentNumber = data.agentNumber;
  
  if (data.role === "cliente" && !clientNumber) {
    // Generar número de cliente automático
    clientNumber = `CLI-${userId.substring(0, 6).toUpperCase()}`;
  }
  
  if (data.role === "vendedor" && !agentNumber) {
    // Generar número de agente automático
    agentNumber = `VEN-${userId.substring(0, 6).toUpperCase()}`;
  }
  
  await db.insert(users).values({
    id: userId,
    username: data.username,
    email: data.email,
    password: hashedPassword,
    name: data.contactPerson || data.companyName,
    companyName: data.companyName,
    contactPerson: data.contactPerson,
    phone: data.phone,
    address: data.address,
    gpsLocation: data.gpsLocation,
    clientNumber,
    agentNumber,
    role: data.role,
    priceType: data.priceType || "ciudad",
    loginMethod: "manual",
    status: "active",
    isActive: true,
  });

  return { success: true, userId };
}

/**
 * Listar usuarios con estadísticas
 */
export async function listUsersWithStats(filters?: {
  search?: string;
  role?: string;
  status?: string;
}) {
  const db = await getDb();

  // Construir la query base
  let query = db
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      companyName: users.companyName,
      contactPerson: users.contactPerson,
      companyTaxId: users.companyTaxId,
      phone: users.phone,
      address: users.address,
      gpsLocation: users.gpsLocation,
      city: users.city,
      state: users.state,
      zipCode: users.zipCode,
      country: users.country,
      clientNumber: users.clientNumber,
      agentNumber: users.agentNumber,
      role: users.role,
      status: users.status,
      priceType: users.priceType,
      isActive: users.isActive,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      totalOrders: sql<number>`(
        SELECT COUNT(*) 
        FROM ${orders} 
        WHERE ${orders.userId} = ${users.id}
      )`.as("totalOrders"),
      totalSpent: sql<number>`(
        SELECT COALESCE(SUM(${orders.total}), 0)
        FROM ${orders}
        WHERE ${orders.userId} = ${users.id}
      )`.as("totalSpent"),
    })
    .from(users);

  // Aplicar filtros
  const conditions = [
    // Solo mostrar usuarios creados con el nuevo sistema (tienen username)
    isNotNull(users.username)
  ];

  if (filters?.search) {
    conditions.push(
      or(
        like(users.companyName, `%${filters.search}%`),
        like(users.contactPerson, `%${filters.search}%`),
        like(users.email, `%${filters.search}%`),
        like(users.username, `%${filters.search}%`)
      )
    );
  }

  if (filters?.role && filters.role !== "all") {
    conditions.push(eq(users.role, filters.role as any));
  }

  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(users.status, filters.status as any));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(desc(users.createdAt));

  console.log('[DEBUG] listUsersWithStats - Filters:', filters);
  console.log('[DEBUG] listUsersWithStats - Result count:', result.length);
  console.log('[DEBUG] listUsersWithStats - First user:', result[0]);

  return result;
}

/**
 * Congelar o descongelar una cuenta
 */
export async function toggleUserFreeze(userId: string) {
  const db = await getDb();

  // Obtener el usuario actual
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Cambiar el estado
  const newStatus = user.status === "active" ? "frozen" : "active";

  await db
    .update(users)
    .set({ status: newStatus })
    .where(eq(users.id, userId));

  return { success: true, newStatus };
}

/**
 * Cambiar contraseña de un usuario
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  const db = await getDb();

  // Verificar que el usuario existe
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Hashear la nueva contraseña
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));

  return { success: true };
}

/**
 * Eliminar un usuario
 */
export async function deleteUser(userId: string) {
  const db = await getDb();

  // Verificar que el usuario existe
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Verificar que no sea el último admin
  if (user.role === "administrador") {
    const adminCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "administrador"));

    if (adminCount[0].count <= 1) {
      throw new Error("No se puede eliminar el último administrador");
    }
  }

  // Eliminar el usuario
  await db.delete(users).where(eq(users.id, userId));

  return { success: true };
}

/**
 * Obtener estadísticas generales de usuarios
 */
export async function getUsersStats() {
  const db = await getDb();

  const stats = await db
    .select({
      totalUsers: sql<number>`COUNT(*)`,
      activeUsers: sql<number>`SUM(CASE WHEN ${users.status} = 'active' THEN 1 ELSE 0 END)`,
      frozenUsers: sql<number>`SUM(CASE WHEN ${users.status} = 'frozen' THEN 1 ELSE 0 END)`,
      newUsersLast30Days: sql<number>`SUM(CASE WHEN ${users.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END)`,
    })
    .from(users);

  // Obtener total de ventas
  const salesStats = await db
    .select({
      totalSales: sql<number>`COALESCE(SUM(${orders.total}), 0)`,
    })
    .from(orders);

  return {
    ...stats[0],
    totalSales: salesStats[0].totalSales,
  };
}


/**
 * Actualizar información de un usuario
 */
export async function updateUser(userId: string, data: {
  username?: string;
  email?: string;
  companyName?: string;
  contactPerson?: string;
  companyTaxId?: string;
  phone?: string;
  address?: string;
  gpsLocation?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  clientNumber?: string;
  agentNumber?: string;
  role?: "cliente" | "operador" | "administrador" | "vendedor";
  priceType?: "ciudad" | "interior" | "especial";
  status?: "active" | "frozen";
}) {
  const db = await getDb();

  // Verificar que el usuario existe
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  // Si se está cambiando el email, verificar que no esté en uso
  if (data.email && data.email !== user.email) {
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingEmail.length > 0) {
      throw new Error("El correo electrónico ya está registrado");
    }
  }

  // Si se está cambiando el username, verificar que no esté en uso
  if (data.username && data.username !== user.username) {
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);

    if (existingUsername.length > 0) {
      throw new Error("El nombre de usuario ya está en uso");
    }
  }

  // Actualizar el usuario
  console.log("[updateUser] Updating user with data:", data);
  console.log("[updateUser] priceType:", data.priceType);
  
  await db
    .update(users)
    .set({
      ...data,
      name: data.contactPerson || data.companyName || user.name,
    })
    .where(eq(users.id, userId));
  
  console.log("[updateUser] Update completed");

  return { success: true };
}

