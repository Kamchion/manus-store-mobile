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

const tables = ['products', 'cartItems'];

for (const table of tables) {
  console.log(`\n📋 Columnas de ${table}:`);
  try {
    const [rows] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
    rows.forEach(row => console.log(`  - ${row.Field}`));
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }
}

await connection.end();
