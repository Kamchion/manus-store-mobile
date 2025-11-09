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
const [rows] = await connection.query('SHOW COLUMNS FROM orderItems');
console.log('📋 Columnas de orderItems:');
rows.forEach(row => console.log(`  - ${row.Field}`));
await connection.end();
