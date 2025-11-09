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
  PriceType
} from './types';

/**
 * Interfaz para fuentes de datos (online y offline)
 * Define las operaciones que deben implementar ambas fuentes
 */
export interface IDataSource {
  // ========== Products ==========
  
  /**
   * Obtener todos los productos activos
   */
  getProducts(): Promise<Product[]>;

  /**
   * Obtener un producto por ID
   */
  getProduct(id: string): Promise<Product | null>;

  /**
   * Obtener variantes de un producto
   */
  getProductVariants(productId: string): Promise<ProductVariant[]>;

  /**
   * Obtener precio de un producto según tipo
   */
  getPriceForProduct(productId: string, priceType: PriceType): Promise<number>;

  // ========== Clients (para vendedores) ==========
  
  /**
   * Obtener todos los clientes
   */
  getClients(): Promise<User[]>;

  /**
   * Obtener un cliente por ID
   */
  getClient(id: string): Promise<User | null>;

  // ========== Orders ==========
  
  /**
   * Crear un nuevo pedido
   */
  createOrder(order: CreateOrderInput): Promise<Order>;

  /**
   * Obtener todos los pedidos del usuario
   */
  getOrders(): Promise<Order[]>;

  /**
   * Obtener un pedido por ID con sus items
   */
  getOrder(id: string): Promise<(Order & { items: OrderItem[] }) | null>;

  /**
   * Obtener pedidos pendientes de sincronización
   */
  getPendingOrders(): Promise<Order[]>;

  // ========== Cart ==========
  
  /**
   * Obtener items del carrito
   */
  getCartItems(): Promise<CartItem[]>;

  /**
   * Agregar item al carrito
   */
  addToCart(item: AddToCartInput): Promise<CartItem>;

  /**
   * Actualizar cantidad de un item del carrito
   */
  updateCartItem(id: string, quantity: number): Promise<CartItem>;

  /**
   * Remover item del carrito
   */
  removeFromCart(id: string): Promise<void>;

  /**
   * Limpiar todo el carrito
   */
  clearCart(): Promise<void>;

  // ========== Promotions ==========
  
  /**
   * Obtener promociones activas
   */
  getActivePromotions(): Promise<Promotion[]>;

  /**
   * Obtener promociones de un producto específico
   */
  getPromotionsForProduct(productId: string): Promise<Promotion[]>;
}
