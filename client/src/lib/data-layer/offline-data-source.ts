import { databaseManager } from '../capacitor/database';
import { IDataSource } from './data-source.interface';
import type {
  Product,
  ProductVariant,
  User,
  Order,
  OrderItem,
  CartItem,
  Promotion,
  CreateOrderInput,
  AddToCartInput,
  PriceType,
  PricingByType,
  SyncQueueItem
} from './types';
import { nanoid } from 'nanoid';

/**
 * Implementación de DataSource que lee/escribe desde SQLite local
 */
export class OfflineDataSource implements IDataSource {
  constructor() {}

  // ========== Products ==========

  async getProducts(): Promise<Product[]> {
    return await databaseManager.query<Product>(
      'SELECT * FROM products WHERE isActive = 1 AND hideInCatalog = 0 ORDER BY displayOrder, name'
    );
  }

  async getProduct(id: string): Promise<Product | null> {
    const results = await databaseManager.query<Product>(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return await databaseManager.query<ProductVariant>(
      'SELECT * FROM productVariants WHERE productId = ? AND isActive = 1',
      [productId]
    );
  }

  async getPriceForProduct(productId: string, priceType: PriceType): Promise<number> {
    // Primero intentar obtener de pricingByType
    const pricing = await databaseManager.query<PricingByType>(
      'SELECT price FROM pricingByType WHERE productId = ? AND priceType = ?',
      [productId, priceType]
    );

    if (pricing.length > 0) {
      return pricing[0].price;
    }

    // Si no hay precio específico, obtener basePrice del producto
    const product = await this.getProduct(productId);
    return product?.basePrice || 0;
  }

  /**
   * Guardar productos en la base de datos local
   */
  async saveProducts(products: Product[]): Promise<void> {
    const statements = products.map(product => ({
      sql: `INSERT OR REPLACE INTO products (
        id, sku, name, description, category, subcategory, image, basePrice, stock,
        isActive, displayOrder, parentSku, variantName, dimension, line1Text, line2Text,
        location, unitsPerBox, minQuantity, hideInCatalog, createdAt, updatedAt, syncStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        product.id,
        product.sku,
        product.name,
        product.description || null,
        product.category || null,
        product.subcategory || null,
        product.image || null,
        product.basePrice,
        product.stock,
        product.isActive,
        product.displayOrder || null,
        product.parentSku || null,
        product.variantName || null,
        product.dimension || null,
        product.line1Text || null,
        product.line2Text || null,
        product.location || null,
        product.unitsPerBox || 0,
        product.minQuantity || 1,
        product.hideInCatalog || 0,
        product.createdAt || new Date().toISOString(),
        product.updatedAt || new Date().toISOString(),
        1 // syncStatus
      ]
    }));

    await databaseManager.executeTransaction(statements);
  }

  /**
   * Actualizar productos existentes
   */
  async updateProducts(products: Product[]): Promise<void> {
    await this.saveProducts(products);
  }

  // ========== Clients ==========

  async getClients(): Promise<User[]> {
    return await databaseManager.query<User>(
      'SELECT * FROM users WHERE role = ? AND isActive = 1 ORDER BY companyName',
      ['cliente']
    );
  }

  async getClient(id: string): Promise<User | null> {
    const results = await databaseManager.query<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return results[0] || null;
  }

  /**
   * Guardar clientes en la base de datos local
   */
  async saveClients(clients: User[]): Promise<void> {
    const statements = clients.map(client => ({
      sql: `INSERT OR REPLACE INTO users (
        id, name, email, role, companyName, companyTaxId, phone, address, city, state,
        zipCode, country, isActive, username, contactPerson, status, clientNumber,
        priceType, assignedVendorId, createdAt, lastSignedIn
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        client.id,
        client.name || null,
        client.email || null,
        client.role,
        client.companyName || null,
        client.companyTaxId || null,
        client.phone || null,
        client.address || null,
        client.city || null,
        client.state || null,
        client.zipCode || null,
        client.country || null,
        client.isActive,
        client.username || null,
        client.contactPerson || null,
        client.status || 'active',
        client.clientNumber || null,
        client.priceType || 'ciudad',
        client.assignedVendorId || null,
        client.createdAt || new Date().toISOString(),
        client.lastSignedIn || null
      ]
    }));

    await databaseManager.executeTransaction(statements);
  }

  // ========== Orders ==========

  async createOrder(orderInput: CreateOrderInput): Promise<Order> {
    const localId = `local_${Date.now()}_${nanoid(10)}`;
    const orderNumber = `ORD-${Date.now()}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: localId,
      localId,
      userId: orderInput.userId,
      clientId: orderInput.clientId,
      orderNumber,
      status: 'pending',
      subtotal: orderInput.subtotal,
      tax: orderInput.tax,
      total: orderInput.total,
      notes: orderInput.notes,
      createdAt: now,
      updatedAt: now,
      synced: 0
    };

    // Insertar orden
    await databaseManager.run(
      `INSERT INTO orders (
        id, localId, userId, clientId, orderNumber, status, subtotal, tax, total,
        notes, createdAt, updatedAt, synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order.id,
        order.localId,
        order.userId,
        order.clientId || null,
        order.orderNumber,
        order.status,
        order.subtotal,
        order.tax,
        order.total,
        order.notes || null,
        order.createdAt,
        order.updatedAt,
        order.synced
      ]
    );

    // Insertar items
    const itemStatements = orderInput.items.map(item => ({
      sql: `INSERT INTO orderItems (
        id, orderId, productId, productName, quantity, pricePerUnit, subtotal,
        customText, customSelect, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        `item_${nanoid(10)}`,
        order.id,
        item.productId,
        item.productName,
        item.quantity,
        item.pricePerUnit,
        item.subtotal,
        item.customText || null,
        item.customSelect || null,
        now
      ]
    }));

    await databaseManager.executeTransaction(itemStatements);

    // Agregar a cola de sincronización
    await this.addToSyncQueue('order', order.id, 'CREATE', JSON.stringify(orderInput));

    return order;
  }

  async getOrders(): Promise<Order[]> {
    return await databaseManager.query<Order>(
      'SELECT * FROM orders ORDER BY createdAt DESC'
    );
  }

  async getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
    const orders = await databaseManager.query<Order>(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );

    if (orders.length === 0) {
      return null;
    }

    const items = await databaseManager.query<OrderItem>(
      'SELECT * FROM orderItems WHERE orderId = ?',
      [id]
    );

    return {
      ...orders[0],
      items
    };
  }

  async getPendingOrders(): Promise<Order[]> {
    return await databaseManager.query<Order>(
      'SELECT * FROM orders WHERE synced = 0 ORDER BY createdAt'
    );
  }

  /**
   * Marcar un pedido como sincronizado
   */
  async markOrderAsSynced(localId: string): Promise<void> {
    await databaseManager.run(
      'UPDATE orders SET synced = 1 WHERE localId = ?',
      [localId]
    );
  }

  /**
   * Actualizar ID de pedido con el ID del servidor
   */
  async updateOrderId(localId: string, serverId: string): Promise<void> {
    await databaseManager.run(
      'UPDATE orders SET id = ? WHERE localId = ?',
      [serverId, localId]
    );
  }

  /**
   * Obtener conteo de pedidos pendientes
   */
  async getPendingOrdersCount(): Promise<number> {
    const result = await databaseManager.query<{ count: number }>(
      'SELECT COUNT(*) as count FROM orders WHERE synced = 0'
    );
    return result[0]?.count || 0;
  }

  // ========== Cart ==========

  async getCartItems(): Promise<CartItem[]> {
    return await databaseManager.query<CartItem>(
      'SELECT * FROM cartItems ORDER BY addedAt DESC'
    );
  }

  async addToCart(item: AddToCartInput): Promise<CartItem> {
    const id = nanoid();
    const now = new Date().toISOString();

    const cartItem: CartItem = {
      id,
      userId: item.userId,
      productId: item.productId,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      customText: item.customText,
      customSelect: item.customSelect,
      addedAt: now,
      updatedAt: now
    };

    await databaseManager.run(
      `INSERT INTO cartItems (
        id, userId, productId, quantity, pricePerUnit, customText, customSelect,
        addedAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cartItem.id,
        cartItem.userId,
        cartItem.productId,
        cartItem.quantity,
        cartItem.pricePerUnit,
        cartItem.customText || null,
        cartItem.customSelect || null,
        cartItem.addedAt,
        cartItem.updatedAt
      ]
    );

    return cartItem;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem> {
    await databaseManager.run(
      'UPDATE cartItems SET quantity = ?, updatedAt = ? WHERE id = ?',
      [quantity, new Date().toISOString(), id]
    );

    const results = await databaseManager.query<CartItem>(
      'SELECT * FROM cartItems WHERE id = ?',
      [id]
    );

    return results[0];
  }

  async removeFromCart(id: string): Promise<void> {
    await databaseManager.run('DELETE FROM cartItems WHERE id = ?', [id]);
  }

  async clearCart(): Promise<void> {
    await databaseManager.run('DELETE FROM cartItems');
  }

  // ========== Promotions ==========

  async getActivePromotions(): Promise<Promotion[]> {
    const now = new Date().toISOString();
    return await databaseManager.query<Promotion>(
      'SELECT * FROM promotions WHERE isActive = 1 AND startDate <= ? AND endDate >= ?',
      [now, now]
    );
  }

  async getPromotionsForProduct(productId: string): Promise<Promotion[]> {
    const now = new Date().toISOString();
    return await databaseManager.query<Promotion>(
      'SELECT * FROM promotions WHERE productId = ? AND isActive = 1 AND startDate <= ? AND endDate >= ?',
      [productId, now, now]
    );
  }

  /**
   * Guardar promociones en la base de datos local
   */
  async savePromotions(promotions: Promotion[]): Promise<void> {
    const statements = promotions.map(promo => ({
      sql: `INSERT OR REPLACE INTO promotions (
        id, productId, name, description, discountType, discountValue, startDate,
        endDate, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        promo.id,
        promo.productId,
        promo.name,
        promo.description || null,
        promo.discountType,
        promo.discountValue,
        promo.startDate,
        promo.endDate,
        promo.isActive,
        promo.createdAt || new Date().toISOString(),
        promo.updatedAt || new Date().toISOString()
      ]
    }));

    await databaseManager.executeTransaction(statements);
  }

  // ========== Pricing ==========

  /**
   * Guardar precios por tipo en la base de datos local
   */
  async savePricing(pricing: PricingByType[]): Promise<void> {
    const statements = pricing.map(price => ({
      sql: `INSERT OR REPLACE INTO pricingByType (
        productId, priceType, price, minQuantity, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      params: [
        price.productId,
        price.priceType,
        price.price,
        price.minQuantity || 1,
        price.createdAt || new Date().toISOString(),
        price.updatedAt || new Date().toISOString()
      ]
    }));

    await databaseManager.executeTransaction(statements);
  }

  /**
   * Actualizar precios existentes
   */
  async updatePricing(pricing: PricingByType[]): Promise<void> {
    await this.savePricing(pricing);
  }

  // ========== Sync Queue ==========

  /**
   * Agregar item a la cola de sincronización
   */
  async addToSyncQueue(
    entityType: string,
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: string
  ): Promise<void> {
    await databaseManager.run(
      `INSERT INTO sync_queue (entityType, entityId, operation, data, timestamp, synced, retries)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [entityType, entityId, operation, data, new Date().toISOString(), 0, 0]
    );
  }

  /**
   * Obtener items pendientes de sincronización
   */
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return await databaseManager.query<SyncQueueItem>(
      'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY timestamp'
    );
  }

  /**
   * Marcar item de sincronización como completado
   */
  async markSyncItemComplete(id: number): Promise<void> {
    await databaseManager.run(
      'UPDATE sync_queue SET synced = 1 WHERE id = ?',
      [id]
    );
  }

  /**
   * Remover item de la cola de sincronización
   */
  async removeFromSyncQueue(entityType: string, entityId: string): Promise<void> {
    await databaseManager.run(
      'DELETE FROM sync_queue WHERE entityType = ? AND entityId = ?',
      [entityType, entityId]
    );
  }

  /**
   * Actualizar error en item de sincronización
   */
  async updateSyncQueueError(entityType: string, entityId: string, error: string): Promise<void> {
    await databaseManager.run(
      'UPDATE sync_queue SET retries = retries + 1, lastError = ? WHERE entityType = ? AND entityId = ?',
      [error, entityType, entityId]
    );
  }

  // ========== Sync Metadata ==========

  /**
   * Obtener metadata de sincronización
   */
  async getSyncMetadata(key: string): Promise<string | null> {
    const results = await databaseManager.query<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      [key]
    );
    return results[0]?.value || null;
  }

  /**
   * Actualizar metadata de sincronización
   */
  async updateSyncMetadata(key: string, value: string): Promise<void> {
    await databaseManager.run(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updatedAt)
       VALUES (?, ?, ?)`,
      [key, value, new Date().toISOString()]
    );
  }
}

// Exportar instancia singleton
export const offlineDataSource = new OfflineDataSource();
