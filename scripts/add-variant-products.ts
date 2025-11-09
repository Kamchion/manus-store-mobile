import { drizzle } from "drizzle-orm/mysql2";
import { products, productVariants, rolePricing } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function addVariantProducts() {
  console.log("🌱 Agregando productos con variantes...");

  try {
    // Producto 1: Camiseta con variantes de Talla
    const shirtId = `prod_${Date.now()}_shirt`;
    await db.insert(products).values({
      id: shirtId,
      sku: "SHIRT-001",
      name: "Camiseta Básica",
      description: "Camiseta de algodón 100% disponible en múltiples tallas",
      category: "Ropa",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
      basePrice: "25.00",
      stock: 0, // Stock en 0 porque está en las variantes
      isActive: true,
    });

    // Variantes de talla para la camiseta
    const shirtSizes = [
      { value: "S", stock: 50 },
      { value: "M", stock: 100 },
      { value: "L", stock: 75 },
      { value: "XL", stock: 30 },
      { value: "XXL", stock: 15 },
    ];

    for (const size of shirtSizes) {
      const variantId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(productVariants).values({
        id: variantId,
        productId: shirtId,
        variantType: "Talla",
        variantValue: size.value,
        sku: `SHIRT-001-${size.value}`,
        stock: size.stock,
        isActive: true,
      });
    }

    // Precios por rol para la camiseta
    await db.insert(rolePricing).values([
      {
        id: `price_${Date.now()}_1`,
        productId: shirtId,
        role: "user",
        price: "25.00",
        minQuantity: 1,
      },
      {
        id: `price_${Date.now()}_2`,
        productId: shirtId,
        role: "distributor",
        price: "18.00",
        minQuantity: 10,
      },
      {
        id: `price_${Date.now()}_3`,
        productId: shirtId,
        role: "reseller",
        price: "12.50",
        minQuantity: 50,
      },
    ]);

    console.log("✅ Camiseta con variantes de talla agregada");

    // Producto 2: Zapatos con variantes de Talla
    const shoesId = `prod_${Date.now()}_shoes`;
    await db.insert(products).values({
      id: shoesId,
      sku: "SHOES-001",
      name: "Zapatos Deportivos",
      description: "Zapatos deportivos de alta calidad disponibles en varias tallas",
      category: "Calzado",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500",
      basePrice: "80.00",
      stock: 0,
      isActive: true,
    });

    // Variantes de talla para zapatos
    const shoesSizes = [
      { value: "38", stock: 20 },
      { value: "39", stock: 35 },
      { value: "40", stock: 45 },
      { value: "41", stock: 40 },
      { value: "42", stock: 30 },
      { value: "43", stock: 25 },
      { value: "44", stock: 15 },
    ];

    for (const size of shoesSizes) {
      const variantId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(productVariants).values({
        id: variantId,
        productId: shoesId,
        variantType: "Talla",
        variantValue: size.value,
        sku: `SHOES-001-${size.value}`,
        stock: size.stock,
        isActive: true,
      });
    }

    // Precios por rol para zapatos
    await db.insert(rolePricing).values([
      {
        id: `price_${Date.now()}_4`,
        productId: shoesId,
        role: "user",
        price: "80.00",
        minQuantity: 1,
      },
      {
        id: `price_${Date.now()}_5`,
        productId: shoesId,
        role: "distributor",
        price: "60.00",
        minQuantity: 5,
      },
      {
        id: `price_${Date.now()}_6`,
        productId: shoesId,
        role: "reseller",
        price: "45.00",
        minQuantity: 20,
      },
    ]);

    console.log("✅ Zapatos con variantes de talla agregados");

    // Producto 3: Gorra con variantes de Color
    const capId = `prod_${Date.now()}_cap`;
    await db.insert(products).values({
      id: capId,
      sku: "CAP-001",
      name: "Gorra Clásica",
      description: "Gorra ajustable disponible en múltiples colores",
      category: "Accesorios",
      image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500",
      basePrice: "15.00",
      stock: 0,
      isActive: true,
    });

    // Variantes de color para la gorra
    const capColors = [
      { value: "Negro", stock: 80 },
      { value: "Blanco", stock: 70 },
      { value: "Rojo", stock: 50 },
      { value: "Azul", stock: 60 },
      { value: "Verde", stock: 40 },
      { value: "Gris", stock: 55 },
    ];

    for (const color of capColors) {
      const variantId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(productVariants).values({
        id: variantId,
        productId: capId,
        variantType: "Color",
        variantValue: color.value,
        sku: `CAP-001-${color.value.toUpperCase()}`,
        stock: color.stock,
        isActive: true,
      });
    }

    // Precios por rol para gorra
    await db.insert(rolePricing).values([
      {
        id: `price_${Date.now()}_7`,
        productId: capId,
        role: "user",
        price: "15.00",
        minQuantity: 1,
      },
      {
        id: `price_${Date.now()}_8`,
        productId: capId,
        role: "distributor",
        price: "10.00",
        minQuantity: 20,
      },
      {
        id: `price_${Date.now()}_9`,
        productId: capId,
        role: "reseller",
        price: "7.50",
        minQuantity: 100,
      },
    ]);

    console.log("✅ Gorra con variantes de color agregada");

    // Producto 4: Mochila con variantes de Color
    const backpackId = `prod_${Date.now()}_backpack`;
    await db.insert(products).values({
      id: backpackId,
      sku: "BACKPACK-001",
      name: "Mochila Escolar",
      description: "Mochila resistente con múltiples compartimentos",
      category: "Accesorios",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
      basePrice: "45.00",
      stock: 0,
      isActive: true,
    });

    // Variantes de color para mochila
    const backpackColors = [
      { value: "Negro", stock: 60 },
      { value: "Azul Marino", stock: 50 },
      { value: "Rojo", stock: 35 },
      { value: "Verde Militar", stock: 40 },
      { value: "Gris", stock: 45 },
    ];

    for (const color of backpackColors) {
      const variantId = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.insert(productVariants).values({
        id: variantId,
        productId: backpackId,
        variantType: "Color",
        variantValue: color.value,
        sku: `BACKPACK-001-${color.value.replace(/\s+/g, "-").toUpperCase()}`,
        stock: color.stock,
        isActive: true,
      });
    }

    // Precios por rol para mochila
    await db.insert(rolePricing).values([
      {
        id: `price_${Date.now()}_10`,
        productId: backpackId,
        role: "user",
        price: "45.00",
        minQuantity: 1,
      },
      {
        id: `price_${Date.now()}_11`,
        productId: backpackId,
        role: "distributor",
        price: "32.00",
        minQuantity: 10,
      },
      {
        id: `price_${Date.now()}_12`,
        productId: backpackId,
        role: "reseller",
        price: "22.50",
        minQuantity: 50,
      },
    ]);

    console.log("✅ Mochila con variantes de color agregada");

    console.log("\n🎉 ¡Productos con variantes agregados exitosamente!");
    console.log("\nResumen:");
    console.log("- Camiseta Básica: 5 tallas (S, M, L, XL, XXL)");
    console.log("- Zapatos Deportivos: 7 tallas (38-44)");
    console.log("- Gorra Clásica: 6 colores");
    console.log("- Mochila Escolar: 5 colores");
    console.log("\nTotal: 4 productos con 23 variantes");
  } catch (error) {
    console.error("❌ Error al agregar productos con variantes:", error);
    throw error;
  }
}

addVariantProducts()
  .then(() => {
    console.log("\n✅ Script completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });

