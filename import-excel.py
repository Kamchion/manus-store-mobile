import openpyxl
import csv

wb = openpyxl.load_workbook('/home/ubuntu/upload/CopiadePEPPERIFINALRESULTADO.xlsx')
ws = wb.active

with open('/tmp/products.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for row in ws.iter_rows(values_only=True):
        writer.writerow(row)

print("✅ CSV creado en /tmp/products.csv")
