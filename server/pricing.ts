import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { pricingByType, users, products } from "../drizzle/schema";
import type { PriceType } from "./permissions";

/**
 * Obtiene el precio de un producto para un usuario específico
 * basado en su tipo de precio asignado
 */
export async function getPriceForUser(productId: string, userId: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  // Obtener el tipo de precio del usuario
  const user = await db
    .select({ priceType: users.priceType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user.length === 0 || !user[0].priceType) {
    // Si no tiene tipo de precio, usar precio base del producto
    const product = await db
      .select({ basePrice: products.basePrice })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    
    return product.length > 0 ? parseFloat(product[0].basePrice) : null;
  }

  const priceType = user[0].priceType as PriceType;

  // Buscar el precio específico para este tipo
  const pricing = await db
    .select()
    .from(pricingByType)
    .where(
      and(
        eq(pricingByType.productId, productId),
        eq(pricingByType.priceType, priceType)
      )
    )
    .limit(1);

  if (pricing.length > 0) {
    return parseFloat(pricing[0].price);
  }

  // Si no hay precio específico, usar precio base
  const product = await db
    .select({ basePrice: products.basePrice })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  
  return product.length > 0 ? parseFloat(product[0].basePrice) : null;
}

/**
 * Obtiene todos los precios de un producto (para todos los tipos)
 */
export async function getProductPricing(productId: string) {
  const db = await getDb();
  if (!db) return [];

  const pricing = await db
    .select()
    .from(pricingByType)
    .where(eq(pricingByType.productId, productId));

  return pricing;
}

/**
 * Establece el precio de un producto para un tipo específico
 */
export async function setProductPrice(
  productId: string,
  priceType: PriceType,
  price: string | number,
  minQuantity: number = 1
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const priceValue = typeof price === 'string' ? price : price.toString();

  // Verificar si ya existe
  const existing = await db
    .select()
    .from(pricingByType)
    .where(
      and(
        eq(pricingByType.productId, productId),
        eq(pricingByType.priceType, priceType)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Actualizar existente
    await db
      .update(pricingByType)
      .set({ price: priceValue, minQuantity })
      .where(
        and(
          eq(pricingByType.productId, productId),
          eq(pricingByType.priceType, priceType)
        )
      );
    return existing[0].id;
  } else {
    // Crear nuevo
    const id = `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(pricingByType).values({
      id,
      productId,
      priceType,
      price: priceValue,
      minQuantity,
    });
    return id;
  }
}

/**
 * Establece todos los precios de un producto
 */
export async function setAllProductPrices(
  productId: string,
  prices: {
    ciudad: number;
    interior: number;
    especial: number;
  }
): Promise<void> {
  await setProductPrice(productId, 'ciudad', prices.ciudad);
  await setProductPrice(productId, 'interior', prices.interior);
  await setProductPrice(productId, 'especial', prices.especial);
}

/**
 * Elimina todos los precios de un producto
 */
export async function deleteProductPricing(productId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(pricingByType).where(eq(pricingByType.productId, productId));
}

/**
 * Obtiene el tipo de precio de un usuario
 */
export async function getUserPriceType(userId: string): Promise<PriceType | null> {
  const db = await getDb();
  if (!db) return null;

  const user = await db
    .select({ priceType: users.priceType })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user.length > 0 ? (user[0].priceType as PriceType) : null;
}

