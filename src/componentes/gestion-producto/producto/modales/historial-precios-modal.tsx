import { useEffect, useState } from "react";
import type { HistorialPrecio } from "../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";
import { getApiErrorMessage, normalizeApiError } from "../../../../utils/errores";
import { formatFechaHora, formatPrice } from "../../../herramientas/formateo-de-campos/fucion-formateo";
import Paginacion from "../../../herramientas/reutilizables/paginacion";
import { Button } from "../../../ui/Button";
import ProductoService from "../services/producto-service";

interface Props {
  producto: { id: number; denominacion: string };
  onClose: () => void;
}

type EstadoHistorial =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; cambios: HistorialPrecio[]; total: number };

const TAKE_INICIAL = 10;

export default function HistorialPreciosModal({ producto, onClose }: Props) {
  const [estado, setEstado] = useState<EstadoHistorial>({ tipo: "cargando" });
  const [pagina, setPagina] = useState({ skip: 0, take: TAKE_INICIAL, actual: 1 });
  const [reintentos, setReintentos] = useState(0);

  useEffect(() => {
    // Solo se muestra lo que confirma el backend en la consulta vigente: una
    // respuesta atrasada (otra página, o el modal ya cerrado) se descarta.
    let vigente = true;
    setEstado({ tipo: "cargando" });

    ProductoService.obtenerHistorialPrecios(producto.id, pagina.skip, pagina.take)
      .then((respuesta) => {
        if (vigente) setEstado({ tipo: "listo", cambios: respuesta.data, total: respuesta.total });
      })
      .catch((error) => {
        if (vigente) setEstado({ tipo: "error", mensaje: getApiErrorMessage(normalizeApiError(error)) });
      });

    return () => {
      vigente = false;
    };
  }, [producto.id, pagina.skip, pagina.take, reintentos]);

  const cambiarPagina = (skip: number, take: number, actual: number) => {
    setPagina({ skip, take, actual });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="historial-precios-titulo"
      className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl"
    >
      <h2 id="historial-precios-titulo" className="text-lg font-semibold text-gray-900">
        Historial de precios
      </h2>
      <p className="mt-1 text-sm text-gray-600">{producto.denominacion}</p>

      <div className="mt-4">
        {estado.tipo === "cargando" && (
          <div role="status" className="flex flex-col items-center justify-center py-10">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
            <p className="text-sm text-gray-600">Cargando historial de precios...</p>
          </div>
        )}

        {estado.tipo === "error" && (
          <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium">No se pudo cargar el historial de precios.</p>
            <p className="mt-1">{estado.mensaje}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setReintentos((cantidad) => cantidad + 1)}
            >
              Reintentar
            </Button>
          </div>
        )}

        {estado.tipo === "listo" && estado.cambios.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-600">
            {estado.total === 0
              ? "Este producto todavía no tiene cambios de precio registrados."
              : "No hay cambios de precio en esta página."}
          </p>
        )}

        {estado.tipo === "listo" && estado.cambios.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <caption className="sr-only">
                Cambios de precio de {producto.denominacion}, del más reciente al más antiguo
              </caption>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-gray-700">
                    Fecha
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                    Precio anterior
                  </th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-gray-700">
                    Precio nuevo
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-gray-700">
                    Motivo
                  </th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-gray-700">
                    Responsable
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {estado.cambios.map((cambio) => (
                  <tr key={cambio.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                      {formatFechaHora(cambio.fecha)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-gray-700">
                      {formatPrice(cambio.precioAnterior, "ARS")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-900">
                      {formatPrice(cambio.precioNuevo, "ARS")}
                    </td>
                    <td className="px-3 py-2 text-gray-700">{cambio.motivo}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                      {cambio.usuarioDenominacion || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {estado.tipo === "listo" && (
          <Paginacion
            entidadesTotales={estado.total}
            take={pagina.take}
            paginaActual={pagina.actual}
            onChange={cambiarPagina}
          />
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  );
}
