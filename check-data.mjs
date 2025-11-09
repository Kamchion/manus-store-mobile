import { createConnection } from 'mysql2/promise';

const dbUrl = process.env.DATABASE_URL;
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
};

const connection = await createConnection(config);

const tables = ['products', 'productVariants', 'users', 'orders', 'cartItems'];

console.log('📊 Registros en cada tabla:\n');
for (const table of tables) {
  try {
    const [rows] = await connection.query(`SELECT COUNT(*) as total FROM \`${table}\``);
    console.log(`  ${table}: ${rows[0].total} registros`);
  } catch (err) {
    console.log(`  ${table}: ❌ Error - ${err.message}`);
  }
}

await connection.end();
