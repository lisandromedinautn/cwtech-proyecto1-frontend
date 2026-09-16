import { useState } from "react";
import CambioPreciosMasivoService from "../cambio-precios-masivo-service";
import ProductoService from "../../../producto/services/producto-service";
import { ConsultarProductosCambioPreciosMasivo } from "../../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { ResponsePost } from "../../../../../interfaces/generales/interfaces-generales";

export interface PreviewItem {
  productoId: number;
  denominacion?: string;
  precioActual: number;
  precioNuevo: number | null;
  valido: boolean;
}

export interface PreviewResultado {
  items: PreviewItem[];
  cantidadTotal: number;
  cantidadInvalidos: number;
}

export interface CambioPreciosMasivoDto {
  tipo: number; // TipoAumento: PORCENTAJE = 1, MONTO_FIJO = 2
  valor: number; // con signo: positivo = aumento, negativo = decremento
  alcance: "LINEA" | "GLOBAL";
  lineaId?: number; // obligatorio solo si alcance === "LINEA"
}

export function useCambioPrecios(usuarioId: number | null) {
  const [productos, setProductos] =
    useState<ConsultarProductosCambioPreciosMasivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [entidadesTotales, setEntidadesTotales] = useState(0);
  const [preview, setPreview] = useState<Map<number, PreviewItem>>(new Map());

  const buscarProductos = async (filtros: any, skip = 0, take = 10) => {
    setLoading(true);
    try {
      const payload = {
        lineaId: filtros?.lineaId,
        skip,
        take,
      };

      const productosFiltrados = await ProductoService.obtener(payload);

      setProductos(productosFiltrados.data);
      setEntidadesTotales(productosFiltrados.total);
    } finally {
      setLoading(false);
    }
  };

  // Preview: calcula los precios nuevos contra TODOS los productos alcanzados
  // por el filtro (no solo la página visible). No persiste nada.
  const aplicarCambios = async (
    dto: CambioPreciosMasivoDto,
  ): Promise<PreviewResultado> => {
    setLoading(true);
    try {
      const resultado: PreviewResultado =
        await CambioPreciosMasivoService.aplicarCambios(dto);

      const nuevoPreview = new Map<number, PreviewItem>();
      resultado.items.forEach((item) => {
        nuevoPreview.set(item.productoId, item);
      });
      setPreview(nuevoPreview);

      return resultado;
    } finally {
      setLoading(false);
    }
  };

  // Confirmar: recalcula server-side y persiste todo dentro de una
  // transacción (todo o nada). Recibe el mismo dto que el preview.
  const guardarCambios = async (
    dto: CambioPreciosMasivoDto,
  ): Promise<ResponsePost> => {
    setLoading(true);
    try {
      const response = await CambioPreciosMasivoService.guardarCambios(dto);
      setPreview(new Map());
      return response;
    } finally {
      setLoading(false);
    }
  };

  const limpiarPreview = () => setPreview(new Map());

  const actualizarProductoLocal = (
    productoActualizado: ConsultarProductosCambioPreciosMasivo,
  ) => {
    setProductos((prevProductos) =>
      prevProductos.map((p) =>
        p.id === productoActualizado.id
          ? { ...productoActualizado, dirty: true }
          : p,
      ),
    );
  };

  return {
    productos,
    loading,
    entidadesTotales,
    preview,
    setProductos,
    buscarProductos,
    aplicarCambios,
    guardarCambios,
    limpiarPreview,
    actualizarProductoLocal,
  };
}