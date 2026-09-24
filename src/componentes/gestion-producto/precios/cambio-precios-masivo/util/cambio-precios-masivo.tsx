import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "../../../../ui/Card";
import { Alertas, TipoAlerta, TituloAlerta, useAlerts } from "../../../../herramientas/alertas/alertas";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../../herramientas/alertas/alertas-confirmacion";
import { ConsultarProductosCambioPreciosMasivo } from "../../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { formatPrice } from "../../../../herramientas/formateo-de-campos/fucion-formateo";
import { Column } from "../../../../herramientas/tablas/tabla-flexible-ag-grid";
import { useConfiguracionSistema } from "../../../../sistema/ConfiguracionSistemaContext";
import { useFiltrosContext } from "../../../../../context/filtros-contesxt";
import CambioPreciosManual from "../cambio-precios.manual";
import { useCatalogosContext } from "../../../../../context/catalogos-context";
import { getUsuarioId } from "../../../../../utils/auth";
import { useCambioPrecios, CambioPreciosMasivoDto } from "../hooks/useCambioPrecios";
import TablaCambioPrecios from "../componentes/tabla-cambio-precios";
import FiltrosCambioPrecios from "../componentes/filtros-cambio-precios";
import ProductoService from "../../../producto/services/producto-service";
import Paginacion from "../../../../herramientas/reutilizables/paginacion";
import { usePaginacion } from "../../../../../hooks/use-paginacion";
import { PAGINACION } from "../../../../../config/paginacion";
import { textoPresentacion } from "../../../producto/domain/presentacion-producto";

// TipoAumento.PORCENTAJE = 1, TipoAumento.MONTO_FIJO = 2
const TIPO_PORCENTAJE = 1;
const TIPO_MONTO_FIJO = 2;

export default function CambioPreciosMasivo() {
  const [error, setError] = useState<string | null>(null);
  const [mostrarActualizarProducto, setMostrarActualizarProducto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<ConsultarProductosCambioPreciosMasivo>(
    {} as ConsultarProductosCambioPreciosMasivo
  );

  // ── Estados del ajuste masivo de precios ──
  const [tipoAjuste, setTipoAjuste] = useState<number>(TIPO_PORCENTAJE);
  const [valorAjuste, setValorAjuste] = useState<number>(0);
  const [previsualizacionLista, setPrevisualizacionLista] = useState(false);
  const [alcance, setAlcance] = useState<"" | "LINEA" | "GLOBAL">("");

  const usuarioId = getUsuarioId();
  const { configuracion } = useConfiguracionSistema();
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const {
    setFiltrosNecesarios,
    valoresFiltros,
    setValoresFiltros,
    limpiarFiltros,
    setBuscar,
    buscarLineas,
  } = useFiltrosContext();

  const {
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
  } = useCambioPrecios(usuarioId);

  const {
    paginaActual,
    skip,
    take,
    handlePageChange,
    resetearPaginacion,
  } = usePaginacion(PAGINACION.TAKE_DEFAULT);

  const [filtrosAplicados, setFiltrosAplicados] = useState<any | null>(null);

  const { lineas, setLineas } = useCatalogosContext();

  useEffect(() => {
    limpiarFiltros();
    setBuscar({ cont: 0, componente: "cambio-precios-masivo" });
    setFiltrosNecesarios({ linea: true });
  }, []);

  const fetchLineas = useCallback(async () => {
    setError(null);
    try {
      const caracteresParaBusqueda = configuracion?.caracteresParaBusqueda ?? 4;
      if (
        valoresFiltros.denominacionLinea &&
        valoresFiltros.denominacionLinea.length >= caracteresParaBusqueda
      ) {
        const lineasTotales = await ProductoService.obtenerTotales(
          { denominacion: valoresFiltros.denominacionLinea || " " },
          "lineas"
        );
        setLineas(lineasTotales.data);
      }
    } catch {
      setError("No se pudieron cargar las líneas.");
    }
  }, [valoresFiltros.denominacionLinea, configuracion?.caracteresParaBusqueda]);

  useEffect(() => {
    fetchLineas();
  }, [buscarLineas]);

  const handleAbrirActualizarProducto = useCallback(
    (producto: ConsultarProductosCambioPreciosMasivo) => {
      setProductoSeleccionado(producto);
      setMostrarActualizarProducto(true);
    },
    []
  );

  const handleCerrarActualizarProducto = useCallback(() => {
    setMostrarActualizarProducto(false);
    setProductoSeleccionado({} as ConsultarProductosCambioPreciosMasivo);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      const confirmed = await showConfirmation({
        type: TipoAlertaConfirmacion.DESTRUCTIVE,
        title: TituloAlertaConfirmacion.DESTRUCTIVE,
        message: "¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.",
        confirmText: "Eliminar",
        cancelText: "Cancelar",
        onConfirm: () => {},
      });
      if (!confirmed) return;

      try {
        setProductos((prev) => prev.filter((p) => p.id !== id));
        addAlert({
          type: TipoAlerta.SUCCESS,
          title: TituloAlerta.SUCCESS,
          message: "El elemento ha sido eliminado.",
          autoClose: true,
          duration: 3000,
        });
      } catch {
        addAlert({
          type: TipoAlerta.ERROR,
          title: TituloAlerta.ERROR,
          message: "No se puede eliminar este elemento.",
          autoClose: true,
          duration: 3000,
        });
      }
    },
    [showConfirmation, setProductos, addAlert]
  );

  const handleLimpiarFiltros = useCallback(() => {
    setValoresFiltros({
      denominacionLinea: "",
      lineaId: undefined,
    });
    setLineas([]);
    setProductos([]);
    setFiltrosAplicados(null);
    resetearPaginacion();
    setPrevisualizacionLista(false);
    setAlcance("");
    setValorAjuste(0);
    limpiarPreview();
  }, [setValoresFiltros, setLineas, setProductos, resetearPaginacion, limpiarPreview]);

  const handleBuscarProductos = useCallback(() => {
    if (!alcance) {
      addAlert({
        type: TipoAlerta.WARNING,
        title: TituloAlerta.WARNING,
        message: "Seleccioná el alcance de la modificación antes de buscar.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    if (alcance === "LINEA" && !valoresFiltros.lineaId) {
      addAlert({
        type: TipoAlerta.WARNING,
        title: TituloAlerta.WARNING,
        message: "Seleccioná una línea para buscar sus productos.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    const filtros = {
      lineaId: alcance === "LINEA" ? valoresFiltros.lineaId : undefined,
    };

    resetearPaginacion();
    setFiltrosAplicados(filtros);
    buscarProductos(filtros, 0, take);

    // Cambiar el filtro invalida cualquier previsualización previa.
    setPrevisualizacionLista(false);
    limpiarPreview();
  }, [alcance, valoresFiltros.lineaId, addAlert, resetearPaginacion, buscarProductos, take, limpiarPreview]);

  const handleCambiarAlcance = useCallback((nuevoAlcance: "" | "LINEA" | "GLOBAL") => {
    setAlcance(nuevoAlcance);
    setPrevisualizacionLista(false);
    limpiarPreview();
    resetearPaginacion();

    if (nuevoAlcance === "GLOBAL") {
      const filtros = { lineaId: undefined };
      setValoresFiltros({ denominacionLinea: "", lineaId: undefined });
      setLineas([]);
      setFiltrosAplicados(filtros);
      buscarProductos(filtros, 0, take);
      return;
    }

    setProductos([]);
    setFiltrosAplicados(null);
  }, [buscarProductos, limpiarPreview, resetearPaginacion, setLineas, setProductos, setValoresFiltros, take]);

  useEffect(() => {
    if (filtrosAplicados) {
      buscarProductos(filtrosAplicados, skip, take);
    }
  }, [paginaActual, skip, take]);

  const handleActualizarSuccess = useCallback(
    (productoActualizado: ConsultarProductosCambioPreciosMasivo) => {
      addAlert({
        type: TipoAlerta.SUCCESS,
        title: TituloAlerta.SUCCESS,
        message: `El producto ${productoActualizado.denominacion} se ha actualizado correctamente.`,
        autoClose: true,
        duration: 3000,
      });
      actualizarProductoLocal(productoActualizado);
      setMostrarActualizarProducto(false);
    },
    [addAlert, actualizarProductoLocal]
  );

  const handleCambiarTipoAjuste = useCallback((tipo: number) => {
    setTipoAjuste(tipo);
    setPrevisualizacionLista(false);
    limpiarPreview();
  }, [limpiarPreview]);

  const handleCambiarValorAjuste = useCallback((valor: number) => {
    setValorAjuste(valor);
    setPrevisualizacionLista(false);
    limpiarPreview();
  }, [limpiarPreview]);

  const construirDto = useCallback((): CambioPreciosMasivoDto => ({
    tipo: Number(tipoAjuste),
    valor: Number(valorAjuste),
    alcance,
    lineaId: alcance === "LINEA" ? Number(valoresFiltros.lineaId) : undefined,
    usuarioId: Number(usuarioId),
  }), [tipoAjuste, valorAjuste, alcance, valoresFiltros.lineaId, usuarioId]);

  // Pide el preview al backend, calculado contra TODOS
  // los productos alcanzados por el filtro, no solo la página visible.
  const handleAplicarCambios = useCallback(async () => {
    if (!valorAjuste) {
      addAlert({
        type: TipoAlerta.WARNING,
        title: TituloAlerta.WARNING,
        message: "Ingresá un porcentaje o monto distinto de 0.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    setPrevisualizacionLista(false);

    try {
      const resultado = await aplicarCambios(construirDto());

      if (resultado.cantidadInvalidos > 0) {
        addAlert({
          type: TipoAlerta.WARNING,
          title: TituloAlerta.WARNING,
          message: `${resultado.cantidadInvalidos} de ${resultado.cantidadTotal} producto(s) quedarían con precio inválido. Si guardás, la operación completa será rechazada.`,
          autoClose: true,
          duration: 6000,
        });
      } else {
        setPrevisualizacionLista(true);
        addAlert({
          type: TipoAlerta.SUCCESS,
          title: TituloAlerta.SUCCESS,
          message: `Previsualización lista: ${resultado.cantidadTotal} producto(s) serían afectados.`,
          autoClose: true,
          duration: 3000,
        });
      }
    } catch (err: any) {
      addAlert({
        type: TipoAlerta.ERROR,
        title: TituloAlerta.ERROR,
        message: err?.response?.data?.message ?? "No se pudo calcular la previsualización.",
        autoClose: true,
        duration: 4000,
      });
    }
  }, [valorAjuste, aplicarCambios, construirDto, addAlert]);

  // Guardar confirma la operación y el backend recalcula el ajuste solicitado.
  const handleGuardarCambios = useCallback(async () => {
    if (!previsualizacionLista) {
      addAlert({
        type: TipoAlerta.WARNING,
        title: TituloAlerta.WARNING,
        message: "Primero generá una previsualización válida del ajuste.",
        autoClose: true,
        duration: 3000,
      });
      return;
    }

    const confirmed = await showConfirmation({
      type: TipoAlertaConfirmacion.DEFAULT,
      title: "Confirmar actualización masiva de precios",
      message:
        alcance === "GLOBAL"
          ? "Vas a aplicar este ajuste a TODOS los productos activos. ¿Confirmás?"
          : "Vas a aplicar este ajuste a los productos de la línea seleccionada. ¿Confirmás?",
      confirmText: "Aplicar y guardar",
      cancelText: "Cancelar",
      onConfirm: () => {},
    });
    if (!confirmed) return;

    try {
      const response = await guardarCambios(construirDto());
      addAlert({
        type: TipoAlerta.SUCCESS,
        title: TituloAlerta.SUCCESS,
        message: response.mensaje ?? "Precios actualizados correctamente.",
        autoClose: true,
        duration: 3000,
      });

      setPrevisualizacionLista(false);
      setValorAjuste(0);

      // Refrescar la tabla para reflejar los precios ya persistidos
      if (filtrosAplicados) {
        buscarProductos(filtrosAplicados, skip, take);
      }
    } catch (err: any) {
      addAlert({
        type: TipoAlerta.ERROR,
        title: TituloAlerta.ERROR,
        message:
          err?.response?.data?.message ??
          "No se pudo aplicar el cambio. La operación fue rechazada sin modificar precios.",
        autoClose: true,
        duration: 5000,
      });
    }
  }, [
    previsualizacionLista,
    alcance,
    showConfirmation,
    guardarCambios,
    construirDto,
    filtrosAplicados,
    buscarProductos,
    skip,
    take,
    addAlert,
  ]);

  const columns = useMemo<Column<ConsultarProductosCambioPreciosMasivo>[]>(
    () => [
      {
        header: "Código",
        accessor: "codigoProveedor",
        flex: 0.4,
        type: "text",
        align: "right",
        editable: false,
        scrollable: false,
      },
      {
        header: "Denominación",
        accessor: "denominacion",
        flex: 1.3,
        type: "text",
        editable: false,
        scrollable: false,
        formatFunction: ({ value, row }) => (
          <div className="flex flex-col">
            <div
              className="flex items-center gap-1 truncate whitespace-nowrap max-w-[700px]"
              title={
                typeof value === "string"
                  ? `${value}${row.observacion ? `\n${row.observacion}` : ""}`
                  : undefined
              }
            >
              <span>{value}</span>
            </div>
            {row.observacion && (
              <div className="text-sm text-gray-500 truncate max-w-[700px]">{row.observacion}</div>
            )}
          </div>
        ),
      },
      {
        header: "Presentación",
        accessor: "presentacion",
        flex: 0.6,
        type: "text",
        editable: false,
        scrollable: false,
        formatFunction: ({ value }) => <span>{textoPresentacion(value)}</span>,
      },
      {
        header: "Precio",
        accessor: "precio",
        flex: 0.5,
        type: "text",
        editable: false,
        align: "right",
        formatFunction: ({ value, row }) => {
          const item = preview.get(row.id);

          if (!item) {
            return <span>${formatPrice(value)}</span>;
          }

          return (
            <span>
              <span className="line-through text-gray-400 mr-2">
                ${formatPrice(item.precioActual)}
              </span>
              <span
                className={
                  item.valido
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                {item.valido && item.precioNuevo !== null
                  ? `$${formatPrice(item.precioNuevo)}`
                  : "inválido"}
              </span>
            </span>
          );
        },
      },
    ],
    [preview]
  );

  return (
    <div className="w-full">
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Cargando productos...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
              <p className="text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <Card className="border-gray-200 dark:border-slate-700">
              <FiltrosCambioPrecios
                valoresFiltros={valoresFiltros}
                setValoresFiltros={setValoresFiltros}
                lineas={lineas}
                productosLength={productos.length}
                onBuscar={handleBuscarProductos}
                fetchLineas={fetchLineas}
                onLimpiarFiltros={handleLimpiarFiltros}
                // ── Props nuevas para el ajuste masivo ──
                tipoAjuste={tipoAjuste}
                setTipoAjuste={handleCambiarTipoAjuste}
                valorAjuste={valorAjuste}
                setValorAjuste={handleCambiarValorAjuste}
                alcance={alcance}
                setAlcance={handleCambiarAlcance}
                onAplicarCambios={handleAplicarCambios}
                puedeGuardarCambios={previsualizacionLista}
                onGuardarCambios={handleGuardarCambios}
              />
              <CardContent className="p-0">
                <TablaCambioPrecios
                  productos={productos}
                  columns={columns}
                />
              </CardContent>
            </Card>

            <div className="mt-6">
              <Paginacion
                entidadesTotales={entidadesTotales}
                take={take}
                paginaActual={paginaActual}
                onChange={handlePageChange}
              />
            </div>

            <Alertas alerts={alerts} onRemove={removeAlert} />
            <AlertasConfirmacion />
          </>
        )}
      </div>

      {mostrarActualizarProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative p-6 sm:p-8 rounded-lg shadow-lg w-4/5 sm:w-3/5 md:w-2/3 lg:w-1/2 xl:w-2/5 max-w-full">
            <CambioPreciosManual
              producto={productoSeleccionado}
              onClose={handleCerrarActualizarProducto}
              onSuccess={handleActualizarSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
}
