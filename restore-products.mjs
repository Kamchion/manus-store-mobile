import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const connection = await createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
});

console.log('🔄 Restaurando productos del backup...');

// Limpiar productos actuales
await connection.query('DELETE FROM products');

// Restaurar desde el backup SQL
const { readFileSync } = await import('fs');
const backupSql = readFileSync('/tmp/backup-restore/tienda-b2b/database_backup.sql', 'utf-8');

// Extraer solo los INSERT de products
const productInserts = backupSql.match(/INSERT INTO `products`[^;]+;/g) || [];

console.log(`📦 Encontrados ${productInserts.length} statements de productos`);

for (const insert of productInserts) {
  try {
    await connection.query(insert);
  } catch (err) {
    console.log(`⚠️  Error: ${err.message.substring(0, 60)}`);
  }
}

const [result] = await connection.query('SELECT COUNT(*) as count FROM products');
console.log(`✅ ${result[0].count} productos restaurados`);

await connection.end();
