import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [products] = await connection.execute(
  'SELECT sku, name, image FROM products WHERE isActive = 1 LIMIT 5'
);

console.log('Productos de ejemplo:');
products.forEach(p => {
  console.log(`SKU: ${p.sku}, Nombre: ${p.name}`);
  console.log(`Imagen: ${p.image}`);
  console.log('---');
});

await connection.end();
