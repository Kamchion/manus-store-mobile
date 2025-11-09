const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateProductImages() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  // Obtener lista de archivos de imágenes
  const imagesDir = '/home/ubuntu/tienda-b2b-nueva/public/uploads/products';
  const imageFiles = fs.readdirSync(imagesDir);
  
  console.log(`Encontradas ${imageFiles.length} imágenes`);
  
  let updated = 0;
  
  for (const imageFile of imageFiles) {
    // Extraer el SKU del nombre del archivo (sin extensión)
    const sku = path.basename(imageFile, path.extname(imageFile));
    
    // Actualizar el producto con este SKU
    const imagePath = `/uploads/products/${imageFile}`;
    const [result] = await conn.execute(
      'UPDATE products SET image = ? WHERE sku = ?',
      [imagePath, sku]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✓ Actualizado ${sku} -> ${imagePath}`);
      updated++;
    } else {
      console.log(`✗ No se encontró producto con SKU: ${sku}`);
    }
  }
  
  console.log(`\n${updated} productos actualizados con imágenes`);
  
  await conn.end();
}

updateProductImages().catch(console.error);
