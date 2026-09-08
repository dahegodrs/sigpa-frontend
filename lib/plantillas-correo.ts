// ── Plantillas de correo — sistema de templates con variables ─────────────
// Las variables disponibles son: {{placa}}, {{tipo_documento}},
// {{fecha_vencimiento}}, {{dependencia}}, {{responsable}}, {{estado}}

export interface PlantillaCorreo {
  asunto: string;
  cuerpo: string;
}

export const VARIABLES_DISPONIBLES = [
  { clave: '{{placa}}', descripcion: 'Placa del vehículo' },
  { clave: '{{tipo_documento}}', descripcion: 'Tipo de documento (SOAT, Tecnomecánica...)' },
  { clave: '{{fecha_vencimiento}}', descripcion: 'Fecha de vencimiento del documento' },
  { clave: '{{dependencia}}', descripcion: 'Dependencia responsable del vehículo' },
  { clave: '{{responsable}}', descripcion: 'Funcionario responsable' },
  { clave: '{{estado}}', descripcion: 'Estado del documento (Vencido / Próximo a vencer)' },
];

const STORAGE_KEY = 'sigpa_plantilla_renovacion';

export const PLANTILLA_POR_DEFECTO: PlantillaCorreo = {
  asunto: 'Solicitud de renovación: {{tipo_documento}} — Vehículo {{placa}}',
  cuerpo: `Cordial saludo,

Por medio del presente correo, desde el área de Patio y Parque Automotor de la Alcaldía de Funza se hace el recordatorio formal de que el documento {{tipo_documento}} del vehículo con placa {{placa}}, asignado a {{dependencia}} y bajo la responsabilidad de {{responsable}}, se encuentra {{estado}} con fecha de vencimiento el {{fecha_vencimiento}}.

Se solicita gestionar con carácter urgente la renovación de este documento para garantizar la legalidad y correcta operación del vehículo.

Por favor confirmar la recepción de este mensaje y las acciones a tomar.

Atentamente,

Patio y Parque Automotor
Alcaldía de Funza — Cundinamarca
Patio@funza-cundinamarca.gov.co`,
};

/** Carga la plantilla guardada (o la por defecto si no hay ninguna). */
export function cargarPlantilla(): PlantillaCorreo {
  if (typeof window === 'undefined') return PLANTILLA_POR_DEFECTO;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return PLANTILLA_POR_DEFECTO;
    return JSON.parse(raw) as PlantillaCorreo;
  } catch {
    return PLANTILLA_POR_DEFECTO;
  }
}

/** Guarda la plantilla en localStorage. */
export function guardarPlantilla(plantilla: PlantillaCorreo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plantilla));
}

/** Resetea la plantilla a los valores por defecto. */
export function resetearPlantilla(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Reemplaza las variables de la plantilla con valores reales. */
export function aplicarVariables(
  texto: string,
  vars: {
    placa: string;
    tipo_documento: string;
    fecha_vencimiento: string;
    dependencia: string;
    responsable: string;
    estado: string;
  }
): string {
  return texto
    .replaceAll('{{placa}}', vars.placa)
    .replaceAll('{{tipo_documento}}', vars.tipo_documento)
    .replaceAll('{{fecha_vencimiento}}', vars.fecha_vencimiento)
    .replaceAll('{{dependencia}}', vars.dependencia)
    .replaceAll('{{responsable}}', vars.responsable)
    .replaceAll('{{estado}}', vars.estado);
}
