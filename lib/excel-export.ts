import * as XLSX from 'xlsx';

export type CeldaExcel = string | number | boolean | Date | null | undefined;

function autoajustarAnchos(encabezados: string[], filas: CeldaExcel[][]) {
  const maximos = encabezados.map((h) => (h?.length || 10));
  for (const fila of filas) {
    fila.forEach((valor, i) => {
      const texto =
        valor === null || valor === undefined
          ? ''
          : valor instanceof Date
          ? valor.toLocaleDateString('es-CO')
          : String(valor);
      maximos[i] = Math.max(maximos[i] || 10, texto.length);
    });
  }
  return maximos.map((m) => ({ wch: Math.min(Math.max(m + 2, 10), 60) }));
}

export function exportarExcel(
  nombreArchivo: string,
  nombreHoja: string,
  encabezados: string[],
  filas: CeldaExcel[][]
) {
  const datos = [encabezados, ...filas];
  const hoja = XLSX.utils.aoa_to_sheet(datos);

  hoja['!cols'] = autoajustarAnchos(encabezados, filas);

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja);

  const finalName = nombreArchivo.endsWith('.xlsx') ? nombreArchivo : `${nombreArchivo}.xlsx`;
  XLSX.writeFile(libro, finalName);
}
