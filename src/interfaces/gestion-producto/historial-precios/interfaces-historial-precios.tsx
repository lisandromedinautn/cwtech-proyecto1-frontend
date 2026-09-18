// Contrato de GET /producto/:id/historial-precios (backend, CR-007).
export interface HistorialPrecio {
  id: number;
  productoId: number;
  precioAnterior: number;
  precioNuevo: number;
  motivo: string;
  fecha: string;
  usuarioId?: number | null;
}

export interface HistorialPreciosPaginado {
  data: HistorialPrecio[];
  total: number;
}
