import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

/**
 * Database Manager para SQLite local
 * Maneja la conexión y operaciones con la base de datos offline
 */
class DatabaseManager {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'manusstore';
  private readonly DB_VERSION = 1;
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Inicializar la base de datos
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Solo funciona en plataformas nativas
      if (!Capacitor.isNativePlatform()) {
        console.warn('SQLite solo funciona en plataformas nativas');
        return;
      }

      // Crear conexión
      const ret = await this.sqlite.checkConnectionsConsistency();
      const isConn = (await this.sqlite.isConnection(this.DB_NAME, false)).result;

      if (ret.result && isConn) {
        this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
      } else {
        this.db = await this.sqlite.createConnection(
          this.DB_NAME,
          false,
          'no-encryption',
          this.DB_VERSION,
          false
        );
      }

      await this.db.open();
      await this.createTables();
      this.isInitialized = true;

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Crear todas las tablas necesarias
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      // Tabla de productos
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        subcategory TEXT,
        image TEXT,
        basePrice REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        isActive INTEGER DEFAULT 1,
        displayOrder INTEGER,
        parentSku TEXT,
        variantName TEXT,
        dimension TEXT,
        line1Text TEXT,
        line2Text TEXT,
        location TEXT,
        unitsPerBox INTEGER DEFAULT 0,
        minQuantity INTEGER DEFAULT 1,
        hideInCatalog INTEGER DEFAULT 0,
        createdAt TEXT,
        updatedAt TEXT,
        localImagePath TEXT,
        syncStatus INTEGER DEFAULT 1
      )`,

      // Índices para productos
      `CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`,
      `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
      `CREATE INDEX IF NOT EXISTS idx_products_active ON products(isActive)`,

      // Tabla de variantes de productos
      `CREATE TABLE IF NOT EXISTS productVariants (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        variantType TEXT NOT NULL,
        variantValue TEXT NOT NULL,
        sku TEXT,
        stock INTEGER DEFAULT 0,
        basePrice REAL,
        precioCiudad REAL,
        precioInterior REAL,
        precioEspecial REAL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (productId) REFERENCES products(id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_variants_product ON productVariants(productId)`,

      // Tabla de precios por tipo
      `CREATE TABLE IF NOT EXISTS pricingByType (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId TEXT NOT NULL,
        priceType TEXT NOT NULL CHECK(priceType IN ('ciudad', 'interior', 'especial')),
        price REAL NOT NULL,
        minQuantity INTEGER DEFAULT 1,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (productId) REFERENCES products(id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_pricing_product ON pricingByType(productId)`,
      `CREATE INDEX IF NOT EXISTS idx_pricing_type ON pricingByType(priceType)`,

      // Tabla de usuarios (clientes)
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        role TEXT NOT NULL,
        companyName TEXT,
        companyTaxId TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zipCode TEXT,
        country TEXT,
        isActive INTEGER DEFAULT 1,
        username TEXT,
        contactPerson TEXT,
        status TEXT DEFAULT 'active',
        clientNumber TEXT,
        priceType TEXT DEFAULT 'ciudad',
        assignedVendorId TEXT,
        createdAt TEXT,
        lastSignedIn TEXT
      )`,

      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_vendor ON users(assignedVendorId)`,

      // Tabla de pedidos
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        clientId TEXT,
        orderNumber TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        subtotal REAL NOT NULL,
        tax REAL DEFAULT 0,
        total REAL NOT NULL,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        synced INTEGER DEFAULT 0,
        localId TEXT,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (clientId) REFERENCES users(id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_synced ON orders(synced)`,

      // Tabla de items de pedidos
      `CREATE TABLE IF NOT EXISTS orderItems (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        productId TEXT NOT NULL,
        productName TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        pricePerUnit REAL NOT NULL,
        subtotal REAL NOT NULL,
        customText TEXT,
        customSelect TEXT,
        createdAt TEXT,
        FOREIGN KEY (orderId) REFERENCES orders(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_orderitems_order ON orderItems(orderId)`,

      // Tabla de carrito
      `CREATE TABLE IF NOT EXISTS cartItems (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        productId TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        pricePerUnit REAL NOT NULL,
        customText TEXT,
        customSelect TEXT,
        addedAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (productId) REFERENCES products(id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_cart_user ON cartItems(userId)`,

      // Tabla de promociones
      `CREATE TABLE IF NOT EXISTS promotions (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        discountType TEXT NOT NULL,
        discountValue REAL NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY (productId) REFERENCES products(id)
      )`,

      `CREATE INDEX IF NOT EXISTS idx_promotions_product ON promotions(productId)`,
      `CREATE INDEX IF NOT EXISTS idx_promotions_active ON promotions(isActive)`,

      // Tabla de cola de sincronización
      `CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        operation TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        retries INTEGER DEFAULT 0,
        lastError TEXT
      )`,

      `CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced)`,
      `CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entityType, entityId)`,

      // Tabla de metadata de sincronización
      `CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`
    ];

    for (const sql of tables) {
      await this.db.execute(sql);
    }
  }

  /**
   * Ejecutar una consulta SQL
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.query(sql, params);
    return (result.values || []) as T[];
  }

  /**
   * Ejecutar un comando SQL (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, params: any[] = []): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(sql, params);
  }

  /**
   * Ejecutar múltiples comandos en una transacción
   */
  async executeTransaction(statements: Array<{ sql: string; params?: any[] }>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeTransaction(statements);
  }

  /**
   * Limpiar todas las tablas (útil para testing o reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      'cartItems',
      'orderItems',
      'orders',
      'promotions',
      'pricingByType',
      'productVariants',
      'products',
      'users',
      'sync_queue',
      'sync_metadata'
    ];

    for (const table of tables) {
      await this.db.execute(`DELETE FROM ${table}`);
    }
  }

  /**
   * Cerrar la conexión a la base de datos
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * Obtener instancia de la conexión (para operaciones avanzadas)
   */
  getConnection(): SQLiteDBConnection | null {
    return this.db;
  }

  /**
   * Verificar si la base de datos está inicializada
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Exportar instancia singleton
export const databaseManager = new DatabaseManager();
