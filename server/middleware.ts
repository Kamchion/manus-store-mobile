import { TRPCError } from "@trpc/server";
import { hasPermission, canManageUser, type UserRole, type Permission } from "./permissions";

/**
 * Verifica que el usuario tenga un permiso específico
 */
export function requirePermission(permission: keyof Permission) {
  return (opts: { ctx: { user?: { role?: string } } }) => {
    const { ctx } = opts;
    
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Debe iniciar sesión para realizar esta acción",
      });
    }

    const userRole = ctx.user.role as UserRole;
    
    if (!hasPermission(userRole, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No tiene permisos para realizar esta acción",
      });
    }

    return true;
  };
}

/**
 * Verifica que el usuario pueda gestionar otro usuario
 */
export function requireUserManagement(targetRole: UserRole) {
  return (opts: { ctx: { user?: { role?: string } } }) => {
    const { ctx } = opts;
    
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Debe iniciar sesión para realizar esta acción",
      });
    }

    const userRole = ctx.user.role as UserRole;
    
    if (!canManageUser(userRole, targetRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `No tiene permisos para gestionar usuarios con rol ${targetRole}`,
      });
    }

    return true;
  };
}

/**
 * Verifica que el usuario sea administrador
 */
export function requireAdmin(opts: { ctx: { user?: { role?: string } } }) {
  const { ctx } = opts;
  
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Debe iniciar sesión",
    });
  }

  if (ctx.user.role !== 'administrador') {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Solo los administradores pueden realizar esta acción",
    });
  }

  return true;
}

/**
 * Verifica que el usuario tenga acceso al panel de administración
 */
export function requireAdminPanel(opts: { ctx: { user?: { role?: string } } }) {
  const { ctx } = opts;
  
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Debe iniciar sesión",
    });
  }

  const userRole = ctx.user.role as UserRole;
  
  if (!hasPermission(userRole, 'accessAdminPanel')) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tiene acceso al panel de administración",
    });
  }

  return true;
}

