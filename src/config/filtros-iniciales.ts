// config/filtros-iniciales.ts

export const FILTROS_INICIALES = {
  "consultar-producto": {
    codProveedorExacto: true,
    orden: 0,
  },
 
} as const;

export type TipoModuloFiltro = keyof typeof FILTROS_INICIALES;

export const getFiltrosInicialesPorModulo = (
  modulo?: TipoModuloFiltro,
) => {
  if (!modulo) return undefined;
  return FILTROS_INICIALES[modulo];
};