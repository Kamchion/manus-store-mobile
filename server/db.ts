import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  products,
  pricingByType,
  rolePricing,
  minimumQuantities,
  cartItems,
  orders,
  orderItems,
  auditLogs,
  productVariants,
  promotions,
  // quantityDiscountTiers,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = "admin";
        values.role = "admin";
        updateSet.role = "admin";
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all active products with pricing by type
 * For admin panel: shows ALL products including variants
 */
export async function getProducts() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  // Get all active products first
  const allProducts = await db.select().from(products).where(
    eq(products.isActive, true)
  );
  
  // Filter products based on visibility logic:
  // - Simple products (no variants): show if hideInCatalog = false
  // - Parent products (with variants): show if at least one variant has hideInCatalog = false
  const visibleProducts = [];
  
  for (const product of allProducts) {
    // Skip products that are variants (have a parentSku)
    if (product.parentSku) {
      continue;
    }
    
    // Check if this product has variants (is a parent)
    const variants = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.parentSku, product.sku),
          eq(products.isActive, true)
        )
      );
    
    if (variants.length > 0) {
      // This is a parent product - show if at least one variant is visible
      const hasVisibleVariant = variants.some(v => !v.hideInCatalog);
      if (hasVisibleVariant) {
        visibleProducts.push(product);
      }
    } else {
      // This is a simple product (no variants) - show if not hidden
      if (!product.hideInCatalog) {
        visibleProducts.push(product);
      }
    }
  }

  // Enrich each product with pricing by type
  const enrichedProducts = await Promise.all(
    visibleProducts.map(async (product) => {
      // Check if this product has variants
      const variants = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.parentSku, product.sku),
            eq(products.isActive, true)
          )
        );
      
      let priceCity, priceInterior, priceSpecial;
      
      if (variants.length > 0) {
        // This is a parent product - get minimum price from visible variants only
        const visibleVariants = variants.filter(v => !v.hideInCatalog);
        
        if (visibleVariants.length > 0) {
          const variantPrices = await Promise.all(
            visibleVariants.map(async (variant) => {
              const variantPricing = await db
                .select()
                .from(pricingByType)
                .where(eq(pricingByType.productId, variant.id));
              
              return {
                ciudad: parseFloat(variantPricing.find(p => p.priceType === 'ciudad')?.price || variant.basePrice),
                interior: parseFloat(variantPricing.find(p => p.priceType === 'interior')?.price || variant.basePrice),
                especial: parseFloat(variantPricing.find(p => p.priceType === 'especial')?.price || variant.basePrice),
              };
            })
          );
          
          // Get minimum prices
          priceCity = Math.min(...variantPrices.map(p => p.ciudad)).toString();
          priceInterior = Math.min(...variantPrices.map(p => p.interior)).toString();
          priceSpecial = Math.min(...variantPrices.map(p => p.especial)).toString();
        } else {
          // No visible variants - use parent's own price
          const pricingData = await db
            .select()
            .from(pricingByType)
            .where(eq(pricingByType.productId, product.id));

          priceCity = pricingData.find(p => p.priceType === 'ciudad')?.price || product.basePrice;
          priceInterior = pricingData.find(p => p.priceType === 'interior')?.price || product.basePrice;
          priceSpecial = pricingData.find(p => p.priceType === 'especial')?.price || product.basePrice;
        }
      } else {
        // Simple product - use its own pricing
        const pricingData = await db
          .select()
          .from(pricingByType)
          .where(eq(pricingByType.productId, product.id));

        priceCity = pricingData.find(p => p.priceType === 'ciudad')?.price || product.basePrice;
        priceInterior = pricingData.find(p => p.priceType === 'interior')?.price || product.basePrice;
        priceSpecial = pricingData.find(p => p.priceType === 'especial')?.price || product.basePrice;
      }

      return {
        ...product,
        priceCity,
        priceInterior,
        priceSpecial,
      };
    })
  );

  return enrichedProducts;
}

/**
 * Get all products for admin panel (including hidden variants)
 */
export async function getProductsForAdmin() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  // Get all active products (including variants for admin panel)
  const allProducts = await db.select().from(products).where(
    eq(products.isActive, true)
  );

  // Enrich each product with pricing by type
  const enrichedProducts = await Promise.all(
    allProducts.map(async (product) => {
      // Get pricing by type
      const pricingData = await db
        .select()
        .from(pricingByType)
        .where(eq(pricingByType.productId, product.id));

      // Map pricing to product
      const priceCity = pricingData.find(p => p.priceType === 'ciudad')?.price || product.basePrice;
      const priceInterior = pricingData.find(p => p.priceType === 'interior')?.price || product.basePrice;
      const priceSpecial = pricingData.find(p => p.priceType === 'especial')?.price || product.basePrice;

      return {
        ...product,
        priceCity,
        priceInterior,
        priceSpecial,
      };
    })
  );

  return enrichedProducts;
}

/**
 * Get a single product by ID
 */
export async function getProduct(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get product: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.isActive, true)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get price for a product based on user's price type
 * @param productId - ID of the product
 * @param priceType - Price type (ciudad, interior, especial)
 */
export async function getPriceForType(productId: string, priceType: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get price: database not available");
    return null;
  }

  const result = await db
    .select()
    .from(pricingByType)
    .where(
      and(
        eq(pricingByType.productId, productId),
        eq(pricingByType.priceType, priceType as any)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// Mantener por compatibilidad (deprecated)
export async function getPriceForRole(productId: string, userRole: string) {
  // Por defecto usar precio tipo 'ciudad'
  return getPriceForType(productId, 'ciudad');
}

/**
 * Get minimum quantity for a product based on user role
 */
export async function getMinimumQuantity(productId: string, role: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get minimum quantity: database not available");
    return 1;
  }

  const result = await db
    .select()
    .from(minimumQuantities)
    .where(
      and(
        eq(minimumQuantities.productId, productId),
        eq(minimumQuantities.role, role as any)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0].minQty : 1;
}

/**
 * Get all product variants
 */
export async function getVariants(productId?: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get variants: database not available");
    return [];
  }

  if (productId) {
    // First, get the parent product to find its SKU
    const parentProduct = await db
      .select({ sku: products.sku })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    
    if (!parentProduct || parentProduct.length === 0) {
      return [];
    }
    
    const parentSku = parentProduct[0].sku;
    
    // Get all products that have this SKU as their parentSku
    const variantProducts = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.parentSku, parentSku),
          eq(products.isActive, true)
        )
      );
    
    // Enrich each variant with its specific prices from pricingByType
    const variants = await Promise.all(
      variantProducts.map(async (variant) => {
        // Get prices for this specific variant
        const variantPricing = await db
          .select()
          .from(pricingByType)
          .where(eq(pricingByType.productId, variant.id));
        
        // Extract prices by type
        const precioCiudad = variantPricing.find(p => p.priceType === 'ciudad')?.price || variant.basePrice;
        const precioInterior = variantPricing.find(p => p.priceType === 'interior')?.price || variant.basePrice;
        const precioEspecial = variantPricing.find(p => p.priceType === 'especial')?.price || variant.basePrice;
        
        return {
          id: variant.id,
          productId: variant.id,
          variantType: variant.variantName,
          variantValue: variant.variantName,
          sku: variant.sku,
          stock: variant.stock,
          isActive: variant.isActive,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
          image: variant.image,
          name: variant.name,
          basePrice: variant.basePrice,
          precioCiudad,
          precioInterior,
          precioEspecial,
        };
      })
    );
    
    return variants;
  }

  // If no productId, return empty array
  return [];
}

/**
 * Get user's cart items
 */
export async function getCartItems(userId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get cart items: database not available");
    return [];
  }

  return await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId));
}

/**
 * Add item to cart (or update if already exists)
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
  pricePerUnit: string,
  customText?: string,
  customSelect?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add to cart: database not available");
    return null;
  }

  // Check if item already exists in cart
  const [existingItem] = await db
    .select()
    .from(cartItems)
    .where(
      and(
        eq(cartItems.userId, userId),
        eq(cartItems.productId, productId)
      )
    )
    .limit(1);

  if (existingItem) {
    // Update existing item quantity
    await db
      .update(cartItems)
      .set({ 
        quantity,
        pricePerUnit,
        customText: customText || null,
        customSelect: customSelect || null,
        updatedAt: new Date()
      })
      .where(eq(cartItems.id, existingItem.id));
    
    return existingItem.id;
  } else {
    // Insert new item
    const id = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(cartItems).values({
      id,
      userId,
      productId,
      quantity,
      pricePerUnit,
      customText: customText || null,
      customSelect: customSelect || null,
    });

    return id;
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update cart item: database not available");
    return false;
  }

  if (quantity <= 0) {
    // If quantity is 0 or negative, remove the item
    await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  } else {
    // Update the quantity
    await db
      .update(cartItems)
      .set({ 
        quantity,
        updatedAt: new Date()
      })
      .where(eq(cartItems.id, cartItemId));
  }

  return true;
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove from cart: database not available");
    return false;
  }

  await db.delete(cartItems).where(eq(cartItems.id, cartItemId));
  return true;
}

/**
 * Clear user's cart
 */
export async function clearCart(userId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot clear cart: database not available");
    return false;
  }

  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  return true;
}

/**
 * Create an order from cart items
 */
export async function createOrder(
  userId: string,
  subtotal: string,
  tax: string,
  total: string,
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    pricePerUnit: string;
    subtotal: string;
  }>,
  customerNote?: string,
  clientId?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create order: database not available");
    return null;
  }

  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const orderNumber = `ORD-${Date.now()}`;

  await db.insert(orders).values({
    id: orderId,
    userId,
    clientId: clientId || null,
    orderNumber,
    subtotal,
    tax,
    total,
    notes: customerNote || null,
  });

  // Insert order items
  for (const item of items) {
    const itemId = `orderitem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(orderItems).values({
      id: itemId,
      orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit,
      subtotal: item.subtotal,
    });
  }

  return orderId;
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get orders: database not available");
    return [];
  }

  return await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId));
}

/**
 * Get order details with items
 */
export async function getOrderWithItems(orderId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get order: database not available");
    return null;
  }

  const order = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (order.length === 0) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return {
    ...order[0],
    items,
  };
}

/**
 * Log an audit event
 */
export async function logAudit(
  userId: string | undefined,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot log audit: database not available");
    return;
  }

  const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(auditLogs).values({
    id,
    userId: userId || null,
    action,
    entityType: entityType || null,
    entityId: entityId || null,
    details: details || null,
  });
}


/**
 * Get active promotions for a product
 */
export async function getPromotionsForProduct(productId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get promotions: database not available");
    return [];
  }

  const now = new Date();
  return await db
    .select()
    .from(promotions)
    .where(
      and(
        eq(promotions.productId, productId),
        eq(promotions.isActive, true)
      )
    );
}

/**
 * Get all active promotions
 */
export async function getAllActivePromotions() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get promotions: database not available");
    return [];
  }

  return await db
    .select()
    .from(promotions)
    .where(eq(promotions.isActive, true));
}

/**
 * Create or update a promotion
 */
export async function upsertPromotion(
  productId: string,
  name: string,
  description: string | null,
  discountType: "percentage" | "fixed",
  discountValue: string,
  startDate: Date,
  endDate: Date
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert promotion: database not available");
    return null;
  }

  const id = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.insert(promotions).values({
    id,
    productId,
    name,
    description,
    discountType,
    discountValue,
    startDate,
    endDate,
    isActive: true,
  });

  return id;
}

/**
 * Get all products with their variants, pricing, and promotions for export
 */
export async function getProductsForExport() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get products: database not available");
    return [];
  }

  const allProducts = await db.select().from(products).where(eq(products.isActive, true));

  const result = [];

  for (const product of allProducts) {
    // Get variants
    const variants = await db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, product.id),
          eq(productVariants.isActive, true)
        )
      );

    // Get role pricing
    const pricing = await db
      .select()
      .from(rolePricing)
      .where(eq(rolePricing.productId, product.id));

    // Get minimum quantities
    const minQtys = await db
      .select()
      .from(minimumQuantities)
      .where(eq(minimumQuantities.productId, product.id));

    // Get promotions
    const promos = await db
      .select()
      .from(promotions)
      .where(
        and(
          eq(promotions.productId, product.id),
          eq(promotions.isActive, true)
        )
      );

    result.push({
      ...product,
      variants,
      pricing,
      minimumQuantities: minQtys,
      promotions: promos,
    });
  }

  return result;
}

/**
 * Update role pricing for a product
 */
export async function updateRolePricing(
  productId: string,
  role: "user" | "distributor" | "reseller" | "admin",
  price: string,
  minQuantity: number
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update pricing: database not available");
    return null;
  }

  // Check if pricing exists
  const existing = await db
    .select()
    .from(rolePricing)
    .where(
      and(
        eq(rolePricing.productId, productId),
        eq(rolePricing.role, role)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(rolePricing)
      .set({ price, minQuantity })
      .where(
        and(
          eq(rolePricing.productId, productId),
          eq(rolePricing.role, role)
        )
      );
    return existing[0].id;
  } else {
    // Create new
    const id = `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(rolePricing).values({
      id,
      productId,
      role,
      price,
      minQuantity,
    });
    return id;
  }
}


/**
 * Import products from structured data
 */
export async function importProducts(productsData: Array<{
  sku: string;
  name: string;
  description?: string;
  category?: string;
  image?: string;
  basePrice: string;
  stock: number;
  variants?: Array<{
    variantType: string;
    variantValue: string;
    sku?: string;
    basePrice?: string;
    description?: string;
    image?: string;
    stock: number;
  }>;
  pricing?: Array<{
    role: "user" | "distributor" | "reseller" | "admin";
    price: string;
    minQuantity: number;
  }>;
  promotions?: Array<{
    name: string;
    description?: string;
    discountType: "percentage" | "fixed";
    discountValue: string;
    startDate: Date;
    endDate: Date;
  }>;
  minimumQuantities?: Array<{
    role: "user" | "distributor" | "reseller" | "admin";
    minQty: number;
  }>;
}>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot import products: database not available");
    return { success: false, error: "Database not available" };
  }

  const results = {
    productsCreated: 0,
    productsUpdated: 0,
    variantsCreated: 0,
    pricingCreated: 0,
    promotionsCreated: 0,
    errors: [] as string[],
  };

  for (const productData of productsData) {
    try {
      // Check if product exists by SKU
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.sku, productData.sku))
        .limit(1);

      let productId: string;

      if (existing.length > 0) {
        // Update existing product
        productId = existing[0].id;
        await db
          .update(products)
          .set({
            name: productData.name,
            description: productData.description || null,
            category: productData.category || null,
            image: productData.image || null,
            basePrice: productData.basePrice,
            stock: productData.stock,
          })
          .where(eq(products.id, productId));
        results.productsUpdated++;
      } else {
        // Create new product
        productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.insert(products).values({
          id: productId,
          sku: productData.sku,
          name: productData.name,
          description: productData.description || null,
          category: productData.category || null,
          image: productData.image || null,
          basePrice: productData.basePrice,
          stock: productData.stock,
          isActive: true,
        });
        results.productsCreated++;
      }

      // Import variants
      if (productData.variants && productData.variants.length > 0) {
        for (const variant of productData.variants) {
          const variantId = `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.insert(productVariants).values({
            id: variantId,
            productId,
            variantType: variant.variantType,
            variantValue: variant.variantValue,
            sku: variant.sku || null,
            basePrice: variant.basePrice || null,
            description: variant.description || null,
            image: variant.image || null,
            stock: variant.stock,
            isActive: true,
          });
          results.variantsCreated++;
        }
      }

      // Import pricing
      if (productData.pricing && productData.pricing.length > 0) {
        for (const price of productData.pricing) {
          await updateRolePricing(
            productId,
            price.role,
            price.price,
            price.minQuantity
          );
          results.pricingCreated++;
        }
      }

      // Import minimum quantities
      if (productData.minimumQuantities && productData.minimumQuantities.length > 0) {
        for (const minQty of productData.minimumQuantities) {
          // Check if exists
          const existingMinQty = await db
            .select()
            .from(minimumQuantities)
            .where(
              and(
                eq(minimumQuantities.productId, productId),
                eq(minimumQuantities.role, minQty.role)
              )
            )
            .limit(1);

          if (existingMinQty.length > 0) {
            await db
              .update(minimumQuantities)
              .set({ minQty: minQty.minQty })
              .where(
                and(
                  eq(minimumQuantities.productId, productId),
                  eq(minimumQuantities.role, minQty.role)
                )
              );
          } else {
            const minQtyId = `minqty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await db.insert(minimumQuantities).values({
              id: minQtyId,
              productId,
              role: minQty.role,
              minQty: minQty.minQty,
            });
          }
        }
      }

      // Import promotions
      if (productData.promotions && productData.promotions.length > 0) {
        for (const promo of productData.promotions) {
          await upsertPromotion(
            productId,
            promo.name,
            promo.description || null,
            promo.discountType,
            promo.discountValue,
            promo.startDate,
            promo.endDate
          );
          results.promotionsCreated++;
        }
      }
    } catch (error: any) {
      results.errors.push(`Error importing ${productData.sku}: ${error.message}`);
    }
  }

  return { success: true, results };
}



/**
 * Create or update a product
 */
export async function upsertProduct(productData: {
  id?: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  image?: string;
  basePrice: string;
  stock: number;
  isActive: boolean;
  minQuantity?: number;
  unitsPerBox?: number;
  line1Text?: string;
  line2Text?: string;
  precioCiudad?: string;
  precioInterior?: string;
  precioEspecial?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const productId = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (productData.id) {
    // Update existing product
    await db
      .update(products)
      .set({
        sku: productData.sku,
        name: productData.name,
        description: productData.description || null,
        category: productData.category || null,
        image: productData.image || null,
        basePrice: productData.basePrice,
        stock: productData.stock,
        isActive: productData.isActive,
        minQuantity: productData.minQuantity || 1,
        unitsPerBox: productData.unitsPerBox || 0,
        line1Text: productData.line1Text || null,
        line2Text: productData.line2Text || null,
      })
      .where(eq(products.id, productData.id));
  } else {
    // Create new product
    await db.insert(products).values({
      id: productId,
      sku: productData.sku,
      name: productData.name,
      description: productData.description || null,
      category: productData.category || null,
      image: productData.image || null,
      basePrice: productData.basePrice,
      stock: productData.stock,
      isActive: productData.isActive,
      minQuantity: productData.minQuantity || 1,
      unitsPerBox: productData.unitsPerBox || 0,
      line1Text: productData.line1Text || null,
      line2Text: productData.line2Text || null,
    });
  }

  // Guardar precios diferenciados en pricingByType
  if (productData.precioCiudad || productData.precioInterior || productData.precioEspecial) {
    // Eliminar precios existentes
    await db.delete(pricingByType).where(eq(pricingByType.productId, productId));
    
    // Insertar nuevos precios
    if (productData.precioCiudad) {
      await db.insert(pricingByType).values({
        productId,
        priceType: 'ciudad',
        price: productData.precioCiudad,
        minQuantity: productData.minQuantity || 1,
      });
    }
    if (productData.precioInterior) {
      await db.insert(pricingByType).values({
        productId,
        priceType: 'interior',
        price: productData.precioInterior,
        minQuantity: productData.minQuantity || 1,
      });
    }
    if (productData.precioEspecial) {
      await db.insert(pricingByType).values({
        productId,
        priceType: 'especial',
        price: productData.precioEspecial,
        minQuantity: productData.minQuantity || 1,
      });
    }
  }

  return productId;
}

/**
 * Delete a product and all related data
 */
export async function deleteProduct(productId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete related data first
  await db.delete(productVariants).where(eq(productVariants.productId, productId));
  await db.delete(rolePricing).where(eq(rolePricing.productId, productId));
  await db.delete(minimumQuantities).where(eq(minimumQuantities.productId, productId));
  await db.delete(promotions).where(eq(promotions.productId, productId));
  await db.delete(cartItems).where(eq(cartItems.productId, productId));
  
  // Delete the product
  await db.delete(products).where(eq(products.id, productId));

  return { success: true };
}

/**
 * Create or update product variants
 */
export async function upsertProductVariants(
  productId: string,
  variants: Array<{ type: string; value: string; sku: string; stock: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing variants for this product
  await db.delete(productVariants).where(eq(productVariants.productId, productId));

  // Insert new variants
  for (const variant of variants) {
    const variantId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(productVariants).values({
      id: variantId,
      productId,
      variantType: variant.type,
      variantValue: variant.value,
      sku: variant.sku,
      stock: variant.stock,
      isActive: true,
    });
  }

  return { success: true };
}

/**
 * Update role pricing for a product
 */
export async function upsertRolePricing(
  productId: string,
  pricingData: Array<{ role: string; price: string; minQty: number }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete existing pricing for this product
  await db.delete(rolePricing).where(eq(rolePricing.productId, productId));
  await db.delete(minimumQuantities).where(eq(minimumQuantities.productId, productId));

  // Insert new pricing
  for (const pricing of pricingData) {
    const pricingId = `pricing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(rolePricing).values({
      id: pricingId,
      productId,
      role: pricing.role as "user" | "distributor" | "reseller" | "admin",
      price: pricing.price,
    });

    const minQtyId = `minqty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(minimumQuantities).values({
      id: minQtyId,
      productId,
      role: pricing.role as "user" | "distributor" | "reseller" | "admin",
      minQty: pricing.minQty,
    });
  }

  return { success: true };
}

/**
 * Create promotions for a product
 */
export async function createProductPromotions(
  productId: string,
  promotionsData: Array<{ name: string; discountType: string; discountValue: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const promo of promotionsData) {
    const now = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Default 1 month duration

    await upsertPromotion(
      productId,
      promo.name,
      null,
      promo.discountType as "percentage" | "fixed",
      promo.discountValue,
      now,
      endDate
    );
  }

  return { success: true };
}


/**
 * Create quantity discount tiers for a promotion
 */
// export async function createQuantityDiscountTiers(
//   promotionId: string,
//   tiers: Array<{ minQuantity: number; discountType: "percentage" | "fixed"; discountValue: string }>
// ) {
//   const db = await getDb();
//   if (!db) throw new Error("Database not available");
// 
//   // Delete existing tiers for this promotion
//   await db.delete(quantityDiscountTiers).where(eq(quantityDiscountTiers.promotionId, promotionId));
// 
//   // Insert new tiers
//   for (const tier of tiers) {
//     await db.insert(quantityDiscountTiers).values({
//       id: `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       promotionId,
//       minQuantity: tier.minQuantity,
//       discountType: tier.discountType,
//       discountValue: tier.discountValue,
//     });
//   }
// 
//   return { success: true };
// }

/**
 * Get quantity discount tiers for a promotion
 */
// export async function getQuantityDiscountTiers(promotionId: string) {
//   const db = await getDb();
//   if (!db) return [];
// 
//   const tiers = await db
//     .select()
//     .from(quantityDiscountTiers)
//     .where(eq(quantityDiscountTiers.promotionId, promotionId))
//     .orderBy(quantityDiscountTiers.minQuantity);
// 
//   return tiers;
// }

/**
 * Get applicable discount for a product based on quantity
 */
export async function getApplicableDiscount(productId: string, quantity: number) {
  const db = await getDb();
  if (!db) return null;

  // Get active promotions for the product
  const activePromotions = await getPromotionsForProduct(productId);

  let bestDiscount = null;
  let bestDiscountValue = 0;

  for (const promo of activePromotions) {
    if (promo.promotionType === 'quantity_discount') {
      // Get tiers for this promotion
      const tiers = await getQuantityDiscountTiers(promo.id);
      
      // Find the applicable tier
      const applicableTier = tiers
        .filter(t => quantity >= t.minQuantity)
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];

      if (applicableTier) {
        const discountValue = parseFloat(applicableTier.discountValue);
        if (discountValue > bestDiscountValue) {
          bestDiscountValue = discountValue;
          bestDiscount = {
            promotionId: promo.id,
            promotionName: promo.name,
            discountType: applicableTier.discountType,
            discountValue: applicableTier.discountValue,
            minQuantity: applicableTier.minQuantity,
          };
        }
      }
    } else if (promo.promotionType === 'buy_x_get_y') {
      if (quantity >= (promo.buyQuantity || 0)) {
        bestDiscount = {
          promotionId: promo.id,
          promotionName: promo.name,
          type: 'buy_x_get_y',
          buyQuantity: promo.buyQuantity,
          getQuantity: promo.getQuantity,
        };
      }
    } else if (promo.promotionType === 'simple_discount') {
      if (quantity >= (promo.minQuantity || 1)) {
        const discountValue = parseFloat(promo.discountValue || '0');
        if (discountValue > bestDiscountValue) {
          bestDiscountValue = discountValue;
          bestDiscount = {
            promotionId: promo.id,
            promotionName: promo.name,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minQuantity: promo.minQuantity,
          };
        }
      }
    }
  }

  return bestDiscount;
}

