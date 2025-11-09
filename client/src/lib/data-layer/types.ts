/**
 * Tipos y interfaces para la capa de datos offline
 */

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  subcategory?: string;
  image?: string;
  basePrice: number;
  stock: number;
  isActive: number;
  displayOrder?: number;
  parentSku?: string;
  variantName?: string;
  dimension?: string;
  line1Text?: string;
  line2Text?: string;
  location?: string;
  unitsPerBox?: number;
  minQuantity?: number;
  hideInCatalog?: number;
  createdAt?: string;
  updatedAt?: string;
  localImagePath?: string;
  syncStatus?: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  variantType: string;
  variantValue: string;
  sku?: string;
  stock: number;
  basePrice?: number;
  precioCiudad?: number;
  precioInterior?: number;
  precioEspecial?: number;
  isActive: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PricingByType {
  id?: number;
  productId: string;
  priceType: 'ciudad' | 'interior' | 'especial';
  price: number;
  minQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: string;
  companyName?: string;
  companyTaxId?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isActive: number;
  username?: string;
  contactPerson?: string;
  status?: string;
  clientNumber?: string;
  priceType?: 'ciudad' | 'interior' | 'especial';
  assignedVendorId?: string;
  createdAt?: string;
  lastSignedIn?: string;
}

export interface Order {
  id: string;
  userId: string;
  clientId?: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  synced: number;
  localId?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  customText?: string;
  customSelect?: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  customText?: string;
  customSelect?: string;
  addedAt: string;
  updatedAt?: string;
}

export interface Promotion {
  id: string;
  productId: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncQueueItem {
  id?: number;
  entityType: string;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: string;
  timestamp: string;
  synced: number;
  retries: number;
  lastError?: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
  updatedAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingOrders: number;
  isSyncing: boolean;
}

export interface SyncResult {
  success: boolean;
  productsDownloaded?: number;
  clientsDownloaded?: number;
  imagesDownloaded?: number;
  ordersUploaded?: number;
  errors: string[];
}

export interface CreateOrderInput {
  userId: string;
  clientId?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
    customText?: string;
    customSelect?: string;
  }>;
  notes?: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface AddToCartInput {
  userId: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  customText?: string;
  customSelect?: string;
}

export type PriceType = 'ciudad' | 'interior' | 'especial';
