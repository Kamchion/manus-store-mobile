import { getProducts } from './server/db.ts';

const products = await getProducts();

// Buscar PINTURA SPRAY
const pinturaSpray = products.find(p => p.sku === 'AS001004');

if (pinturaSpray) {
  console.log('Producto PINTURA SPRAY (AS001004):');
  console.log('  SKU:', pinturaSpray.sku);
  console.log('  Name:', pinturaSpray.name);
  console.log('  basePrice:', pinturaSpray.basePrice);
  console.log('  priceCity:', pinturaSpray.priceCity);
  console.log('  priceInterior:', pinturaSpray.priceInterior);
  console.log('  priceSpecial:', pinturaSpray.priceSpecial);
} else {
  console.log('Producto AS001004 no encontrado en getProducts()');
}

process.exit(0);
