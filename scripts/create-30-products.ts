import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { products, productVariants, rolePricing } from "../drizzle/schema";
import { nanoid } from "nanoid";

const DATABASE_URL = process.env.DATABASE_URL || "mysql://root@localhost:3306/b2b_store";

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("🚀 Creando 30 productos con variantes...\n");

  // Categorías de productos
  const categories = [
    "Electrónica",
    "Ropa",
    "Calzado",
    "Accesorios",
    "Hogar",
    "Oficina",
    "Deportes",
    "Juguetes",
  ];

  // Productos base con sus variantes
  const productsData = [
    // Electrónica
    { name: "Auriculares Bluetooth", category: "Electrónica", basePrice: 45, variants: { type: "Color", values: ["Negro", "Blanco", "Azul", "Rojo"] } },
    { name: "Mouse Inalámbrico", category: "Electrónica", basePrice: 25, variants: { type: "Color", values: ["Negro", "Plateado", "Blanco"] } },
    { name: "Teclado Mecánico", category: "Electrónica", basePrice: 89, variants: { type: "Tipo", values: ["RGB", "Sin Luz", "Blanco"] } },
    { name: "Webcam HD", category: "Electrónica", basePrice: 55, variants: { type: "Resolución", values: ["720p", "1080p", "4K"] } },
    
    // Ropa
    { name: "Polo Empresarial", category: "Ropa", basePrice: 28, variants: { type: "Talla", values: ["S", "M", "L", "XL", "XXL"] } },
    { name: "Camisa Formal", category: "Ropa", basePrice: 42, variants: { type: "Talla", values: ["S", "M", "L", "XL", "XXL"] } },
    { name: "Pantalón de Vestir", category: "Ropa", basePrice: 55, variants: { type: "Talla", values: ["28", "30", "32", "34", "36", "38"] } },
    { name: "Chaqueta Corporativa", category: "Ropa", basePrice: 85, variants: { type: "Talla", values: ["S", "M", "L", "XL", "XXL"] } },
    { name: "Chaleco Reflectivo", category: "Ropa", basePrice: 18, variants: { type: "Talla", values: ["S", "M", "L", "XL"] } },
    
    // Calzado
    { name: "Zapatos de Seguridad", category: "Calzado", basePrice: 75, variants: { type: "Talla", values: ["38", "39", "40", "41", "42", "43", "44"] } },
    { name: "Zapatillas Deportivas", category: "Calzado", basePrice: 65, variants: { type: "Talla", values: ["38", "39", "40", "41", "42", "43", "44"] } },
    { name: "Botas Industriales", category: "Calzado", basePrice: 95, variants: { type: "Talla", values: ["39", "40", "41", "42", "43", "44", "45"] } },
    
    // Accesorios
    { name: "Gorra Bordada", category: "Accesorios", basePrice: 15, variants: { type: "Color", values: ["Negro", "Azul Marino", "Blanco", "Rojo", "Verde", "Gris"] } },
    { name: "Mochila Ejecutiva", category: "Accesorios", basePrice: 48, variants: { type: "Color", values: ["Negro", "Gris", "Azul", "Café"] } },
    { name: "Portafolio de Cuero", category: "Accesorios", basePrice: 125, variants: { type: "Color", values: ["Negro", "Café", "Marrón"] } },
    { name: "Llavero Personalizado", category: "Accesorios", basePrice: 8, variants: { type: "Material", values: ["Metal", "Plástico", "Cuero"] } },
    
    // Hogar
    { name: "Termo Térmico", category: "Hogar", basePrice: 22, variants: { type: "Capacidad", values: ["350ml", "500ml", "750ml", "1L"] } },
    { name: "Taza Personalizada", category: "Hogar", basePrice: 12, variants: { type: "Color", values: ["Blanco", "Negro", "Azul", "Rojo", "Verde"] } },
    { name: "Set de Cubiertos", category: "Hogar", basePrice: 35, variants: { type: "Piezas", values: ["12 piezas", "24 piezas", "36 piezas"] } },
    
    // Oficina
    { name: "Cuaderno Corporativo", category: "Oficina", basePrice: 15, variants: { type: "Tamaño", values: ["A4", "A5", "A6"] } },
    { name: "Bolígrafo Premium", category: "Oficina", basePrice: 8, variants: { type: "Color", values: ["Azul", "Negro", "Rojo"] } },
    { name: "Archivador de Palanca", category: "Oficina", basePrice: 18, variants: { type: "Color", values: ["Negro", "Azul", "Rojo", "Verde"] } },
    { name: "Carpeta Portadocumentos", category: "Oficina", basePrice: 25, variants: { type: "Material", values: ["Plástico", "Cartón", "Cuero"] } },
    { name: "Calculadora Científica", category: "Oficina", basePrice: 32, variants: { type: "Modelo", values: ["Básica", "Científica", "Financiera"] } },
    
    // Deportes
    { name: "Botella Deportiva", category: "Deportes", basePrice: 18, variants: { type: "Capacidad", values: ["500ml", "750ml", "1L"] } },
    { name: "Toalla de Gimnasio", category: "Deportes", basePrice: 22, variants: { type: "Tamaño", values: ["Pequeña", "Mediana", "Grande"] } },
    { name: "Banda Elástica", category: "Deportes", basePrice: 15, variants: { type: "Resistencia", values: ["Ligera", "Media", "Fuerte"] } },
    
    // Juguetes
    { name: "Peluche Corporativo", category: "Juguetes", basePrice: 28, variants: { type: "Tamaño", values: ["Pequeño", "Mediano", "Grande"] } },
    { name: "Set de Construcción", category: "Juguetes", basePrice: 45, variants: { type: "Piezas", values: ["50 piezas", "100 piezas", "200 piezas"] } },
    { name: "Rompecabezas Personalizado", category: "Juguetes", basePrice: 35, variants: { type: "Piezas", values: ["100 piezas", "500 piezas", "1000 piezas"] } },
  ];

  let productCount = 7; // Comenzar desde prod_008
  let variantCount = 0;

  for (const productData of productsData) {
    productCount++;
    const productId = `prod_${String(productCount).padStart(3, "0")}`;
    const sku = `${productData.name.substring(0, 3).toUpperCase()}-${String(productCount).padStart(3, "0")}`;

    // Crear producto base
    await db.insert(products).values({
      id: productId,
      sku: sku,
      name: productData.name,
      description: `${productData.name} de alta calidad para uso empresarial`,
      category: productData.category,
      basePrice: productData.basePrice,
      stock: 0, // El stock está en las variantes
      isActive: true,
      image: `https://placehold.co/400x400/3b82f6/ffffff?text=${encodeURIComponent(productData.name)}`,
    });

    console.log(`✅ ${productCount}. ${productData.name} (${productData.category})`);

    // Crear variantes
    for (const variantValue of productData.variants.values) {
      variantCount++;
      const variantSku = `${sku}-${variantValue.replace(/\s+/g, "-").toUpperCase()}`;
      const stock = Math.floor(Math.random() * 150) + 50; // Stock entre 50 y 200

      const variantId = `var_${productId}_${variantCount}`;
      await db.insert(productVariants).values({
        id: variantId,
        productId: productId,
        variantType: productData.variants.type,
        variantValue: variantValue,
        sku: variantSku,
        stock: stock,
      });

      console.log(`   - ${productData.variants.type}: ${variantValue} (${stock} unidades)`);
    }

    // Crear precios por rol
    await db.insert(rolePricing).values([
      {
        id: nanoid(),
        productId: productId,
        role: "user",
        price: productData.basePrice,
        minQuantity: 1,
      },
      {
        id: nanoid(),
        productId: productId,
        role: "distributor",
        price: Math.round(productData.basePrice * 0.75), // 25% descuento
        minQuantity: 5,
      },
      {
        id: nanoid(),
        productId: productId,
        role: "reseller",
        price: Math.round(productData.basePrice * 0.60), // 40% descuento
        minQuantity: 10,
      },
    ]);

    console.log("");
  }

  console.log(`\n✅ Creados ${productCount} productos con ${variantCount} variantes en total`);
  console.log(`✅ Todos los productos tienen precios diferenciados por rol`);

  await connection.end();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

