/**
 * Sistema de Roles y Permisos
 * 
 * Roles:
 * - cliente: Usuario final que compra productos
 * - operador: Puede gestionar pedidos, usuarios (excepto admins) y ver productos
 * - administrador: Acceso total al sistema
 * - vendedor: Agente de ventas rutero, gestiona sus clientes
 */

export type UserRole = 'cliente' | 'operador' | 'administrador' | 'vendedor';
export type PriceType = 'ciudad' | 'interior' | 'especial';

export interface Permission {
  // Productos
  viewProducts: boolean;
  createProducts: boolean;
  editProducts: boolean;
  deleteProducts: boolean;
  importProducts: boolean;
  
  // Usuarios
  viewUsers: boolean;
  createUsers: boolean;
  editUsers: boolean;
  deleteUsers: boolean;
  createAdminUsers: boolean;
  
  // Pedidos
  viewOrders: boolean;
  createOrders: boolean;
  editOrders: boolean;
  deleteOrders: boolean;
  viewAllOrders: boolean; // Ver pedidos de todos los usuarios
  
  // Panel de administración
  accessAdminPanel: boolean;
  viewStatistics: boolean;
  
  // Clientes (para vendedores)
  viewOwnClients: boolean;
  manageOwnClients: boolean;
}

// Definición de permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  cliente: {
    viewProducts: true,
    createProducts: false,
    editProducts: false,
    deleteProducts: false,
    importProducts: false,
    
    viewUsers: false,
    createUsers: false,
    editUsers: false,
    deleteUsers: false,
    createAdminUsers: false,
    
    viewOrders: true, // Solo sus propios pedidos
    createOrders: true,
    editOrders: false,
    deleteOrders: false,
    viewAllOrders: false,
    
    accessAdminPanel: false,
    viewStatistics: false,
    
    viewOwnClients: false,
    manageOwnClients: false,
  },
  
  operador: {
    viewProducts: true,
    createProducts: false, // NO puede acceder a la pestaña de productos
    editProducts: false,
    deleteProducts: false,
    importProducts: false,
    
    viewUsers: true,
    createUsers: true,
    editUsers: true,
    deleteUsers: true,
    createAdminUsers: false, // NO puede crear administradores
    
    viewOrders: true,
    createOrders: true,
    editOrders: true,
    deleteOrders: true,
    viewAllOrders: true,
    
    accessAdminPanel: true,
    viewStatistics: true,
    
    viewOwnClients: false,
    manageOwnClients: false,
  },
  
  administrador: {
    viewProducts: true,
    createProducts: true,
    editProducts: true,
    deleteProducts: true,
    importProducts: true,
    
    viewUsers: true,
    createUsers: true,
    editUsers: true,
    deleteUsers: true,
    createAdminUsers: true, // Puede crear otros administradores
    
    viewOrders: true,
    createOrders: true,
    editOrders: true,
    deleteOrders: true,
    viewAllOrders: true,
    
    accessAdminPanel: true,
    viewStatistics: true,
    
    viewOwnClients: false,
    manageOwnClients: false,
  },
  
  vendedor: {
    viewProducts: true,
    createProducts: false,
    editProducts: false,
    deleteProducts: false,
    importProducts: false,
    
    viewUsers: false,
    createUsers: true, // Puede crear sus propios clientes
    editUsers: true, // Solo sus clientes
    deleteUsers: false,
    createAdminUsers: false,
    
    viewOrders: true, // Solo pedidos de sus clientes
    createOrders: true,
    editOrders: true,
    deleteOrders: false,
    viewAllOrders: false,
    
    accessAdminPanel: true, // Acceso limitado al panel
    viewStatistics: true, // Solo estadísticas de sus clientes
    
    viewOwnClients: true,
    manageOwnClients: true,
  },
};

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Verifica si un usuario puede realizar una acción sobre otro usuario
 */
export function canManageUser(actorRole: UserRole, targetRole: UserRole): boolean {
  // Administradores pueden gestionar a todos
  if (actorRole === 'administrador') {
    return true;
  }
  
  // Operadores pueden gestionar a todos excepto administradores
  if (actorRole === 'operador') {
    return targetRole !== 'administrador';
  }
  
  // Vendedores solo pueden gestionar clientes
  if (actorRole === 'vendedor') {
    return targetRole === 'cliente';
  }
  
  return false;
}

/**
 * Obtiene los roles que un usuario puede crear
 */
export function getCreatableRoles(role: UserRole): UserRole[] {
  switch (role) {
    case 'administrador':
      return ['cliente', 'operador', 'administrador', 'vendedor'];
    case 'operador':
      return ['cliente', 'vendedor'];
    case 'vendedor':
      return ['cliente'];
    default:
      return [];
  }
}

/**
 * Información descriptiva de los roles
 */
export const ROLE_INFO: Record<UserRole, { name: string; description: string }> = {
  cliente: {
    name: 'Cliente',
    description: 'Usuario final que puede realizar compras y ver sus pedidos',
  },
  operador: {
    name: 'Operador',
    description: 'Gestiona pedidos y usuarios, pero no puede acceder a productos ni crear administradores',
  },
  administrador: {
    name: 'Administrador',
    description: 'Acceso total al sistema, puede gestionar todo',
  },
  vendedor: {
    name: 'Vendedor',
    description: 'Agente de ventas rutero que gestiona sus propios clientes',
  },
};

/**
 * Información descriptiva de los tipos de precio
 */
export const PRICE_TYPE_INFO: Record<PriceType, { name: string; description: string }> = {
  ciudad: {
    name: 'Ciudad',
    description: 'Precio para clientes de ciudad',
  },
  interior: {
    name: 'Interior',
    description: 'Precio para clientes del interior',
  },
  especial: {
    name: 'Especial',
    description: 'Precio especial para clientes VIP o mayoristas',
  },
};

