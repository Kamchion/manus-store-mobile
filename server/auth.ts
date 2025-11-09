import { eq, or } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const COOKIE_NAME = "app_session_id";

/**
 * Login con username/email y contraseña
 */
export async function loginWithPassword(credentials: {
  usernameOrEmail: string;
  password: string;
}) {
  const db = await getDb();

  // Buscar usuario por username o email
  const [user] = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.username, credentials.usernameOrEmail),
        eq(users.email, credentials.usernameOrEmail)
      )
    )
    .limit(1);

  if (!user) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  // Verificar que el usuario tenga contraseña (no sea OAuth)
  if (!user.password) {
    throw new Error("Este usuario no tiene contraseña configurada");
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(credentials.password, user.password);

  if (!isValidPassword) {
    throw new Error("Usuario o contraseña incorrectos");
  }

  // Verificar que la cuenta esté activa
  if (user.status === "frozen") {
    throw new Error("Esta cuenta está congelada. Contacte al administrador.");
  }

  // Actualizar última fecha de ingreso
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  // Crear JWT token
  const token = jwt.sign(
    {
      openId: user.id,
      appId: "b2b_store_001",
      name: user.name || user.username || "",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      companyName: user.companyName,
    },
  };
}

/**
 * Verificar token JWT
 */
export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      openId: string;
      appId: string;
      name: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

