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

console.log('📊 Productos en la base de datos:\n');

const [products] = await connection.query('SELECT sku, parentSku, name FROM products ORDER BY id');

console.log(`Total: ${products.length} productos\n`);

// Agrupar por parentSku
const padres = products.filter(p => !p.parentSku);
const variantes = products.filter(p => p.parentSku);

console.log(`📁 ${padres.length} productos padre/independientes:`);
padres.slice(0, 5).forEach(p => console.log(`  - ${p.sku}: ${p.name}`));
if (padres.length > 5) console.log(`  ... y ${padres.length - 5} más\n`);

console.log(`\n🔗 ${variantes.length} variantes:`);
const variantesPorPadre = {};
variantes.forEach(v => {
  if (!variantesPorPadre[v.parentSku]) variantesPorPadre[v.parentSku] = [];
  variantesPorPadre[v.parentSku].push(v);
});

Object.entries(variantesPorPadre).forEach(([padre, vars]) => {
  console.log(`  ${padre}: ${vars.length} variantes`);
  vars.slice(0, 3).forEach(v => console.log(`    - ${v.sku}: ${v.name}`));
  if (vars.length > 3) console.log(`    ... y ${vars.length - 3} más`);
});

await connection.end();
