import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genera y descarga un PDF a partir de un elemento HTML existente en el DOM,
 * en vez de abrir el diálogo de impresión del navegador (window.print()).
 *
 * Se usa html2canvas para "fotografiar" el elemento (respetando estilos CSS
 * reales, incluyendo el logo institucional) y jsPDF para insertar esa imagen
 * en un documento PDF con orientación horizontal (A4 landscape), ideal para
 * planillas anchas como la Programación Diaria de Vehículos (15-FR-36).
 */
export async function generarPDFDesdeElemento(elementoId: string, nombreArchivo: string): Promise<void> {
  const elemento = document.getElementById(elementoId);
  if (!elemento) {
    throw new Error(`No se encontró el elemento con id "${elementoId}" para generar el PDF`);
  }

  // Se hace visible temporalmente (la vista de impresión suele estar oculta
  // con display:none en pantalla) para que html2canvas pueda capturarla.
  // También se fuerza position:fixed/left:0 y un z-index alto para que el
  // elemento no quede recortado por el layout del resto de la página
  // mientras se toma la "foto" — sin esto, html2canvas puede capturar solo
  // la porción visible en el viewport y cortar columnas de la tabla.
  const estiloOriginal = {
    display: elemento.style.display,
    position: elemento.style.position,
    left: elemento.style.left,
    top: elemento.style.top,
    zIndex: elemento.style.zIndex,
    width: elemento.style.width,
  };
  elemento.style.display = 'block';
  elemento.style.position = 'fixed';
  elemento.style.left = '0';
  elemento.style.top = '0';
  elemento.style.zIndex = '-1'; // detrás de todo, invisible para el usuario, pero renderizado
  elemento.style.width = 'max-content';

  try {
    // scrollWidth/scrollHeight reales del elemento — necesarios para que
    // html2canvas capture la tabla completa (incluyendo columnas que se
    // extienden más allá del viewport visible) en vez de recortarla.
    const anchoReal = elemento.scrollWidth;
    const altoReal = elemento.scrollHeight;

    const canvas = await html2canvas(elemento, {
      scale: 2, // mayor resolución para que el texto se vea nítido en el PDF
      useCORS: true,
      backgroundColor: '#ffffff',
      width: anchoReal,
      height: altoReal,
      windowWidth: anchoReal,
      windowHeight: altoReal,
    });

    const imgData = canvas.toDataURL('image/png');

    // A4 horizontal en milímetros: 297 x 210
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const anchoPagina = pdf.internal.pageSize.getWidth();
    const altoPagina = pdf.internal.pageSize.getHeight();

    // Escala la imagen capturada para que quepa dentro de la página,
    // manteniendo la proporción original (evita que el logo o el texto se
    // vean estirados o deformados).
    const relacionImagen = canvas.height / canvas.width;
    let anchoFinal = anchoPagina - 10; // márgenes de 5mm por lado
    let altoFinal = anchoFinal * relacionImagen;
    if (altoFinal > altoPagina - 10) {
      altoFinal = altoPagina - 10;
      anchoFinal = altoFinal / relacionImagen;
    }
    const x = (anchoPagina - anchoFinal) / 2;
    const y = (altoPagina - altoFinal) / 2;

    pdf.addImage(imgData, 'PNG', x, y, anchoFinal, altoFinal);
    pdf.save(nombreArchivo);
  } finally {
    elemento.style.display = estiloOriginal.display;
    elemento.style.position = estiloOriginal.position;
    elemento.style.left = estiloOriginal.left;
    elemento.style.top = estiloOriginal.top;
    elemento.style.zIndex = estiloOriginal.zIndex;
    elemento.style.width = estiloOriginal.width;
  }
}
