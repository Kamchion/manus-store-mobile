import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

// Parse DATABASE_URL
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true }
};

console.log('Connecting to database...');
const connection = await createConnection(config);

console.log('Reading SQL dump...');
const sql = readFileSync('./database_backup.sql', 'utf8');

// Split by statements and execute
const statements = sql
  .split(/;\s*\n/)
  .filter(s => s.trim() && !s.trim().startsWith('--') && !s.trim().startsWith('/*'));

console.log(`Executing ${statements.length} statements...`);
let executed = 0;

for (const statement of statements) {
  try {
    await connection.query(statement);
    executed++;
    if (executed % 100 === 0) {
      console.log(`Executed ${executed}/${statements.length} statements...`);
    }
  } catch (err) {
    // Ignore some common errors
    if (!err.message.includes('already exists') && 
        !err.message.includes('Unknown table') &&
        !err.message.includes('Duplicate entry')) {
      console.warn(`Warning: ${err.message.substring(0, 100)}`);
    }
  }
}

console.log(`✅ Database restored: ${executed} statements executed`);
await connection.end();
