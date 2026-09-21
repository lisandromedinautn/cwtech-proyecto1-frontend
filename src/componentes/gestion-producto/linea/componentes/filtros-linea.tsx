import type { FiltrosSimpleValues } from "../../../herramientas/reutilizables/filtros-simple";

export { FiltrosSimple as FiltrosLinea } from "../../../herramientas/reutilizables/filtros-simple";

export type FiltrosLineaValues = FiltrosSimpleValues & {
  superlineaId?: number;
};