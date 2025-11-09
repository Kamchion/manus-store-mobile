import { eq, gt, and, or } from "drizzle-orm";
import { users, products, pricingByType, orders, orderItems } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";

/**
 * Router de sincronización para la aplicación móvil
 * Maneja descarga de catálogo, clientes y subida de pedidos
 */
export const syncRouter = router({
  /**
   * Obtiene el catálogo completo de productos con precios
   * Usado en la primera sincronización
   */
  getCatalog: protectedProcedure
    .input(
      z.object({
        lastSyncTimestamp: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      if (!db) {
        throw new Error("Base de datos no disponible");
      }

      // Obtener TODOS los productos activos (sin límite ni filtros)
      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.isActive, true));

      // Usar todos los productos sin filtrar
      // Simplificado: usar basePrice directamente (sin consulta a pricingByType)
      const enrichedProducts = allProducts.map((product) => {

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description || "",
          category: product.category || "Sin categoría",
          subcategory: product.subcategory || null,
          image: product.image || null,
          basePrice: product.basePrice,
            price: product.basePrice, // Usando basePrice temporalmente
            stock: product.stock,
          isActive: product.isActive || true,
          displayOrder: product.displayOrder || null,
          parentSku: product.parentSku || null,
          variantName: product.variantName || null,
          dimension: product.dimension || null,
          line1Text: product.line1Text || null,
          line2Text: product.line2Text || null,
          minQuantity: product.minQuantity || 1,
          minimumQuantity: product.minQuantity || 1,
          location: product.location || null,
          unitsPerBox: product.unitsPerBox || 0,
          hideInCatalog: product.hideInCatalog || false,
          customText: product.customText || null,
          customSelect: product.customSelect || null,
          createdAt: product.createdAt || null,
          updatedAt: product.updatedAt || product.createdAt,
        };
      });

      return {
        success: true,
        timestamp: new Date().toISOString(),
        products: enrichedProducts,
      };
    }),

  /**
   * Obtiene cambios incrementales desde la última sincronización
   */
  getChanges: protectedProcedure
    .input(
      z.object({
        lastSyncTimestamp: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      
      if (!db) {
        throw new Error("Base de datos no disponible");
      }

      const lastSync = new Date(input.lastSyncTimestamp);
      const userPriceType = ctx.user.priceType || 'ciudad';

      // Obtener productos actualizados desde la última sincronización
      const updatedProducts = await db
        .select()
        .from(products)
        .where(
          and(
            eq(products.isActive, true),
            gt(products.updatedAt, lastSync.toISOString())
          )
        );

      // Filtrar productos visibles
      const visibleProducts = updatedProducts.filter(
        (p) => !p.parentSku && !p.hideInCatalog
      );

      // Enriquecer con precios
      const enrichedProducts = await Promise.all(
        visibleProducts.map(async (product) => {
          const productPricing = await db
            .select()
            .from(pricingByType)
            .where(eq(pricingByType.productId, product.id));

          const priceForUser = productPricing.find(
            (p) => p.priceType === userPriceType
          )?.price || product.basePrice;

          return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description || "",
            category: product.category || "Sin categoría",
            image: product.image || null,
            basePrice: product.basePrice,
            price: priceForUser,
            stock: product.stock,
            minimumQuantity: product.minQuantity || 1,
            updatedAt: product.updatedAt || product.createdAt,
          };
        })
      );

      return {
        success: true,
        timestamp: new Date().toISOString(),
        products: enrichedProducts,
      };
    }),

  /**
   * Obtiene clientes asignados al vendedor autenticado
   */
  getClients: protectedProcedure
    .input(z.object({}).optional())
    .query(async ({ ctx }) => {
      const db = await getDb();
      
      if (!db) {
        throw new Error("Base de datos no disponible");
      }

      // Verificar que el usuario sea vendedor
      if (ctx.user.role !== "vendedor") {
        throw new Error("Solo los vendedores pueden acceder a esta función");
      }

      console.log("[getClients] Usuario vendedor:", {
        id: ctx.user.id,
        username: ctx.user.username,
        role: ctx.user.role,
        agentNumber: ctx.user.agentNumber
      });

      // Obtener clientes asignados al vendedor
      // Buscar clientes cuyo agentNumber coincida con el agentNumber del vendedor
      const clients = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          companyName: users.companyName,
          companyTaxId: users.companyTaxId,
          phone: users.phone,
          address: users.address,
          gpsLocation: users.gpsLocation,
          city: users.city,
          state: users.state,
          zipCode: users.zipCode,
          country: users.country,
          isActive: users.isActive,
          username: users.username,
          contactPerson: users.contactPerson,
          status: users.status,
          agentNumber: users.agentNumber,
          clientNumber: users.clientNumber,
          priceType: users.priceType,
          assignedVendorId: users.assignedVendorId,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(
          and(
            eq(users.role, "cliente"),
            eq(users.isActive, 1),
            eq(users.agentNumber, ctx.user.agentNumber)
          )
        );

      console.log("[getClients] Clientes encontrados:", clients.length);
      if (clients.length > 0) {
        console.log("[getClients] Primer cliente:", {
          id: clients[0].id,
          name: clients[0].name,
          assignedVendorId: clients[0].assignedVendorId
        });
      }

      return {
        success: true,
        clients: clients.map((c) => ({
          ...c,
          priceType: c.priceType || 'ciudad',
        })),
      };
    }),

  /**
   * Sube pedidos creados offline al servidor
   */
  uploadOrders: protectedProcedure
    .input(
      z.object({
        orders: z.array(
          z.object({
            clientId: z.string().optional(),
            customerNote: z.string().optional(),
            items: z.array(
              z.object({
                productId: z.string(),
                quantity: z.number().int().positive(),
                pricePerUnit: z.string(),
              })
            ),
            createdAtOffline: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      
      if (!db) {
        throw new Error("Base de datos no disponible");
      }

      const results = [];
      let uploaded = 0;

      for (const orderData of input.orders) {
        try {
          // Calcular totales
          let subtotal = 0;
          const orderItemsData = [];

          for (const item of orderData.items) {
            const product = await db
              .select()
              .from(products)
              .where(eq(products.id, item.productId))
              .limit(1);

            if (!product || product.length === 0) {
              throw new Error(`Producto no encontrado: ${item.productId}`);
            }

            const itemSubtotal = parseFloat(item.pricePerUnit) * item.quantity;
            subtotal += itemSubtotal;

            orderItemsData.push({
              productId: item.productId,
              productName: product[0].name,
              quantity: item.quantity,
              pricePerUnit: item.pricePerUnit,
              subtotal: itemSubtotal.toFixed(2),
            });
          }

          const tax = 0; // TODO: Calcular impuestos si es necesario
          const total = subtotal;

          // Crear pedido
          const orderId = `order_${nanoid()}`;
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

          await db.insert(orders).values({
            id: orderId,
            userId: ctx.user.id,
            clientId: orderData.clientId || null,
            orderNumber,
            status: "pending",
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            notes: orderData.customerNote || null,
          });

          // Crear items del pedido
          for (const itemData of orderItemsData) {
            await db.insert(orderItems).values({
              id: `item_${nanoid()}`,
              orderId,
              ...itemData,
            });
          }

          results.push({
            success: true,
            createdAtOffline: orderData.createdAtOffline,
            orderNumber,
          });

          uploaded++;
        } catch (error: any) {
          results.push({
            success: false,
            createdAtOffline: orderData.createdAtOffline,
            error: error.message || "Error desconocido",
          });
        }
      }

      return {
        success: true,
        uploaded,
        failed: input.orders.length - uploaded,
        results,
      };
    }),

  /**
   * Obtiene el estado de sincronización del vendedor
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    
    if (!db) {
      throw new Error("Base de datos no disponible");
    }

    // Contar productos activos
    const productsCount = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true));

    // Contar pedidos pendientes del vendedor
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.userId, ctx.user.id),
          eq(orders.status, "pending")
        )
      );

    return {
      success: true,
      timestamp: new Date().toISOString(),
      user: {
        id: ctx.user.id,
        name: ctx.user.name || ctx.user.username || "",
        email: ctx.user.email || "",
        role: ctx.user.role,
      },
      catalog: {
        totalProducts: productsCount.length,
        lastUpdate: new Date().toISOString(),
      },
      pendingOrders: pendingOrders.length,
    };
  }),

  /**
   * Obtiene el historial de pedidos del vendedor
   */
  getOrders: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      
      if (!db) {
        throw new Error("Base de datos no disponible");
      }

      // Verificar que el usuario sea vendedor
      if (ctx.user.role !== "vendedor") {
        throw new Error("Solo los vendedores pueden acceder a esta función");
      }

      console.log("[getOrders] Usuario vendedor:", {
        id: ctx.user.id,
        username: ctx.user.username,
        agentNumber: ctx.user.agentNumber
      });

      const limit = input?.limit || 100;

      // Obtener pedidos del vendedor (userId = vendedor)
      const vendorOrders = await db
        .select({
          id: orders.id,
          userId: orders.userId,
          clientId: orders.clientId,
          orderNumber: orders.orderNumber,
          status: orders.status,
          subtotal: orders.subtotal,
          tax: orders.tax,
          total: orders.total,
          notes: orders.notes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })
        .from(orders)
        .where(eq(orders.userId, ctx.user.id))
        .orderBy(desc(orders.createdAt))
        .limit(limit);

      // Obtener los items de cada pedido
      const ordersWithItems = await Promise.all(
        vendorOrders.map(async (order) => {
          const items = await db
            .select()
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id));

          return {
            ...order,
            items,
          };
        })
      );

      console.log("[getOrders] Pedidos encontrados:", ordersWithItems.length);

      return {
        success: true,
        orders: ordersWithItems,
      };
    }),

  /**
   * Actualiza datos de un cliente (sincronización bidireccional)
   */
  updateClient: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        updates: z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          companyName: z.string().optional(),
          companyTaxId: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          gpsLocation: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
          country: z.string().optional(),
          contactPerson: z.string().optional(),
          priceType: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      
      if (!db) {
        throw new Error("Base de datos no disponible");
      }

      // Verificar que el usuario sea vendedor
      if (ctx.user.role !== "vendedor") {
        throw new Error("Solo los vendedores pueden actualizar clientes");
      }

      console.log("[updateClient] Actualizando cliente:", {
        vendorId: ctx.user.id,
        clientId: input.clientId,
        updates: input.updates
      });

      // Verificar que el cliente pertenece al vendedor
      const client = await db
        .select()
        .from(users)
        .where(eq(users.id, input.clientId))
        .limit(1);

      if (client.length === 0) {
        throw new Error("Cliente no encontrado");
      }

      if (client[0].agentNumber !== ctx.user.agentNumber) {
        throw new Error("No tienes permiso para actualizar este cliente");
      }

      // Actualizar cliente
      await db
        .update(users)
        .set({
          ...input.updates,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.clientId));

      console.log("[updateClient] Cliente actualizado exitosamente");

      return {
        success: true,
        message: "Cliente actualizado correctamente",
      };
    }),
});
