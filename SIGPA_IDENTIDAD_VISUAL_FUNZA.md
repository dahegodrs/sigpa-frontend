# SIGPA - Guía de Implementación Frontend basada en el Manual de Identidad Visual de la Alcaldía de Funza

## Objetivo

Este documento resume los lineamientos obligatorios del Manual de Identidad Visual de la Alcaldía de Funza para garantizar que SIGPA respete la identidad institucional en todas sus interfaces digitales.

## Paleta Oficial

- Rojo Funza: #DA151C
- Blanco: #FFFFFF
- Negro: #000000
- Gris Claro: #E6E6E6
- Gris Medio: #CCCCCC
- Gris Oscuro: #999999
- Gris UI: #808080
- Gris Texto: #666666
- Gris Profundo: #333333

## Tipografía Oficial

Fuente: Outfit

Pesos:
- Thin
- ExtraLight
- Light
- Regular
- Medium
- SemiBold
- Bold
- ExtraBold
- Black

## Componentes de la Aplicación

- Login
- Dashboard Ejecutivo
- Gestión de Vehículos
- Detalle de Vehículo
- Gestión Documental
- Alertas
- Reportes
- Administración

## Reglas UX/UI

### Sidebar
- Fondo: #333333
- Hover: #DA151C

### Topbar
- Fondo: #FFFFFF

### Botones
- Primario: #DA151C
- Secundario: #E6E6E6

### Dashboard
- Tarjetas KPI.
- Gráficos Recharts.
- Timeline.
- Centro de alertas.

## Restricciones

- No alterar el escudo.
- No utilizar marcas de gobierno temporales.
- No cambiar la tipografía Outfit.
- No modificar el rojo institucional.

## Multi-Tenant

La primera implementación será para la Alcaldía de Funza, pero SIGPA permitirá configurar:

- organization_id
- logo
- colores
- dominio
- correos institucionales

## Theme Material UI

```ts
primary: "#DA151C"
secondary: "#333333"
background: "#FFFFFF"
```

## Conclusión

SIGPA debe percibirse como una plataforma oficial de la Alcaldía de Funza, manteniendo la posibilidad de ser reutilizada por otras entidades mediante un sistema configurable de temas.
