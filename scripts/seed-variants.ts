import { drizzle } from "drizzle-orm/mysql2";
import { productVariants } from "../drizzle/schema";

async function seedVariants() {
  const db = drizzle(process.env.DATABASE_URL!);

  console.log("🌱 Seeding product variants...");

  // Add size variants to Widget Premium (prod_001)
  const widgetVariants = [
    { productId: "prod_001", variantType: "Size", variantValue: "Small", sku: "WIDGET-100-S" },
    { productId: "prod_001", variantType: "Size", variantValue: "Medium", sku: "WIDGET-100-M" },
    { productId: "prod_001", variantType: "Size", variantValue: "Large", sku: "WIDGET-100-L" },
    { productId: "prod_001", variantType: "Color", variantValue: "Black", sku: "WIDGET-100-BK" },
    { productId: "prod_001", variantType: "Color", variantValue: "White", sku: "WIDGET-100-WH" },
  ];

  // Add color variants to Gadget Profesional (prod_002)
  const gadgetVariants = [
    { productId: "prod_002", variantType: "Color", variantValue: "Silver", sku: "GADGET-200-SV" },
    { productId: "prod_002", variantType: "Color", variantValue: "Black", sku: "GADGET-200-BK" },
    { productId: "prod_002", variantType: "Color", variantValue: "Gold", sku: "GADGET-200-GD" },
  ];

  // Add material variants to Herramienta Especializada (prod_003)
  const toolVariants = [
    { productId: "prod_003", variantType: "Material", variantValue: "Steel", sku: "TOOL-300-ST" },
    { productId: "prod_003", variantType: "Material", variantValue: "Aluminum", sku: "TOOL-300-AL" },
  ];

  const allVariants = [...widgetVariants, ...gadgetVariants, ...toolVariants];

  for (const variant of allVariants) {
    await db.insert(productVariants).values({
      id: `variant_${variant.productId}_${variant.variantType}_${variant.variantValue}`,
      productId: variant.productId,
      variantType: variant.variantType,
      variantValue: variant.variantValue,
      sku: variant.sku,
      stock: 500,
      isActive: true,
    });
    console.log(`✓ Added ${variant.variantType}: ${variant.variantValue} to ${variant.productId}`);
  }

  console.log("✅ Variants seeded successfully!");
}

seedVariants().catch((err) => {
  console.error("❌ Error seeding variants:", err);
  process.exit(1);
});
