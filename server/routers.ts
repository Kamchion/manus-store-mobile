import { orders, orderItems, products, users, productVariants } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getProducts,
  getProductsForAdmin,
  getProduct,
  getPriceForRole,
  getPriceForType,
  getMinimumQuantity,
  getVariants,
  getCartItems,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  createOrder,
  getUserOrders,
  getOrderWithItems,
  logAudit,
  getPromotionsForProduct,
  getAllActivePromotions,
  upsertPromotion,
  getProductsForExport,
  updateRolePricing,
  importProducts,
  upsertProduct,
  deleteProduct,
  upsertProductVariants,
  upsertRolePricing,
  createProductPromotions,
  // createQuantityDiscountTiers,
} from "./db";
import { sql } from "drizzle-orm";
import { promotions, systemConfig } from "../drizzle/schema";
import {
  createUser,
  listUsersWithStats,
  toggleUserFreeze,
  changeUserPassword,
  deleteUser,
  getUsersStats,
  updateUser,
} from "./db-users";
import { loginWithPassword } from "./auth";
import { COOKIE_NAME } from "../shared/const";
import { importRouter } from "./import-router";
import { vendorAuthRouter } from "./vendor-auth-router";
import { syncRouter } from "./sync-router";

export const appRouter = router({
  system: systemRouter,

  vendorAuth: vendorAuthRouter,
  sync: syncRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    login: publicProcedure
      .input(
        z.object({
          usernameOrEmail: z.string(),
          password: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { token, user } = await loginWithPassword(input);
        
        // Establecer cookie de sesión
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        });

        return { success: true, user };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Products router - public procedures for browsing
   */
  products: router({
    /**
     * Get all active products
     * Public access - shows base prices, actual prices depend on user role
     */
    list: publicProcedure.query(async () => {
      return await getProducts();
    }),

    /**
     * Get single product details
     */
    getById: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const product = await getProduct(input.id);
        if (!product) {
          throw new Error("Producto no encontrado");
        }
        return product;
      }),

    /**
     * Get product with pricing for current user
     * Protected - requires authentication to show role-based pricing
     */
    getWithPricing: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const product = await getProduct(input.id);
        if (!product) {
          throw new Error("Producto no encontrado");
        }

        const pricing = await getPriceForRole(input.id, ctx.user.role);
        const minQty = await getMinimumQuantity(input.id, ctx.user.role);

        return {
          ...product,
          rolePrice: pricing?.price || product.basePrice,
          minQuantity: minQty,
          userRole: ctx.user.role,
        };
      }),

    /**
     * List products with pricing based on user's role
     * Public - accessible without authentication, shows default pricing
     * Supports pagination with cursor and limit
     */
    listWithPricing: publicProcedure
      .input(
        z.object({
          cursor: z.number().optional().default(0),
          limit: z.number().min(1).max(100).optional().default(20),
          clientId: z.string().optional(), // ID del cliente seleccionado por el vendedor
        })
      )
      .query(async ({ ctx, input }) => {
        const allProducts = await getProducts();
        
        // Apply pagination
        const start = input.cursor;
        const end = start + input.limit;
        const paginatedProducts = allProducts.slice(start, end);
        const hasMore = end < allProducts.length;
        
        // Enrich each product with price type-based pricing and variants info
        const productsWithPricing = await Promise.all(
          paginatedProducts.map(async (product) => {
            // Si hay un clientId, obtener el priceType de ese cliente
            // De lo contrario, usar el priceType del usuario autenticado
            let userPriceType = ctx.user?.priceType || 'ciudad';
            const userRole = ctx.user?.role || 'cliente';
            
            if (input.clientId && ctx.user?.role === 'vendedor') {
              // Obtener el cliente seleccionado
              const db = await getDb();
              if (db) {
                const selectedClient = await db
                  .select()
                  .from(users)
                  .where(eq(users.id, input.clientId))
                  .limit(1);
                
                if (selectedClient.length > 0 && selectedClient[0].priceType) {
                  userPriceType = selectedClient[0].priceType as 'ciudad' | 'interior' | 'especial';
                }
              }
            }
            
            const minQty = product.minQuantity || 1;
            
            // Get variants information
            const variants = await getVariants(product.id);
            const hasVariants = variants.length > 0;
            
            // Use the price already calculated in getProducts() based on userPriceType
            // getProducts() already handles parent products by calculating minimum price from variants
            let rolePrice;
            switch (userPriceType) {
              case 'ciudad':
                rolePrice = product.priceCity;
                break;
              case 'interior':
                rolePrice = product.priceInterior;
                break;
              case 'especial':
                rolePrice = product.priceSpecial;
                break;
              default:
                rolePrice = product.priceCity;
            }
            
            return {
              ...product,
              rolePrice: rolePrice || product.basePrice,
              minQuantity: minQty,
              userRole: userRole,
              priceType: userPriceType,
              hasVariants,
              variantsCount: variants.length,
            };
          })
        );
        
        return {
          products: productsWithPricing,
          nextCursor: hasMore ? end : undefined,
          hasMore,
        };
      }),

    /**
     * Get product variants by product ID
     */
    getVariants: publicProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await getVariants(input.productId);
      }),
  }),

  /**
   * Cart router - protected procedures for cart management
   */
  cart: router({
    /**
     * Get current user's cart
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const items = await getCartItems(ctx.user.id);
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Enrich cart items with product details (handling variants)
      const enrichedItems = await Promise.all(
        items.map(async (item) => {
          // Check if this is a variant
          const [variant] = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, item.productId))
            .limit(1);
          
          if (variant) {
            // This is a variant - get parent product and add variant info
            const product = await getProduct(variant.productId);
            return {
              ...item,
              product: product ? {
                ...product,
                name: product.name,
                sku: variant.sku || product.sku,
                basePrice: variant.basePrice || product.basePrice, // Use variant's price
                rolePrice: variant.basePrice || product.basePrice, // Use variant's price for role pricing too
              } : null,
              variant: {
                type: variant.variantType,
                value: variant.variantValue,
                sku: variant.sku,
                basePrice: variant.basePrice,
              },
            };
          } else {
            // Regular product
            const product = await getProduct(item.productId);
            return {
              ...item,
              product,
              variant: null,
            };
          }
        })
      );

      return enrichedItems;
    }),

    /**
     * Add item to cart with validation
     */
    addItem: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
          variantSelections: z.record(z.string(), z.string()).optional(),
          customText: z.string().max(8).optional(),
          customSelect: z.string().max(100).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // First, check if this is a variant or a regular product
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Try to get as variant first
        const [variant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.productId, input.productId))
          .limit(1);
        
        let product;
        let stockToCheck;
        let productIdForPricing;
        
        let price;
        
        if (variant) {
          // This is a variant - get parent product for minimum quantity check
          product = await getProduct(variant.productId);
          if (!product) {
            throw new Error("Parent product not found");
          }
          stockToCheck = variant.stock;
          productIdForPricing = variant.productId; // Use parent product ID for minimum quantity
          
          // Get price based on user's priceType
          const priceType = ctx.user.priceType || 'ciudad';
          if (priceType === 'interior' && variant.precioInterior) {
            price = variant.precioInterior;
          } else if (priceType === 'especial' && variant.precioEspecial) {
            price = variant.precioEspecial;
          } else if (priceType === 'ciudad' && variant.precioCiudad) {
            price = variant.precioCiudad;
          } else {
            // Fallback to basePrice
            price = (variant.basePrice !== null && variant.basePrice !== undefined) ? variant.basePrice : product.basePrice;
          }
        } else {
          // This is a regular product
          product = await getProduct(input.productId);
          if (!product) {
            throw new Error("Producto no encontrado");
          }
          stockToCheck = product.stock;
          productIdForPricing = input.productId;
          // Get role-based price for regular products
          const pricing = await getPriceForRole(
            productIdForPricing,
            ctx.user.role
          );
          price = pricing?.price || product.basePrice;
        }

        // Check minimum quantity (based on parent product and user's role)
        const minQty = await getMinimumQuantity(
          productIdForPricing,
          ctx.user.role || 'cliente'
        );
        if (input.quantity < minQty) {
          throw new Error(
            `La cantidad mínima para este producto es ${minQty}`
          );
        }

        // Check stock (variant stock or product stock)
        // Vendedores y administradores pueden hacer pedidos sin restricción de stock
        const skipStockCheck = ctx.user.role === 'vendedor' || ctx.user.role === 'administrador' || ctx.user.role === 'operador';
        
        if (!skipStockCheck && input.quantity > stockToCheck) {
          throw new Error("Stock insuficiente");
        }

        const cartItemId = await addToCart(
          ctx.user.id,
          input.productId,
          input.quantity,
          price.toString(),
          input.customText,
          input.customSelect
        );

        await logAudit(
          ctx.user.id,
          "CART_ADD_ITEM",
          "product",
          input.productId,
          `Quantity: ${input.quantity}`
        );

        return { success: true, cartItemId };
      }),

    /**
     * Update cart item quantity
     */
    updateQuantity: protectedProcedure
      .input(
        z.object({
          cartItemId: z.string(),
          quantity: z.number().int().min(0),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateCartItemQuantity(input.cartItemId, input.quantity);
        await logAudit(
          ctx.user.id,
          "CART_UPDATE_QUANTITY",
          "cartItem",
          input.cartItemId,
          `Cantidad actualizada a ${input.quantity}`
        );
        return { success: true };
      }),

    /**
     * Remove item from cart
     */
    removeItem: protectedProcedure
      .input(z.object({ cartItemId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await removeFromCart(input.cartItemId);
        await logAudit(ctx.user.id, "CART_REMOVE_ITEM", "cartItem", input.cartItemId);
        return { success: true };
      }),

    /**
     * Clear entire cart
     */
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      await logAudit(ctx.user.id, "CART_CLEARED");
      return { success: true };
    }),
  }),

  /**
   * Orders router - protected procedures for order management
   */
  orders: router({
    /**
     * Get user's order history
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserOrders(ctx.user.id);
    }),

    /**
     * Get order details with items
     */
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const order = await getOrderWithItems(input.id);
        if (!order) {
          throw new Error("Order not found");
        }

        // Security: ensure user can only view their own orders
        if (order.userId !== ctx.user.id && ctx.user.role !== "administrador") {
          throw new Error("No autorizado");
        }

        return order;
      }),

    /**
     * Create order from cart
     */
    checkout: protectedProcedure
      .input(
        z.object({
          customerNote: z.string().optional(),
          selectedClientId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const cartItems = await getCartItems(ctx.user.id);

        if (cartItems.length === 0) {
          throw new Error("El carrito está vacío");
        }

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        for (const item of cartItems) {
          // Check if this is a variant or regular product
          const [variant] = await db
            .select()
            .from(productVariants)
            .where(eq(productVariants.productId, item.productId))
            .limit(1);
          
          let productName;
          
          if (variant) {
            // This is a variant - get parent product
            const product = await getProduct(variant.productId);
            if (!product) {
              throw new Error(`Parent product for variant ${item.productId} not found`);
            }
            // Use only the product name without variant details
            productName = product.name;
          } else {
            // Regular product
            const product = await getProduct(item.productId);
            if (!product) {
              throw new Error(`Product ${item.productId} not found`);
            }
            productName = product.name;
          }

          const itemSubtotal =
            parseFloat(item.pricePerUnit) * item.quantity;
          subtotal += itemSubtotal;

          orderItems.push({
            productId: item.productId,
            productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            subtotal: itemSubtotal.toString(),
            customText: item.customText,
            customSelect: item.customSelect,
          });
        }

        // Get tax rate from system configuration
        const { systemConfig } = await import("../drizzle/schema");
        const taxRateConfig = await db
          .select()
          .from(systemConfig)
          .where(eq(systemConfig.key, "tax_rate"))
          .limit(1);
        
        const taxRatePercent = taxRateConfig[0]?.value ? parseFloat(taxRateConfig[0].value) : 10;
        const tax = subtotal * (taxRatePercent / 100);
        const total = subtotal + tax;

        // Create order
        const orderId = await createOrder(
          ctx.user.id,
          subtotal.toString(),
          tax.toString(),
          total.toString(),
          orderItems,
          input.customerNote,
          input.selectedClientId
        );

        if (!orderId) {
          throw new Error("Failed to create order");
        }

        // Clear cart
        await clearCart(ctx.user.id);

        await logAudit(
          ctx.user.id,
          "ORDER_CREATED",
          "order",
          orderId,
          `Total: ${total.toFixed(2)}`
        );

        const orderNumber = `ORD-${Date.now()}`;

        // Generate and send order email with PDF and Excel
        try {
          const { generateOrderPDF, generateOrderExcel } = await import('./order-export-service');
          const { sendOrderEmail } = await import('./email-service');

          // Get full order data for export
          const orderData = {
            id: orderId,
            orderNumber,
            createdAt: new Date(),
            subtotal: subtotal.toString(),
            tax: tax.toString(),
            total: total.toString(),
            notes: input.customerNote,
            user: {
              id: ctx.user.id,
              name: ctx.user.name,
              username: ctx.user.username,
              email: ctx.user.email,
              companyName: ctx.user.companyName,
              phone: ctx.user.phone,
              address: ctx.user.address,
              clientNumber: ctx.user.clientNumber,
            },
            vendor: {
              id: ctx.user.id,
              name: ctx.user.name,
              username: ctx.user.username,
            },
            items: orderItems
          };

          // Generate PDF and Excel
          const pdfBuffer = await generateOrderPDF(orderData);
          const excelBuffer = await generateOrderExcel(orderData);

          // Send email
          await sendOrderEmail({
            orderNumber,
            customerName: ctx.user.name || ctx.user.companyName || 'Cliente',
            customerEmail: ctx.user.email || 'sin-email@example.com',
            total: total.toString(),
            pdfBuffer,
            excelBuffer
          });

          console.log(`✅ Order ${orderNumber} email sent successfully`);
        } catch (emailError) {
          console.error('❌ Failed to send order email:', emailError);
          // Don't fail the order if email fails
        }

        return {
          success: true,
          orderId,
          orderNumber,
          total: total.toFixed(2),
        };
      }),

    /**
     * Get vendor's orders (for vendedor role)
     */
    getVendorOrders: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "vendedor") {
        throw new Error("Solo los vendedores pueden ver este historial");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { orders, users } = await import("../drizzle/schema");

      // Get orders created by this vendor
      const vendorOrders = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          userId: orders.userId,
          clientId: orders.clientId,
          total: orders.total,
          status: orders.status,
          createdAt: orders.createdAt,
          customerName: users.companyName,
          customerContact: users.contactPerson,
        })
        .from(orders)
        .leftJoin(users, eq(orders.clientId, users.id))
        .where(eq(orders.userId, ctx.user.id))
        .orderBy(desc(orders.createdAt));

      return vendorOrders;
    }),

    /**
     * Export order as PDF
     */
    exportPDF: protectedProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { orders, orderItems, users, products } = await import("../drizzle/schema");

        // Get order with items
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) {
          throw new Error("Pedido no encontrado");
        }

        // Security check
        if (order.userId !== ctx.user.id && ctx.user.role !== "administrador" && ctx.user.role !== "operador") {
          throw new Error("No autorizado");
        }

        // Get order items
        const items = await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            productName: orderItems.productName,
            quantity: orderItems.quantity,
            pricePerUnit: orderItems.pricePerUnit,
            subtotal: orderItems.subtotal,
            customText: orderItems.customText,
            customSelect: orderItems.customSelect,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, input.orderId));

        // Get client info
        const [client] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.clientId || order.userId))
          .limit(1);

        // Get vendor info
        const [vendor] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);

        // Generate PDF
        const { generateOrderPDF } = await import("./order-export-service");
        const orderData = {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
          subtotal: order.subtotal.toString(),
          tax: order.tax.toString(),
          total: order.total.toString(),
          notes: order.notes,
          user: {
            id: client?.id || "",
            name: client?.name || null,
            username: client?.username || null,
            email: client?.email || null,
            companyName: client?.companyName || null,
            phone: client?.phone || null,
            address: client?.address || null,
            clientNumber: client?.clientNumber || null,
          },
          vendor: {
            id: vendor?.id || "",
            name: vendor?.name || null,
            username: vendor?.username || null,
          },
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit.toString(),
            subtotal: item.subtotal.toString(),
            customText: item.customText,
            customSelect: item.customSelect,
          })),
        };

        const pdfBuffer = await generateOrderPDF(orderData);
        const base64 = pdfBuffer.toString("base64");

        return {
          pdf: base64,
          filename: `pedido_${order.orderNumber}.pdf`,
        };
      }),
    /**
     * Export order as Excel with custom configuration
     */
    exportExcel: protectedProcedure
      .input(z.object({ orderId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get order with items
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) {
          throw new Error("Order not found");
        }

        // Get order items with product details
        const items = await db
          .select({
            productId: orderItems.productId,
            productName: orderItems.productName,
            quantity: orderItems.quantity,
            pricePerUnit: orderItems.pricePerUnit,
            subtotal: orderItems.subtotal,
            customText: orderItems.customText,
            customSelect: orderItems.customSelect,
            sku: products.sku,
            stock: products.stock,
            location: products.location,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, input.orderId));

        // Get user details
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, order.userId))
          .limit(1);

        // Get vendor details (if different from user)
        let vendor = user;
        if (order.vendorId && order.vendorId !== order.userId) {
          const [vendorUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, order.vendorId))
            .limit(1);
          if (vendorUser) vendor = vendorUser;
        }

        const { generateOrderExcel } = await import('./order-export-service');

        const orderData = {
          id: order.id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          subtotal: order.subtotal.toString(),
          tax: order.tax.toString(),
          total: order.total.toString(),
          notes: order.notes,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            companyName: user.companyName,
            phone: user.phone,
            address: user.address,
            clientNumber: user.clientNumber,
          },
          vendor: {
            id: vendor.id,
            name: vendor.name,
            username: vendor.username,
          },
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit.toString(),
            subtotal: item.subtotal.toString(),
            customText: item.customText,
            customSelect: item.customSelect,
            sku: item.sku,
            stock: item.stock,
            location: item.location,
          })),
        };

        const excelBuffer = await generateOrderExcel(orderData);
        const base64 = excelBuffer.toString("base64");

        return {
          excel: base64,
          filename: `pedido_${order.orderNumber}.xlsx`,
        };
      }),
  }),

  /**
   * Promotions router
   */
  promotions: router({
    /**
     * Get active promotions for a product
     */
    getForProduct: publicProcedure
      .input(z.object({ productId: z.string() }))
      .query(async ({ input }) => {
        return await getPromotionsForProduct(input.productId);
      }),

    /**
     * Get all active promotions
     */
    getAll: publicProcedure.query(async () => {
      return await getAllActivePromotions();
    }),

    /**
     * Create or update a promotion (admin only)
     * Supports 3 types: quantity_discount, buy_x_get_y, simple_discount
     */
    upsert: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          name: z.string(),
          description: z.string().nullable(),
          promotionType: z.enum(["quantity_discount", "buy_x_get_y", "simple_discount"]),
          
          // For simple_discount
          discountType: z.enum(["percentage", "fixed"]).optional(),
          discountValue: z.string().optional(),
          minQuantity: z.number().optional(),
          
          // For buy_x_get_y
          buyQuantity: z.number().optional(),
          getQuantity: z.number().optional(),
          
          // For quantity_discount
          tiers: z.array(
            z.object({
              minQuantity: z.number(),
              discountType: z.enum(["percentage", "fixed"]),
              discountValue: z.string(),
            })
          ).optional(),
          
          startDate: z.date(),
          endDate: z.date(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Only admins can create promotions");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Create promotion
        const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await db.insert(promotions).values({
          id: promotionId,
          productId: input.productId,
          name: input.name,
          description: input.description,
          promotionType: input.promotionType,
          discountType: input.discountType || null,
          discountValue: input.discountValue || null,
          minQuantity: input.minQuantity || null,
          buyQuantity: input.buyQuantity || null,
          getQuantity: input.getQuantity || null,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: true,
        });

        // If quantity_discount, create tiers
        // if (input.promotionType === "quantity_discount" && input.tiers && input.tiers.length > 0) {
        //   await createQuantityDiscountTiers(promotionId, input.tiers);
        // }

        await logAudit(
          ctx.user.id,
          "PROMOTION_CREATED",
          "promotion",
          promotionId,
          `Product: ${input.productId}, Type: ${input.promotionType}`
        );

        return { success: true, id: promotionId };
      }),
  }),

  /**
   * Admin router for management features
   */
  admin: router({
    /**
     * Get all products including hidden variants (for admin panel)
     */
    listAllProducts: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "administrador" && ctx.user.role !== "operador" && ctx.user.role !== "vendedor") {
        throw new Error("Only admins, operators, and sellers can view all products");
      }

      return await getProductsForAdmin();
    }),

    /**
     * Export all products with variants, pricing, and promotions
     */
    exportProducts: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "administrador") {
        throw new Error("Only admins can export products");
      }

      const products = await getProductsForExport();

        await logAudit(
          ctx.user.id,
          "PRODUCTS_EXPORTED",
          "products",
          undefined,
          `Exported ${products.length} products`
        );

      return products;
    }),

    /**
     * Update role-based pricing for a product
     */
    updatePricing: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
          role: z.enum(["cliente", "operador", "administrador", "vendedor"]),
          price: z.string(),
          minQuantity: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Only admins can update pricing");
        }

        const id = await updateRolePricing(
          input.productId,
          input.role,
          input.price,
          input.minQuantity
        );

        await logAudit(
          ctx.user.id,
          "PRICING_UPDATED",
          "rolePricing",
          id || undefined,
          `Product: ${input.productId}, Role: ${input.role}, Price: ${input.price}`
        );

        return { success: true, id };
      }),

    /**
     * Import products from structured data
     */
    importProducts: protectedProcedure
      .input(
        z.object({
          products: z.array(
            z.object({
              sku: z.string(),
              name: z.string(),
              description: z.string().optional(),
              category: z.string().optional(),
              image: z.string().optional(),
              basePrice: z.string(),
              stock: z.number(),
              variants: z
                .array(
                  z.object({
                    variantType: z.string(),
                    variantValue: z.string(),
                    sku: z.string().optional(),
                    stock: z.number(),
                  })
                )
                .optional(),
              pricing: z
                .array(
                  z.object({
                    role: z.enum(["cliente", "operador", "administrador", "vendedor"]),
                    price: z.string(),
                    minQuantity: z.number(),
                  })
                )
                .optional(),
              promotions: z
                .array(
                  z.object({
                    name: z.string(),
                    description: z.string().optional(),
                    discountType: z.enum(["percentage", "fixed"]),
                    discountValue: z.string(),
                    startDate: z.date(),
                    endDate: z.date(),
                  })
                )
                .optional(),
              minimumQuantities: z
                .array(
                  z.object({
                    role: z.enum(["cliente", "operador", "administrador", "vendedor"]),
                    minQty: z.number(),
                  })
                )
                .optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Only admins can import products");
        }

        const result = await importProducts(input.products);

        await logAudit(
          ctx.user.id,
          "PRODUCTS_IMPORTED",
          "products",
          undefined,
          `Imported ${input.products.length} products`
        );

        return result;
      }),

    /**
     * Get all orders for admin view
     */
    getAllOrders: protectedProcedure.query(async ({ ctx }) => {
      // Allow access to admin roles: administrador, operador, vendedor
      const allowedRoles = ["administrador", "operador", "vendedor"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new Error("No tienes permisos para ver los pedidos");
      }

      const db = await getDb();
      if (!db) {
        return [];
      }

      const allOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt));

      // Get order items with product details for each order
      const ordersWithDetails = await Promise.all(
        allOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, order.id));

          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, order.userId))
            .limit(1);

          // Get client info if exists (clientId is the agent/vendor)
          let agent = null;
          if (order.clientId) {
            const agentResult = await db
              .select()
              .from(users)
              .where(eq(users.id, order.clientId))
              .limit(1);
            agent = agentResult[0] || null;
          }

          // Calculate total amount
          const totalAmount = items.reduce((sum, item) => {
            return sum + (item.orderItems.pricePerUnit * item.orderItems.quantity);
          }, 0);

          return {
            ...order,
            user: user[0] || null,
            agent: agent,
            totalAmount: totalAmount,
            items: items.map((item) => ({
              ...item.orderItems,
              product: item.products,
            })),
          };
        })
      );

      return ordersWithDetails;
    }),

    /**
     * Update order status
     */
    updateOrderStatus: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
          status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Allow access to admin roles: administrador, operador, vendedor
        const allowedRoles = ["administrador", "operador", "vendedor"];
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new Error("No tienes permisos para actualizar el estado del pedido");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        await db
          .update(orders)
          .set({ status: input.status })
          .where(eq(orders.id, input.orderId));

        await logAudit(
          ctx.user.id,
          "ORDER_STATUS_UPDATED",
          "orders",
          input.orderId,
          `Status updated to: ${input.status}`
        );

        return { success: true };
      }),

    /**
     * Create or update a product
     */
    upsertProduct: protectedProcedure
      .input(
        z.object({
          id: z.string().optional(),
          sku: z.string(),
          name: z.string(),
          description: z.string().optional(),
          category: z.string().optional(),
          image: z.string().optional(),
          basePrice: z.string(),
          stock: z.number(),
          isActive: z.boolean(),
          // Nuevos campos
          minQuantity: z.number().optional(),
          unitsPerBox: z.number().optional(),
          line1Text: z.string().optional(),
          line2Text: z.string().optional(),
          // Precios diferenciados
          precioCiudad: z.string().optional(),
          precioInterior: z.string().optional(),
          precioEspecial: z.string().optional(),
          variants: z.array(
            z.object({
              type: z.string(),
              value: z.string(),
              sku: z.string(),
              stock: z.number(),
            })
          ).optional(),
          pricing: z.array(
            z.object({
              role: z.string(),
              price: z.string(),
              minQty: z.number(),
            })
          ).optional(),
          promotions: z.array(
            z.object({
              name: z.string(),
              discountType: z.string(),
              discountValue: z.string(),
            })
          ).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Only admins can manage products");
        }

        // Create or update product
        const productId = await upsertProduct({
          id: input.id,
          sku: input.sku,
          name: input.name,
          description: input.description,
          category: input.category,
          image: input.image,
          basePrice: input.basePrice,
          stock: input.stock,
          isActive: input.isActive,
          minQuantity: input.minQuantity,
          unitsPerBox: input.unitsPerBox,
          line1Text: input.line1Text,
          line2Text: input.line2Text,
          precioCiudad: input.precioCiudad,
          precioInterior: input.precioInterior,
          precioEspecial: input.precioEspecial,
        });

        // Update variants if provided
        if (input.variants && input.variants.length > 0) {
          await upsertProductVariants(productId, input.variants);
        }

        // Update pricing if provided
        if (input.pricing && input.pricing.length > 0) {
          await upsertRolePricing(productId, input.pricing);
        }

        // Create promotions if provided
        if (input.promotions && input.promotions.length > 0) {
          await createProductPromotions(productId, input.promotions);
        }

        await logAudit(
          ctx.user.id,
          input.id ? "PRODUCT_UPDATED" : "PRODUCT_CREATED",
          "products",
          productId,
          `Product ${input.sku} ${input.id ? "updated" : "created"}`
        );

        return { success: true, productId };
      }),

    /**
     * Delete a product
     */
    deleteProduct: protectedProcedure
      .input(
        z.object({
          productId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Only admins can delete products");
        }

        await deleteProduct(input.productId);

        await logAudit(
          ctx.user.id,
          "PRODUCT_DELETED",
          "products",
          input.productId,
          "Product deleted"
        );

        return { success: true };
      }),

    /**
     * Delete order
     */
    deleteOrder: protectedProcedure
      .input(
        z.object({
          orderId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Allow access to admin roles: administrador, operador
        const allowedRoles = ["administrador", "operador"];
        if (!allowedRoles.includes(ctx.user.role)) {
          throw new Error("No tienes permisos para eliminar pedidos");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Delete order items first
        await db.delete(orderItems).where(eq(orderItems.orderId, input.orderId));

        // Delete order
        await db.delete(orders).where(eq(orders.id, input.orderId));

        await logAudit(
          ctx.user.id,
          "ORDER_DELETED",
          "orders",
          input.orderId,
          "Order deleted"
        );

        return { success: true };
      }),

    /**
     * Generate PDF preview with sample data
     */
    previewPDF: protectedProcedure
      .input(
        z.object({
          config: z.string(), // JSON string of PDFConfig
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Only admins can preview PDFs");
        }

        const { generateOrderPDF } = await import("./order-export-service");

        // Sample order data
        const sampleOrder = {
          orderNumber: "PREVIEW-001",
          createdAt: new Date(),
          subtotal: "100.00",
          tax: "10.00",
          total: "110.00",
          user: {
            name: "Cliente Ejemplo",
            email: "cliente@ejemplo.com",
            companyName: "Empresa Ejemplo S.A.",
            phone: "+1234567890",
            address: "Calle Ejemplo 123, Ciudad",
            clientNumber: "CLI-001",
          },
          items: [
            {
              productName: "Producto de Ejemplo 1",
              quantity: 5,
              pricePerUnit: "10.00",
              subtotal: "50.00",
              sku: "PROD-001",
              stock: 100,
              category: "Categoría A",
            },
            {
              productName: "Producto de Ejemplo 2",
              quantity: 10,
              pricePerUnit: "5.00",
              subtotal: "50.00",
              sku: "PROD-002",
              stock: 50,
              category: "Categoría B",
            },
          ],
        };

        // Override config temporarily
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Save preview config temporarily
        await db.execute(sql`
          INSERT INTO systemConfig (\`key\`, \`value\`, updatedBy)
          VALUES ('report_config_preview', ${input.config}, ${ctx.user.id})
          ON DUPLICATE KEY UPDATE
            \`value\` = VALUES(\`value\`),
            updatedBy = VALUES(updatedBy)
        `);

        // Generate PDF with preview config
        console.log('[Preview PDF] Generating PDF with config:', input.config);
        const pdfBuffer = await generateOrderPDF(sampleOrder as any, true);
        console.log('[Preview PDF] PDF generated, buffer size:', pdfBuffer.length, 'bytes');

        // Clean up preview config
        await db.execute(sql`
          DELETE FROM systemConfig WHERE \`key\` = 'report_config_preview'
        `);

        // Return base64 encoded PDF
        const base64 = pdfBuffer.toString('base64');
        console.log('[Preview PDF] Base64 length:', base64.length);
        return {
          pdf: base64,
        };
      }),
  }),

  /**
   * Users management router
   */
  users: router({
    /**
     * Create new user
     */
    create: protectedProcedure
      .input(
        z.object({
          username: z.string().min(3),
          email: z.string().email().optional().or(z.literal("")),
          password: z.string().min(6),
          companyName: z.string().min(1),
          contactPerson: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          gpsLocation: z.string().optional(),
          clientNumber: z.string().optional(),
          agentNumber: z.string().optional(),
          role: z.enum(["cliente", "operador", "administrador", "vendedor"]),
          priceType: z.enum(["ciudad", "interior", "especial"]).default("ciudad"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verificar permisos según el sistema de permisos
        const userRole = ctx.user.role as "cliente" | "operador" | "administrador" | "vendedor";
        
        // Solo administradores, operadores y vendedores pueden crear usuarios
        if (userRole === "cliente") {
          throw new Error("No tiene permisos para crear usuarios");
        }
        
        // Operadores no pueden crear administradores
        if (userRole === "operador" && input.role === "administrador") {
          throw new Error("Los operadores no pueden crear administradores");
        }
        
        // Vendedores solo pueden crear clientes
        if (userRole === "vendedor" && input.role !== "cliente") {
          throw new Error("Los vendedores solo pueden crear clientes");
        }

        const result = await createUser(input);

        await logAudit(
          ctx.user.id,
          "USER_CREATED",
          "users",
          result.userId,
          `Usuario ${input.username} creado`
        );

        return result;
      }),

    /**
     * List users with statistics
     */
    listWithStats: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          role: z.string().optional(),
          status: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden ver la lista de usuarios");
        }

        return await listUsersWithStats(input);
      }),

    /**
     * Get users statistics
     */
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "administrador") {
        throw new Error("Solo los administradores pueden ver estadísticas");
      }

      return await getUsersStats();
    }),

    /**
     * Get clients assigned to current seller (vendedor)
     */
    getMyClients: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "vendedor") {
        throw new Error("Solo los vendedores pueden ver sus clientes");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { users } = await import("../drizzle/schema");

      // Get clients assigned to this seller by agentNumber
      const clients = await db
        .select()
        .from(users)
        .where(eq(users.agentNumber, ctx.user.agentNumber || ""))
        .orderBy(desc(users.createdAt));

      return clients;
    }),

    /**
     * Create new client (for vendors)
     */
    createClient: protectedProcedure
      .input(
        z.object({
          clientNumber: z.string().min(1),
          companyName: z.string().min(1),
          contactPerson: z.string().min(1),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().min(1),
          address: z.string().optional(),
          gpsLocation: z.string().optional(),
          companyTaxId: z.string().optional(),
          priceType: z.enum(["ciudad", "interior", "especial"]).default("ciudad"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "vendedor" && ctx.user.role !== "administrador") {
          throw new Error("Solo los vendedores pueden crear clientes");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { users } = await import("../drizzle/schema");
        const bcrypt = await import("bcryptjs");

        // Check if email already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new Error("Ya existe un usuario con este email");
        }

        // Generate username from company name
        const username = input.companyName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .substring(0, 20) + Math.floor(Math.random() * 1000);

        // Generate random password
        const tempPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Generate unique ID
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create client with vendor's agent number
        await db.insert(users).values({
          id: userId,
          username,
          email: input.email,
          password: hashedPassword,
          name: input.contactPerson,
          companyName: input.companyName,
          contactPerson: input.contactPerson,
          phone: input.phone,
          address: input.address || null,
          gpsLocation: input.gpsLocation || null,
          companyTaxId: input.companyTaxId || null,
          clientNumber: input.clientNumber,
          role: "cliente",
          priceType: input.priceType,
          agentNumber: ctx.user.agentNumber || ctx.user.username,
          isActive: 1,
          status: "active",
        });

        // Retrieve the created client
        const [createdClient] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        return {
          ...createdClient,
          tempPassword, // Return temp password to show to vendor
        };
      }),

    /**
     * Update client information (for vendors)
     */
    updateClient: protectedProcedure
      .input(
        z.object({
          clientId: z.string(),
          companyName: z.string().optional(),
          contactPerson: z.string().optional(),
          email: z.string().email().optional().or(z.literal("")),
          phone: z.string().optional(),
          address: z.string().optional(),
          gpsLocation: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
          companyTaxId: z.string().optional(),
          priceType: z.enum(["ciudad", "interior", "especial"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "vendedor" && ctx.user.role !== "administrador") {
          throw new Error("Solo los vendedores pueden actualizar clientes");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { users } = await import("../drizzle/schema");

        // Verificar que el cliente pertenece al vendedor
        if (ctx.user.role === "vendedor") {
          const [client] = await db
            .select()
            .from(users)
            .where(eq(users.id, input.clientId))
            .limit(1);

          if (!client) {
            throw new Error("Cliente no encontrado");
          }

          if (client.agentNumber !== ctx.user.agentNumber) {
            throw new Error("No tienes permiso para editar este cliente");
          }
        }

        // Actualizar cliente - filtrar campos vacíos o undefined
        const { clientId, ...updateData } = input;
        
        // Remover campos vacíos, undefined o null
        const cleanedData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => 
            value !== undefined && value !== null && value !== ""
          )
        );
        
        const result = await updateUser(clientId, cleanedData);

        await logAudit(
          ctx.user.id,
          "CLIENT_UPDATED",
          "users",
          clientId,
          `Cliente actualizado: ${Object.keys(updateData).join(", ")}`
        );

        return result;
      }),

    /**
     * Toggle user freeze status
     */
    toggleFreeze: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden congelar cuentas");
        }

        if (input.userId === ctx.user.id) {
          throw new Error("No puedes congelar tu propia cuenta");
        }

        const result = await toggleUserFreeze(input.userId);

        await logAudit(
          ctx.user.id,
          "USER_STATUS_CHANGED",
          "users",
          input.userId,
          `Estado cambiado a ${result.newStatus}`
        );

        return result;
      }),

    /**
     * Change user password
     */
    changePassword: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          newPassword: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden cambiar contraseñas");
        }

        const result = await changeUserPassword(input.userId, input.newPassword);

        await logAudit(
          ctx.user.id,
          "USER_PASSWORD_CHANGED",
          "users",
          input.userId,
          "Contraseña cambiada por administrador"
        );

        return result;
      }),

    /**
     * Update user information
     */
    update: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
          username: z.string().optional(),
          email: z.string().email().optional(),
          companyName: z.string().optional(),
          contactPerson: z.string().optional(),
          companyTaxId: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          gpsLocation: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
          clientNumber: z.string().optional(),
          agentNumber: z.string().optional(),
          role: z.enum(["cliente", "operador", "administrador", "vendedor"]).optional(),
          priceType: z.enum(["ciudad", "interior", "especial"]).optional(),
          status: z.enum(["active", "frozen"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden actualizar usuarios");
        }

        const { userId, ...updateData } = input;
        const result = await updateUser(userId, updateData);

        await logAudit(
          ctx.user.id,
          "USER_UPDATED",
          "users",
          userId,
          `Información actualizada: ${Object.keys(updateData).join(", ")}`
        );

        return result;
      }),

    /**
     * Delete user
     */
    delete: protectedProcedure
      .input(
        z.object({
          userId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden eliminar usuarios");
        }

        if (input.userId === ctx.user.id) {
          throw new Error("No puedes eliminar tu propia cuenta");
        }

        const result = await deleteUser(input.userId);

        await logAudit(
          ctx.user.id,
          "USER_DELETED",
          "users",
          input.userId,
          "Usuario eliminado"
        );

        return result;
      }),
  }),

  // Import router for bulk product imports
  import: importRouter,

  /**
   * System configuration router
   */
  config: router({
    /**
     * Get all system configuration
     */
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { systemConfig } = await import("../drizzle/schema");
      const configs = await db.select().from(systemConfig);

      // Convert to key-value object
      const configObj: Record<string, string> = {};
      configs.forEach((config) => {
        configObj[config.key] = config.value || "";
      });

      return configObj;
    }),

    /**
     * Update system configuration
     */
    update: protectedProcedure
      .input(
        z.object({
          emailFrom: z.string().email().optional(),
          emailToOrders: z.array(z.string().email()).optional(),
          popupEnabled: z.boolean().optional(),
          popupTitle: z.string().optional(),
          popupMessage: z.string().optional(),
          taxRate: z.string().optional(),
          timezone: z.string().optional(),
          currency: z.string().optional(),
          currencySymbol: z.string().optional(),
          storeName: z.string().optional(),
          storePhone: z.string().optional(),
          storeAddress: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden actualizar la configuración");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { systemConfig } = await import("../drizzle/schema");

        // Update each configuration value
        if (input.emailFrom !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.emailFrom, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "email_from"));
        }

        if (input.emailToOrders !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: JSON.stringify(input.emailToOrders), updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "email_to_orders"));
        }

        if (input.popupEnabled !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.popupEnabled.toString(), updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "popup_enabled"));
        }

        if (input.popupTitle !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.popupTitle, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "popup_title"));
        }

        if (input.popupMessage !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.popupMessage, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "popup_message"));
        }

        if (input.taxRate !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.taxRate, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "tax_rate"));
        }

        if (input.timezone !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.timezone, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "timezone"));
        }

        if (input.currency !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.currency, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "currency"));
        }

        if (input.currencySymbol !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.currencySymbol, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "currency_symbol"));
        }

        if (input.storeName !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.storeName, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "store_name"));
        }

        if (input.storePhone !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.storePhone, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "store_phone"));
        }

        if (input.storeAddress !== undefined) {
          await db
            .update(systemConfig)
            .set({ value: input.storeAddress, updatedBy: ctx.user.id })
            .where(eq(systemConfig.key, "store_address"));
        }

        await logAudit(
          ctx.user.id,
          "CONFIG_UPDATED",
          "systemConfig",
          undefined,
          JSON.stringify(input)
        );

        return { success: true };
      }),

    /**
     * Get product fields configuration
     */
    getProductFields: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { systemConfig } = await import("../drizzle/schema");
      
      const config = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, "product_card_fields"))
        .limit(1);

      if (!config[0]?.value) {
        // Return default configuration
        return [
          { field: "name", label: "Nombre", enabled: true, order: 1, displayType: "text", column: "full", textColor: "#000000", fontSize: "16px", fontWeight: "600", textAlign: "left" },
          { field: "sku", label: "Código del artículo", enabled: false, order: 2, displayType: "text", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "dimension", label: "Dimensión", enabled: false, order: 3, displayType: "text", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "line1Text", label: "Línea 1", enabled: false, order: 4, displayType: "text", column: "full", textColor: "#666666", fontSize: "12px", fontWeight: "400", textAlign: "left" },
          { field: "minQuantity", label: "Cantidad mínima", enabled: false, order: 5, displayType: "number", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "line2Text", label: "Línea 2", enabled: false, order: 6, displayType: "text", column: "full", textColor: "#dc2626", fontSize: "14px", fontWeight: "600", textAlign: "left" },
          { field: "unitsPerBox", label: "Unidades por caja", enabled: false, order: 7, displayType: "number", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "rolePrice", label: "Precio", enabled: true, order: 8, displayType: "price", column: "full", textColor: "#000000", fontSize: "18px", fontWeight: "700", textAlign: "left" },
          { field: "stock", label: "Stock", enabled: true, order: 9, displayType: "number", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "customText", label: "Campo Texto (8 car.)", enabled: false, order: 10, displayType: "text", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left", maxLength: 8 },
          { field: "customSelect", label: "Selección Personalizada", enabled: false, order: 11, displayType: "badge", column: "full", textColor: "#3b82f6", fontSize: "12px", fontWeight: "500", textAlign: "left", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4", "Opción 5"] },
        ];
      }

      return JSON.parse(config[0].value);
    }),

    /**
     * Update product fields configuration
     */
    updateProductFields: protectedProcedure
      .input(
        z.array(
          z.object({
            field: z.string(),
            label: z.string(),
            enabled: z.boolean(),
            order: z.number(),
            displayType: z.string(),
            column: z.string().optional(),
            textColor: z.string().optional(),
            fontSize: z.string().optional(),
            fontWeight: z.string().optional(),
            textAlign: z.string().optional(),
            maxLength: z.number().optional(),
            options: z.array(z.string()).optional(),
          })
        )
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden actualizar la configuración");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { systemConfig } = await import("../drizzle/schema");

        // Use INSERT ON DUPLICATE KEY UPDATE to handle both insert and update
        await db
          .insert(systemConfig)
          .values({
            key: "product_card_fields",
            value: JSON.stringify(input),
            updatedBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: {
              value: JSON.stringify(input),
              updatedBy: ctx.user.id,
            },
          });

        await logAudit(
          ctx.user.id,
          "PRODUCT_FIELDS_CONFIG_UPDATED",
          "systemConfig",
          undefined,
          JSON.stringify(input)
        );

        return { success: true };
      }),

    /**
     * Get product fields configuration for vendor role
     */
    getProductFieldsVendor: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { systemConfig } = await import("../drizzle/schema");
      
      const config = await db
        .select()
        .from(systemConfig)
        .where(eq(systemConfig.key, "product_card_fields_vendor"))
        .limit(1);

      if (!config[0]?.value) {
        // Return default configuration for vendors
        return [
          { field: "name", label: "Nombre", enabled: true, order: 1, displayType: "text", column: "full", textColor: "#000000", fontSize: "16px", fontWeight: "600", textAlign: "left" },
          { field: "sku", label: "Código del artículo", enabled: true, order: 2, displayType: "text", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "dimension", label: "Dimensión", enabled: false, order: 3, displayType: "text", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "line1Text", label: "Línea 1", enabled: false, order: 4, displayType: "text", column: "full", textColor: "#666666", fontSize: "12px", fontWeight: "400", textAlign: "left" },
          { field: "minQuantity", label: "Cantidad mínima", enabled: true, order: 5, displayType: "number", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "line2Text", label: "Línea 2", enabled: false, order: 6, displayType: "text", column: "full", textColor: "#dc2626", fontSize: "14px", fontWeight: "600", textAlign: "left" },
          { field: "unitsPerBox", label: "Unidades por caja", enabled: true, order: 7, displayType: "number", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "rolePrice", label: "Precio", enabled: true, order: 8, displayType: "price", column: "full", textColor: "#000000", fontSize: "18px", fontWeight: "700", textAlign: "left" },
          { field: "stock", label: "Stock", enabled: true, order: 9, displayType: "number", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left" },
          { field: "customText", label: "Campo Texto (8 car.)", enabled: false, order: 10, displayType: "text", column: "full", textColor: "#666666", fontSize: "14px", fontWeight: "400", textAlign: "left", maxLength: 8 },
          { field: "customSelect", label: "Selección Personalizada", enabled: false, order: 11, displayType: "badge", column: "full", textColor: "#3b82f6", fontSize: "12px", fontWeight: "500", textAlign: "left", options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4", "Opción 5"] },
        ];
      }

      return JSON.parse(config[0].value);
    }),

    /**
     * Update product fields configuration for vendor role
     */
    updateProductFieldsVendor: protectedProcedure
      .input(
        z.array(
          z.object({
            field: z.string(),
            label: z.string(),
            enabled: z.boolean(),
            order: z.number(),
            displayType: z.string(),
            column: z.string().optional(),
            textColor: z.string().optional(),
            fontSize: z.string().optional(),
            fontWeight: z.string().optional(),
            textAlign: z.string().optional(),
            maxLength: z.number().optional(),
            options: z.array(z.string()).optional(),
          })
        )
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden actualizar la configuración");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { systemConfig } = await import("../drizzle/schema");

        // Use INSERT ON DUPLICATE KEY UPDATE to handle both insert and update
        await db
          .insert(systemConfig)
          .values({
            key: "product_card_fields_vendor",
            value: JSON.stringify(input),
            updatedBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: {
              value: JSON.stringify(input),
              updatedBy: ctx.user.id,
            },
          });

        await logAudit(
          ctx.user.id,
          "PRODUCT_FIELDS_VENDOR_CONFIG_UPDATED",
          "systemConfig",
          undefined,
          JSON.stringify(input)
        );

        return { success: true };
      }),

    /**
     * Get card styles configuration
     */
    getCardStyles: protectedProcedure.query(async () => {
      // Allow all authenticated users to read card styles
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { systemConfig } = await import("../drizzle/schema");
      
      const configs = await db
        .select()
        .from(systemConfig)
        .where(
          eq(systemConfig.key, "product_card_margins")
        );

      const marginsConfig = configs.find(c => c.key === "product_card_margins");
      const allConfigs = await db.select().from(systemConfig);
      const imageSpacing = allConfigs.find(c => c.key === "product_card_image_spacing")?.value || "16";
      const fieldSpacing = allConfigs.find(c => c.key === "product_card_field_spacing")?.value || "4";

      return {
        margins: marginsConfig?.value ? JSON.parse(marginsConfig.value) : { top: 6, bottom: 8, left: 6, right: 6 },
        imageSpacing: parseInt(imageSpacing),
        fieldSpacing: parseInt(fieldSpacing),
      };
    }),

    /**
     * Update card styles configuration
     */
    updateCardStyles: protectedProcedure
      .input(
        z.object({
          margins: z.object({
            top: z.number(),
            bottom: z.number(),
            left: z.number(),
            right: z.number(),
          }),
          imageSpacing: z.number(),
          fieldSpacing: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden actualizar la configuración");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { systemConfig } = await import("../drizzle/schema");

        // Use INSERT ON DUPLICATE KEY UPDATE for margins
        await db
          .insert(systemConfig)
          .values({
            key: "product_card_margins",
            value: JSON.stringify(input.margins),
            updatedBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: {
              value: JSON.stringify(input.margins),
              updatedBy: ctx.user.id,
            },
          });

        // Use INSERT ON DUPLICATE KEY UPDATE for image spacing
        await db
          .insert(systemConfig)
          .values({
            key: "product_card_image_spacing",
            value: input.imageSpacing.toString(),
            updatedBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: {
              value: input.imageSpacing.toString(),
              updatedBy: ctx.user.id,
            },
          });

        // Use INSERT ON DUPLICATE KEY UPDATE for field spacing
        await db
          .insert(systemConfig)
          .values({
            key: "product_card_field_spacing",
            value: input.fieldSpacing.toString(),
            updatedBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({
            set: {
              value: input.fieldSpacing.toString(),
              updatedBy: ctx.user.id,
            },
          });

        await logAudit(
          ctx.user.id,
          "CARD_STYLES_UPDATED",
          "systemConfig",
          undefined,
          JSON.stringify(input)
        );

        return { success: true };
      }),

    /**
     * Get popup configuration (public for login page)
     */
    getPopup: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { systemConfig } = await import("../drizzle/schema");
      
      const configs = await db
        .select()
        .from(systemConfig)
        .where(
          eq(systemConfig.key, "popup_enabled")
        );

      const enabled = configs.find(c => c.key === "popup_enabled");
      
      if (enabled?.value !== "true") {
        return { enabled: false };
      }

      const allConfigs = await db.select().from(systemConfig);
      const title = allConfigs.find(c => c.key === "popup_title")?.value || "";
      const message = allConfigs.find(c => c.key === "popup_message")?.value || "";

      return {
        enabled: true,
        title,
        message,
      };
    }),

    /**
     * Get SMTP configuration
     */
    getSmtpConfig: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "administrador") {
        throw new Error("Solo los administradores pueden ver la configuración SMTP");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { systemConfig } = await import("../drizzle/schema");
      
      const configs = await db.select().from(systemConfig);
      
      const user = configs.find(c => c.key === "smtp_user")?.value || "";
      return {
        host: configs.find(c => c.key === "smtp_host")?.value || "smtp.gmail.com",
        port: configs.find(c => c.key === "smtp_port")?.value || "587",
        secure: configs.find(c => c.key === "smtp_secure")?.value || "tls",
        user,
        password: configs.find(c => c.key === "smtp_password")?.value || "",
        fromName: configs.find(c => c.key === "smtp_from_name")?.value || "IMPORKAM Tienda",
        fromEmail: configs.find(c => c.key === "smtp_from_email")?.value || "",
        recipientEmail: configs.find(c => c.key === "order_recipient_email")?.value || user,
      };
    }),

    /**
     * Update SMTP configuration
     */
    updateSmtpConfig: protectedProcedure
      .input(
        z.object({
          host: z.string(),
          port: z.string(),
          secure: z.string(),
          user: z.string(),
          password: z.string(),
          fromName: z.string(),
          fromEmail: z.string(),
          recipientEmail: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden actualizar la configuración SMTP");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { systemConfig } = await import("../drizzle/schema");

        const updates = [
          { key: "smtp_host", value: input.host },
          { key: "smtp_port", value: input.port },
          { key: "smtp_secure", value: input.secure },
          { key: "smtp_user", value: input.user },
          { key: "smtp_password", value: input.password },
          { key: "smtp_from_name", value: input.fromName },
          { key: "smtp_from_email", value: input.fromEmail },
          { key: "order_recipient_email", value: input.recipientEmail || input.user },
        ];

        for (const update of updates) {
          await db.execute(sql`
            INSERT INTO systemConfig (\`key\`, \`value\`, updatedBy)
            VALUES (${update.key}, ${update.value}, ${ctx.user.id})
            ON DUPLICATE KEY UPDATE
              \`value\` = VALUES(\`value\`),
              updatedBy = VALUES(updatedBy)
          `);
        }

        await logAudit(
          ctx.user.id,
          "SMTP_CONFIG_UPDATED",
          "systemConfig",
          undefined,
          JSON.stringify(input)
        );

        return { success: true };
      }),

    /**
     * Send test email
     */
    sendTestEmail: protectedProcedure
      .input(
        z.object({
          to: z.string().email(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden enviar emails de prueba");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { systemConfig } = await import("../drizzle/schema");
        const nodemailer = await import("nodemailer");
        
        const configs = await db.select().from(systemConfig);
        
        const smtpConfig = {
          host: configs.find(c => c.key === "smtp_host")?.value || "smtp.gmail.com",
          port: parseInt(configs.find(c => c.key === "smtp_port")?.value || "587"),
          secure: configs.find(c => c.key === "smtp_secure")?.value === "ssl",
          auth: {
            user: configs.find(c => c.key === "smtp_user")?.value || "",
            pass: configs.find(c => c.key === "smtp_password")?.value || "",
          },
        };

        const fromName = configs.find(c => c.key === "smtp_from_name")?.value || "IMPORKAM Tienda";
        const fromEmail = configs.find(c => c.key === "smtp_from_email")?.value || "";

        if (!smtpConfig.auth.user || !smtpConfig.auth.pass || !fromEmail) {
          throw new Error("Configuración SMTP incompleta. Por favor configura usuario, contraseña y email de remitente.");
        }

        try {
          const transporter = nodemailer.default.createTransport(smtpConfig);

          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: input.to,
            subject: "Email de Prueba - IMPORKAM Tienda",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Email de Prueba</h2>
                <p>Este es un email de prueba desde tu tienda <strong>${fromName}</strong>.</p>
                <p>Si recibes este mensaje, tu configuración SMTP está funcionando correctamente.</p>
                <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 12px;">
                  Configuración actual:<br>
                  Servidor: ${smtpConfig.host}:${smtpConfig.port}<br>
                  Seguridad: ${configs.find(c => c.key === "smtp_secure")?.value || "tls"}<br>
                  Usuario: ${smtpConfig.auth.user}
                </p>
              </div>
            `,
          });

          await logAudit(
            ctx.user.id,
            "TEST_EMAIL_SENT",
            "email",
            undefined,
            JSON.stringify({ to: input.to })
          );

          return { success: true, message: "Email de prueba enviado exitosamente" };
        } catch (error: any) {
          console.error("Error sending test email:", error);
          throw new Error(`Error al enviar email: ${error.message}`);
        }
      }),

    /**
     * Get logo configuration (public)
     */
    getLogoConfig: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { systemConfig } = await import("../drizzle/schema");
      
      const configs = await db.select().from(systemConfig);
      
      return {
        url: configs.find(c => c.key === "logo_url")?.value || "/logo.png",
        sizeNavbar: parseInt(configs.find(c => c.key === "logo_size_navbar")?.value || "120"),
        sizeLogin: parseInt(configs.find(c => c.key === "logo_size_login")?.value || "200"),
        sizeFooter: parseInt(configs.find(c => c.key === "logo_size_footer")?.value || "100"),
        sizeEmail: parseInt(configs.find(c => c.key === "logo_size_email")?.value || "150"),
        loginText: configs.find(c => c.key === "login_text")?.value || "Plataforma B2B de Ventas Mayoristas",
        loginTextColor: configs.find(c => c.key === "login_text_color")?.value || "#374151",
        loginTextSize: parseInt(configs.find(c => c.key === "login_text_size")?.value || "18"),
        loginTextWeight: configs.find(c => c.key === "login_text_weight")?.value || "500",
        loginTextAlign: configs.find(c => c.key === "login_text_align")?.value || "center",
      };
    }),

    /**
     * Update logo configuration
     */
    updateLogoConfig: protectedProcedure
      .input(
        z.object({
          url: z.string(),
          sizeNavbar: z.number(),
          sizeLogin: z.number(),
          sizeFooter: z.number(),
          sizeEmail: z.number(),
          loginText: z.string().optional(),
          loginTextColor: z.string().optional(),
          loginTextSize: z.number().optional(),
          loginTextWeight: z.string().optional(),
          loginTextAlign: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Solo los administradores pueden actualizar la configuración de logo");
        }

        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { systemConfig } = await import("../drizzle/schema");

        const updates = [
          { key: "logo_url", value: input.url },
          { key: "logo_size_navbar", value: input.sizeNavbar.toString() },
          { key: "logo_size_login", value: input.sizeLogin.toString() },
          { key: "logo_size_footer", value: input.sizeFooter.toString() },
          { key: "logo_size_email", value: input.sizeEmail.toString() },
        ];
        
        if (input.loginText !== undefined) {
          updates.push({ key: "login_text", value: input.loginText });
        }
        if (input.loginTextColor !== undefined) {
          updates.push({ key: "login_text_color", value: input.loginTextColor });
        }
        if (input.loginTextSize !== undefined) {
          updates.push({ key: "login_text_size", value: input.loginTextSize.toString() });
        }
        if (input.loginTextWeight !== undefined) {
          updates.push({ key: "login_text_weight", value: input.loginTextWeight });
        }
        if (input.loginTextAlign !== undefined) {
          updates.push({ key: "login_text_align", value: input.loginTextAlign });
        }

        for (const update of updates) {
          await db.execute(sql`
            INSERT INTO systemConfig (\`key\`, \`value\`, updatedBy)
            VALUES (${update.key}, ${update.value}, ${ctx.user.id})
            ON DUPLICATE KEY UPDATE
              \`value\` = VALUES(\`value\`),
              updatedBy = VALUES(updatedBy)
          `);
        }

        await logAudit(
          ctx.user.id,
          "LOGO_CONFIG_UPDATED",
          "systemConfig",
          undefined,
          JSON.stringify(input)
        );

      return { success: true };
    }),
  }),

  /**
   * System Configuration router
   */
  systemConfig: router({
    /**
     * Get a system configuration value by key
     */
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const result = await db
          .select()
          .from(systemConfig)
          .where(eq(systemConfig.key, input.key))
          .limit(1);

        return result.length > 0 ? result[0] : null;
      }),

    /**
     * Upsert a system configuration value
     */
    upsert: protectedProcedure
      .input(
        z.object({
          key: z.string(),
          value: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "administrador") {
          throw new Error("Only admins can update system configuration");
        }

        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        await db.execute(sql`
          INSERT INTO systemConfig (\`key\`, \`value\`, updatedBy)
          VALUES (${input.key}, ${input.value}, ${ctx.user.id})
          ON DUPLICATE KEY UPDATE
            \`value\` = VALUES(\`value\`),
            updatedBy = VALUES(updatedBy)
        `);

        await logAudit(
          ctx.user.id,
          "SYSTEM_CONFIG_UPDATED",
          "systemConfig",
          undefined,
          `Key: ${input.key}`
        );

        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;;

