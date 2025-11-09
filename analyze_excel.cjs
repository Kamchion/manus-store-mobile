const XLSX = require('xlsx');
const workbook = XLSX.readFile('/home/ubuntu/upload/PEPPERIFINALRESULTADO-1.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

// Buscar productos padre (donde codigoModelo aparece en múltiples filas)
const codigoModeloMap = new Map();
for (let i = 1; i < Math.min(50, data.length); i++) {
  const row = data[i];
  const codigoModelo = row[3]; // Column D
  const codigoArticulo = row[4]; // Column E
  const descripcion = row[5]; // Column F
  const ocultarCatalogo = row[13]; // Column N
  
  if (codigoModelo) {
    if (!codigoModeloMap.has(codigoModelo)) {
      codigoModeloMap.set(codigoModelo, []);
    }
    codigoModeloMap.get(codigoModelo).push({
      sku: codigoArticulo,
      descripcion: descripcion,
      ocultar: ocultarCatalogo,
      isParent: codigoModelo === codigoArticulo
    });
  }
}

console.log('Productos con variantes (primeras 50 filas):');
let count = 0;
for (const [modelo, items] of codigoModeloMap.entries()) {
  if (items.length > 1 && count < 3) {
    console.log(`\nModelo: ${modelo}`);
    items.forEach(item => {
      console.log(`  SKU: ${item.sku}, Desc: ${item.descripcion?.substring(0, 30)}, Ocultar: ${item.ocultar}, EsPadre: ${item.isParent}`);
    });
    count++;
  }
}
