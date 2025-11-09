import { drizzle } from "drizzle-orm/mysql2";
import {
  products,
  rolePricing,
  minimumQuantities,
} from "../drizzle/schema";

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("🌱 Starting seed...");

  // Sample products
  const sampleProducts = [
    {
      id: "prod_001",
      sku: "WIDGET-100",
      name: "Widget Premium",
      description: "Widget de alta calidad para uso industrial",
      category: "Widgets",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
      basePrice: "50.00",
      stock: 1000,
      isActive: true,
    },
    {
      id: "prod_002",
      sku: "GADGET-200",
      name: "Gadget Profesional",
      description: "Gadget profesional con características avanzadas",
      category: "Gadgets",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
      basePrice: "120.00",
      stock: 500,
      isActive: true,
    },
    {
      id: "prod_003",
      sku: "TOOL-300",
      name: "Herramienta Especializada",
      description: "Herramienta especializada para profesionales",
      category: "Herramientas",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop",
      basePrice: "75.00",
      stock: 750,
      isActive: true,
    },
    {
      id: "prod_004",
      sku: "SUPPLY-400",
      name: "Suministro Industrial",
      description: "Suministro industrial de consumo regular",
      category: "Suministros",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=400&fit=crop",
      basePrice: "25.00",
      stock: 2000,
      isActive: true,
    },
    {
      id: "prod_005",
      sku: "EQUIP-500",
      name: "Equipo Comercial",
      description: "Equipo comercial de última generación",
      category: "Equipos",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop",
      basePrice: "300.00",
      stock: 100,
      isActive: true,
    },
    {
      id: "prod_006",
      sku: "COMP-600",
      name: "Componente Técnico",
      description: "Componente técnico de precisión",
      category: "Componentes",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
      basePrice: "85.00",
      stock: 600,
      isActive: true,
    },
  ];

  // Insert products
  for (const product of sampleProducts) {
    await db.insert(products).values(product);
    console.log(`✓ Producto creado: ${product.name}`);
  }

  // Role-based pricing
  const pricingData = [
    // Widget Premium pricing
    { productId: "prod_001", role: "user", price: "50.00" },
    { productId: "prod_001", role: "distributor", price: "35.00" },
    { productId: "prod_001", role: "reseller", price: "25.00" },
    // Gadget Profesional pricing
    { productId: "prod_002", role: "user", price: "120.00" },
    { productId: "prod_002", role: "distributor", price: "85.00" },
    { productId: "prod_002", role: "reseller", price: "60.00" },
    // Herramienta Especializada pricing
    { productId: "prod_003", role: "user", price: "75.00" },
    { productId: "prod_003", role: "distributor", price: "55.00" },
    { productId: "prod_003", role: "reseller", price: "40.00" },
    // Suministro Industrial pricing
    { productId: "prod_004", role: "user", price: "25.00" },
    { productId: "prod_004", role: "distributor", price: "18.00" },
    { productId: "prod_004", role: "reseller", price: "12.00" },
    // Equipo Comercial pricing
    { productId: "prod_005", role: "user", price: "300.00" },
    { productId: "prod_005", role: "distributor", price: "210.00" },
    { productId: "prod_005", role: "reseller", price: "150.00" },
    // Componente Técnico pricing
    { productId: "prod_006", role: "user", price: "85.00" },
    { productId: "prod_006", role: "distributor", price: "60.00" },
    { productId: "prod_006", role: "reseller", price: "42.00" },
  ];

  for (const pricing of pricingData) {
    await db.insert(rolePricing).values({
      id: `pricing_${pricing.productId}_${pricing.role}`,
      productId: pricing.productId,
      role: pricing.role as any,
      price: pricing.price,
      minQuantity: 1,
    });
  }
  console.log(`✓ ${pricingData.length} precios por rol creados`);

  // Minimum quantities
  const minQtyData = [
    // Widget Premium
    { productId: "prod_001", role: "user", minQty: 1 },
    { productId: "prod_001", role: "distributor", minQty: 10 },
    { productId: "prod_001", role: "reseller", minQty: 50 },
    // Gadget Profesional
    { productId: "prod_002", role: "user", minQty: 1 },
    { productId: "prod_002", role: "distributor", minQty: 5 },
    { productId: "prod_002", role: "reseller", minQty: 20 },
    // Herramienta Especializada
    { productId: "prod_003", role: "user", minQty: 1 },
    { productId: "prod_003", role: "distributor", minQty: 8 },
    { productId: "prod_003", role: "reseller", minQty: 30 },
    // Suministro Industrial
    { productId: "prod_004", role: "user", minQty: 1 },
    { productId: "prod_004", role: "distributor", minQty: 20 },
    { productId: "prod_004", role: "reseller", minQty: 100 },
    // Equipo Comercial
    { productId: "prod_005", role: "user", minQty: 1 },
    { productId: "prod_005", role: "distributor", minQty: 2 },
    { productId: "prod_005", role: "reseller", minQty: 5 },
    // Componente Técnico
    { productId: "prod_006", role: "user", minQty: 1 },
    { productId: "prod_006", role: "distributor", minQty: 15 },
    { productId: "prod_006", role: "reseller", minQty: 60 },
  ];

  for (const minQty of minQtyData) {
    await db.insert(minimumQuantities).values({
      id: `minqty_${minQty.productId}_${minQty.role}`,
      productId: minQty.productId,
      role: minQty.role as any,
      minQty: minQty.minQty,
    });
  }
  console.log(`✓ ${minQtyData.length} cantidades mínimas creadas`);

  console.log("✅ Seed completado exitosamente!");
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});

