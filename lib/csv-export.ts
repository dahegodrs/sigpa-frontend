/**
 * Genera y descarga un archivo CSV en el navegador a partir de datos ya
 * cargados en el frontend. No requiere backend — es un export liviano,
 * distinto de la exportación PDF/Excel con formato (esa sí es Fase 4).
 */
export function exportarCSV(nombreArchivo: string, encabezados: string[], filas: (string | number | null | undefined)[][]) {
  const escapar = (valor: string | number | null | undefined) => {
    const texto = valor === null || valor === undefined ? '' : String(valor);
    if (texto.includes(',') || texto.includes('"') || texto.includes('\n')) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const lineas = [encabezados.map(escapar).join(','), ...filas.map((fila) => fila.map(escapar).join(','))];
  // BOM al inicio para que Excel abra bien los acentos en UTF-8
  const contenido = '\uFEFF' + lineas.join('\n');

  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
