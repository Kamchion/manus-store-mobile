import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
  multipleStatements: true
};

console.log('🔌 Connecting to database...');
const connection = await createConnection(config);

console.log('📖 Reading SQL dump...');
const sql = readFileSync('./database_backup.sql', 'utf8');

// Remove problematic lines
const cleanSql = sql
  .split('\n')
  .filter(line => 
    !line.startsWith('mysqldump:') &&
    !line.startsWith('--') &&
    !line.includes('LOCK TABLES') &&
    !line.includes('UNLOCK TABLES')
  )
  .join('\n');

console.log('🗑️  Dropping existing tables...');
const tables = ['auditLogs', 'cartItems', 'orderItems', 'orders', 'pricingByType', 
                'productVariants', 'products', 'promotions', 'systemConfig', 'users'];

for (const table of tables) {
  try {
    await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    console.log(`  ✓ Dropped ${table}`);
  } catch (err) {
    console.log(`  ⚠ Could not drop ${table}: ${err.message.substring(0, 50)}`);
  }
}

console.log('\n📥 Restoring database from dump...');
try {
  await connection.query(cleanSql);
  console.log('✅ Database restored successfully!');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}

await connection.end();
console.log('✅ Done!');
