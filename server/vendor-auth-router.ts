import { eq, and } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { getDb } from "./db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

/**
 * Router de autenticación específico para vendedores
 * Soporta login con usuario/contraseña y generación de JWT tokens
 */
export const vendorAuthRouter = router({
  /**
   * Login para vendedores con usuario y contraseña
   * Genera un JWT token válido por 30 días
   */
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      if (!db) {
        throw new Error("Base de datos no disponible");
      }

      // Buscar usuario por username
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (!user) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      console.log("[vendorAuth.login] Usuario encontrado:", {
        id: user.id,
        username: user.username,
        role: user.role
      });

      // Verificar que el usuario sea vendedor
      if (user.role !== "vendedor") {
        throw new Error("Este usuario no tiene permisos de vendedor");
      }

      // Verificar que el usuario esté activo
      if (!user.isActive) {
        throw new Error("Esta cuenta está inactiva. Contacte al administrador.");
      }

      // Verificar que la cuenta no esté congelada
      if (user.status === "frozen") {
        throw new Error("Esta cuenta está congelada. Contacte al administrador.");
      }

      // Verificar contraseña
      let isValidPassword = false;
      
      if (user.password) {
        // Intentar verificar con bcrypt primero
        try {
          isValidPassword = await bcrypt.compare(input.password, user.password);
        } catch (error) {
          // Si falla bcrypt, comparar en texto plano (para migración)
          isValidPassword = input.password === user.password;
        }
      }

      if (!isValidPassword) {
        throw new Error("Usuario o contraseña incorrectos");
      }

      // Actualizar última fecha de ingreso
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Crear JWT token válido por 30 días
      const token = jwt.sign(
        {
          openId: user.id,
          appId: "b2b_store_vendor",
          name: user.name || user.username || "",
          role: user.role,
          agentNumber: user.agentNumber,
        },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          status: user.status,
          priceType: user.priceType,
        },
      };
    }),

  /**
   * Verificar validez del token JWT
   */
  verify: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const decoded = jwt.verify(input.token, JWT_SECRET) as {
          openId: string;
          appId: string;
          name: string;
          role: string;
        };

        const db = await getDb();
        if (!db) {
          throw new Error("Base de datos no disponible");
        }

        // Verificar que el usuario aún existe y está activo
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, decoded.openId))
          .limit(1);

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        if (!user.isActive || user.status === "frozen") {
          throw new Error("Usuario inactivo o congelado");
        }

        return {
          success: true,
          valid: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      } catch (error: any) {
        return {
          success: false,
          valid: false,
          error: error.message || "Token inválido",
        };
      }
    }),
});
