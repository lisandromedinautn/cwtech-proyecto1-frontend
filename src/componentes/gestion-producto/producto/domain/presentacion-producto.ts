import type { PresentacionProducto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";

// Presentación del producto (CR-002): envase + valor + unidad.
// Acá solo vive la forma del contrato con el backend. Las reglas del contenido
// (mayor a 0, decimales por unidad, máximos) las valida el dominio del backend
// y la UI muestra su mensaje: no se duplican en React.

// Unidades que acepta el backend (PresentacionDto.unidad).
export const UNIDADES_PRESENTACION = [
  { valor: "ml", etiqueta: "ml (mililitros)" },
  { valor: "L", etiqueta: "L (litros)" },
  { valor: "g", etiqueta: "g (gramos)" },
  { valor: "kg", etiqueta: "kg (kilos)" },
  { valor: "unidades", etiqueta: "unidades" },
] as const;

export interface PresentacionFormValues {
  envaseId?: number | null;
  cantidad?: number | null;
  unidad?: string | null;
}

export interface PresentacionPayload {
  envaseId: number;
  cantidad: number;
  unidad: string;
}

export const presentacionVacia = (presentacion?: PresentacionFormValues | null): boolean =>
  !presentacion ||
  (presentacion.envaseId == null && presentacion.cantidad == null && !presentacion.unidad);

export const presentacionDesdeProducto = (
  presentacion?: PresentacionProducto | null,
): PresentacionFormValues =>
  presentacion
    ? {
        envaseId: presentacion.envase.id,
        cantidad: presentacion.contenido.cantidad,
        unidad: presentacion.contenido.unidad,
      }
    : { envaseId: null, cantidad: null, unidad: null };

// Nunca se envía null: el backend lo rechaza si el producto ya tiene
// presentación. Sin datos, la presentación no viaja (el esquema del formulario
// garantiza que en el alta y en productos con presentación esté completa).
export const presentacionParaPayload = (
  presentacion?: PresentacionFormValues | null,
): PresentacionPayload | undefined => {
  if (presentacionVacia(presentacion)) return undefined;
  return {
    envaseId: Number(presentacion!.envaseId),
    cantidad: Number(presentacion!.cantidad),
    unidad: String(presentacion!.unidad),
  };
};

export const textoPresentacion = (presentacion?: PresentacionProducto | null): string =>
  presentacion?.texto ?? "—";
