import { useState, useEffect, useRef } from "react";
import { Info, Pencil, Trash, Box, CircleDollarSign, Shuffle, Star } from "lucide-react";
import { Button } from "../../../ui/Button";
import ProductoService from "../services/producto-service";
import { formatCantidades, formatPrice } from "../../../herramientas/formateo-de-campos/fucion-formateo";
import { ConsultarProducto, Producto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { TablaAGGrid, Column } from "../../../herramientas/tablas/tabla-flexible-ag-grid";
import { jwtDecode } from "jwt-decode";
import Paginacion from "../../../herramientas/reutilizables/paginacion";
import { Card, CardContent } from "../../../ui/Card";
import { useFiltrosContext } from "../../../../context/filtros-contesxt";
import { useConfiguracionSistema } from "../../../sistema/ConfiguracionSistemaContext";
import { Auditoria, ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import FiltrosAplicados from "../../../herramientas/reutilizables/filtros-aplicados";
import { Alertas, TipoAlerta, TituloAlerta, useAlerts } from "../../../herramientas/alertas/alertas";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";
import { useFiltrosIniciales } from "../../../../hooks/useFiltrosIniciales";
import { useCatalogosContext } from "../../../../context/catalogos-context";
import { ProductosHeader } from "../componentes/header-producto";
import { ProductosModales } from "../modales/producto-modales";
import { usePaginacion } from "../../../../hooks/use-paginacion";
import { PAGINACION } from "../../../../config/paginacion";
import { useProductoImpresion } from "../hooks/use-producto-impresion";
import { ProductosHeaderLg } from "../componentes/header-producto-lg";
import { DatosTabla } from "../componentes/datos-tabla";
import { DatosCard } from "../componentes/datos-card";
import { NotificacionModal } from "../../../NotificacionModal/modales/NotificacionModal";
import { ProductoNotificacion, EntidadTipo } from "../../../NotificacionModal/interfaces/notificacion.types";
import { getAuthData, getRoles, getUsuarioId } from "../../../../utils/auth";
import { puedeHacerAcciones } from "../domain/permisos-producto";
import ProveedorService from "../../../gestion-organizacion/proveedor/services/proveedor-service";
import { getApiErrorCategory, getApiErrorMessage, normalizeApiError } from "../../../../utils/errores";
import { useNotificaciones } from "../../../../context/notificaciones-context";


export default function ConsultarProductos() {
  const [productos, setProductos] = useState<ConsultarProducto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarActualizarProducto, setMostrarActualizarProducto] = useState(false);
  const [mostrarAjusteStock, setMostrarAjusteStock] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto>({} as Producto);
  const [productoInfo, setProductoInfo] = useState<Producto>({} as Producto);
  const [mostrarInfoAuditoria, setMostrarInfoAuditoria] = useState(false);
  const [mostrarMovimientosStock, setMostrarMovimientosStock] = useState(false);
  const [mostrarHistorialPrecios, setMostrarHistorialPrecios] = useState(false);
  const [productoHistorial, setProductoHistorial] = useState<{ id: number; denominacion: string } | null>(null);
  const [mostrarCambioPrecios, setMostrarCambioPrecios] = useState(false);
  const [mostrarProductosAlternativos, setMostrarProductosAlternativos] = useState(false);
  const [mostrarDeQuienEsAlternativo, setMostrarDeQuienEsAlternativo] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [productoNotificacionSeleccionado, setProductoNotificacionSeleccionado] = useState<ProductoNotificacion | null>(null);
  const notificadosStockCriticoRef = useRef<Set<number>>(new Set());
  const usuarioId = getUsuarioId();
  const { configuracion } = useConfiguracionSistema();
  const [codigo, setCodigo] = useState<string>("");
  const [exacto, setExacto] = useState<boolean>(true);
  const [auditoria, setAuditoria] = useState<Auditoria>({} as Auditoria);
  const isMounted = useRef(false);
  const inicializacionCompleta = useRef(false);
  const { empresaId } = getAuthData();

  // =========================
  // PAGINACIÓN
  // =========================
  const { paginaActual, entidadesTotales, skip, take, setEntidadesTotales, handlePageChange, resetearPaginacion } =
    usePaginacion(PAGINACION.TAKE_DEFAULT);

  // MANEJO DE FILTROS ========================================================
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);
  const {
    setFiltrosNecesarios,
    valoresFiltros,
    setValoresFiltros,

    limpiarFiltros,
    buscar,
    setBuscar,
    setBusquedaRapida,
  } = useFiltrosContext();

  const filtrosInicialesConsultarProducto = useFiltrosIniciales("consultar-producto");

  // =========================
  // ALERTAS / CONFIRMACIONES
  // =========================
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { agregarNotificacion } = useNotificaciones();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

    // Contexto de catálogos
  const {
    setLineas,
    setMarcas,
    setProveedores,
  } = useCatalogosContext();
  
  // Setear qué filtros mostrar en la sidebar
  useEffect(() => {
    limpiarFiltros();
    setBuscar({ cont: 0, componente: "consultar-producto" });
    setFiltrosNecesarios({
      denominacion: true,
      codigoProveedor: true,
      linea: true,
      marca: true,
      proveedor: true,
      conStock: true,
    });
    setValoresFiltros(filtrosInicialesConsultarProducto);
    setFiltrosInicializados(true);
    setTimeout(() => {
      inicializacionCompleta.current = true;
    }, 500);
  }, []);

  useEffect(() => {
    if (!inicializacionCompleta.current) return;
    const timer = setTimeout(() => {
      handleBuscarProductosRapido();
    }, 400);
    return () => clearTimeout(timer);
  }, [codigo, exacto]);

  useEffect(() => {
    if (buscar.cont > 0 && buscar.componente === "consultar-producto") {
      handleBuscarProductos(true);
    }
  }, [buscar]);

  const mostrarAlertasStockCritico = (items: ConsultarProducto[]) => {
    const productosEnAlerta = items.filter((producto) => {
      const productoConStockMinimo = producto as ConsultarProducto & {
        stockMinimo?: number;
        utilizaStockMinimo?: boolean;
      };

      const stock = Number(producto.stock ?? 0);
      const stockMinimo = Number(productoConStockMinimo.stockMinimo ?? 0);
      const utilizaStockMinimo = Boolean(productoConStockMinimo.utilizaStockMinimo ?? false);

      return utilizaStockMinimo && stock <= stockMinimo;
    });

    productosEnAlerta.forEach((producto) => {
      const id = Number(producto.id);
      if (notificadosStockCriticoRef.current.has(id)) return;

      notificadosStockCriticoRef.current.add(id);
      agregarNotificacion({
        id: `stock-critico-${id}`,
        title: "Stock crítico",
        message: `El producto ${producto.denominacion} se encuentra bajo el stock crítico.`,
        type: "warning",
      });
      addAlert({
        type: TipoAlerta.WARNING,
        title: "Stock crítico",
        message: `El producto ${producto.denominacion} se encuentra bajo el stock crítico.`,
        autoClose: true,
        duration: 3000,
      });
    });
  };

  useEffect(() => {
    mostrarAlertasStockCritico(productos);
  }, [productos, agregarNotificacion]);

  // MANEJO DE FILTROS ========================================================



  // =========================
  // IMPRESIÓN
  // =========================
  const { handleImprimirTodo, handleImprimirPagina } = useProductoImpresion();

  const fetchLineas = async () => {
    setError(null);
    try {
      const caracteresParaBusqueda = configuracion?.caracteresParaBusqueda ?? 4;
      if (valoresFiltros.denominacionLinea && valoresFiltros.denominacionLinea.length >= caracteresParaBusqueda) {
        const lineasTotales = await ProductoService.obtenerTotales(
          { denominacion: valoresFiltros.denominacionLinea || " " },
          "lineas",
        );
        setLineas(lineasTotales.data);
      }
    } catch (err: any) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productossss.");
    } finally {
    }
  };
  useEffect(() => {
    fetchLineas();
  }, [valoresFiltros.denominacionLinea]);

  const fetchMarcas = async () => {
    setError(null);
    try {
      const caracteresParaBusqueda = configuracion?.caracteresParaBusqueda ?? 4;

      if (valoresFiltros.denominacionMarca && valoresFiltros.denominacionMarca.length >= caracteresParaBusqueda) {
        const marcasTotales = await ProductoService.obtenerTotales(
          { denominacion: valoresFiltros.denominacionMarca || " " },
          "marcas",
        );
        setMarcas(marcasTotales.data);
      }
    } catch (err: any) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productossss.");
    } finally {
    }
  };
  useEffect(() => {
    fetchMarcas();
  }, [valoresFiltros.denominacionMarca]);

  const fetchProveedores = async () => {
    setError(null);
    try {
      const caracteresParaBusqueda = configuracion?.caracteresParaBusqueda ?? 4;

      if (
        valoresFiltros.denominacionProveedor &&
        valoresFiltros.denominacionProveedor.length >= caracteresParaBusqueda
      ) {
        const proveedoresTotales = await ProveedorService.obtener({
          denominacion: valoresFiltros.denominacionProveedor || " ",
          empresaId,
          condicionIvaId: 0,
          skip: 0,
          take: 10,
        });
        setProveedores(proveedoresTotales.data);
      }
    } catch (err: any) {
      console.error("Error al obtener proveedores:", err);
      setError("No se pudieron cargar los proveedores.");
    } finally {
    }
  };
  useEffect(() => {
    fetchProveedores();
  }, [valoresFiltros.denominacionProveedor]);

  const handleAbrirActualizarProducto = async (id: number) => {
    if (id) {
      const producto = await ProductoService.obtenerId(id);
      setProductoSeleccionado(producto);
      setMostrarActualizarProducto(true);
    }
  };

  const handleCerrarActualizarProducto = () => {
    setMostrarActualizarProducto(false);
    setProductoSeleccionado({} as Producto); // Reset de la marca seleccionada
  };

  const handleAbrirAjusteStock = async (id: number) => {
    try {
      const producto = await ProductoService.obtenerId(id);
      setProductoSeleccionado(producto);
      setMostrarAjusteStock(true);
    } catch (apiError) {
      addAlert({
        type: TipoAlerta.ERROR,
        title: TituloAlerta.ERROR,
        message: "No se pudo obtener el producto para ajustar el stock.",
        autoClose: true,
        duration: 3000,
      });
    }
  };

  const handleCerrarAjusteStock = () => {
    setMostrarAjusteStock(false);
    setProductoSeleccionado({} as Producto);
  };

  const handleAjusteStockSuccess = async (mensajeAlerta: string) => {
    handleCerrarAjusteStock();
    addAlert({
      type: TipoAlerta.SUCCESS,
      title: TituloAlerta.SUCCESS,
      message: mensajeAlerta,
      autoClose: true,
      duration: 3000,
    });
    await handleBuscarProductos();
  };

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirmation({
      type: TipoAlertaConfirmacion.DESTRUCTIVE,
      title: TituloAlertaConfirmacion.DESTRUCTIVE,
      message: "¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      onConfirm: () => {},
    });

    if (!confirmed) return;

    let response: ResponsePost;
    try {
      response = await ProductoService.eliminar(id, usuarioId);
      setProductos(productos.filter((producto) => producto.id !== id));
      addAlert({
        type: TipoAlerta.SUCCESS,
        title: TituloAlerta.SUCCESS,
        message: response.mensaje,
        autoClose: true,
        duration: 3000,
      });
    } catch (err: unknown) {
      const apiError = normalizeApiError(err);
      addAlert({
        type: getApiErrorCategory(apiError) === "not-found" ? TipoAlerta.WARNING : TipoAlerta.ERROR,
        title: getApiErrorCategory(apiError) === "not-found" ? "Recurso inexistente" : TituloAlerta.ERROR,
        message: getApiErrorMessage(apiError),
        autoClose: true,
        duration: 3000,
      });
      if (apiError.statusCode === 404) await handleBuscarProductos();
    }
  };

  const handleMostrarInfo = async (id: number) => {
    if (id) {
      const datosAuditoria = await ProductoService.obtenerAuditoria(id);
      setAuditoria(datosAuditoria);
      setMostrarInfoAuditoria(true);
    }
  };

  const handleCerrarInfo = () => {
    setMostrarInfoAuditoria(false);
    setAuditoria({} as Auditoria);
  };

  const handleMostrarMovimientosStock = async (id: number) => {
    if (id) {
      const producto = await ProductoService.obtenerId(id);
      setProductoInfo(producto);
      setMostrarMovimientosStock(true);
    }
  };

  const handleCerrarMovimientosStock = () => {
    setBuscar({ cont: 0, componente: "consultar-producto" });
    limpiarFiltros();
    setMostrarMovimientosStock(false);
    setProductoInfo({} as Producto);
  };

  const handleMostrarHistorialPrecios = (id: number) => {
    const producto = productos.find((item) => item.id === id);
    if (!producto) return;
    setProductoHistorial({ id: producto.id, denominacion: producto.denominacion });
    setMostrarHistorialPrecios(true);
  };

  const handleMostrarCambioPrecios = async (id: number) => {
    if (id) {
      const producto = await ProductoService.obtenerId(id);
      setProductoInfo(producto);
      setMostrarCambioPrecios(true);
    }
  };

  const handleCerrarHistorialPrecios = () => {
    setMostrarHistorialPrecios(false);
    setProductoHistorial(null);
  };

  const handleCerrarCambioPrecios = () => {
    setMostrarCambioPrecios(false);
    setProductoInfo({} as Producto);
  };

  const handleCerrarProductosAlternativos = () => {
    setMostrarProductosAlternativos(false);
    setProductoInfo({} as Producto);
  };

  const handleCerrarDeQuienEsAlternativo = () => {
    setMostrarDeQuienEsAlternativo(false);
    setProductoInfo({} as Producto);
  };

  const handleNotificar = (producto: ConsultarProducto) => {
    setProductoNotificacionSeleccionado({
      id: producto.id,
      denominacion: producto.denominacion,
      stock: producto.stock,
    });
    setModalAbierto(true);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = async (mensajeAlerta: string) => {
    closeModal();

    addAlert({
      type: TipoAlerta.SUCCESS,
      title: TituloAlerta.SUCCESS,
      message: mensajeAlerta,
      autoClose: true,
      duration: 3000,
    });

    setLoading(true);

    const filtrosConPaginacion = {
      denominacion: valoresFiltros.denominacion,
      codigoProveedor: valoresFiltros.codigoProveedor,
      codigoReferencia: valoresFiltros.codigoReferencia,
      lineaId: valoresFiltros.lineaId,
      marcaId: valoresFiltros.marcaId,
      proveedorId: valoresFiltros.proveedorId,
      conStock: valoresFiltros.conStock,
      codReferenciaExacto: valoresFiltros.codReferenciaExacto,
      codProveedorExacto: valoresFiltros.codProveedorExacto,
      skip: skip,
      take: take,
    };

    const productosFiltrados = await ProductoService.obtener(filtrosConPaginacion);

    setEntidadesTotales(productosFiltrados.total);
    setProductos(productosFiltrados.data);
    setLoading(false);
  };

  const handleActualizarSuccess = async (mensajeAlerta: string) => {
    closeModal();

    addAlert({
      type: TipoAlerta.SUCCESS,
      title: TituloAlerta.SUCCESS,
      message: mensajeAlerta,
      autoClose: true,
      duration: 3000,
    });

    setLoading(true);

    await handleBuscarProductos();
  };

  const handleBuscarProductos = async (botonBuscar?: boolean) => {
    setBusquedaRapida(false);
    if (botonBuscar) {
      resetearPaginacion();
    }
    setLoading(true);

    const filtrosConPaginacion = {
      denominacion: valoresFiltros.denominacion,
      codigoProveedor: valoresFiltros.codigoProveedor,
      codigoReferencia: valoresFiltros.codigoReferencia,
      codProveedorExacto: valoresFiltros.codProveedorExacto,
      codReferenciaExacto: valoresFiltros.codReferenciaExacto,
      lineaId: valoresFiltros.lineaId,
      marcaId: valoresFiltros.marcaId,
      proveedorId: valoresFiltros.proveedorId,
      conStock: valoresFiltros.conStock,
      skip: skip,
      take: take,
    };

    const productosFiltrados = await ProductoService.obtener(filtrosConPaginacion);
    setProductos(productosFiltrados.data);
    setEntidadesTotales(productosFiltrados.total);
    setLoading(false);
  };

  const handleBuscarProductosRapido = async (botonBuscar?: boolean) => {
    setBusquedaRapida(true);
    if (botonBuscar) {
      resetearPaginacion();
    }
    setLoading(true);

    const filtrosConPaginacion = {
      codigo: codigo,
      exacto: exacto,
      skip: skip,
      take: take,
    };

    const productosFiltrados = await ProductoService.obtenerRapido(filtrosConPaginacion);
    setProductos(productosFiltrados.data);
    setEntidadesTotales(productosFiltrados.total);
    setLoading(false);
  };

  // MANEJO DE PAGINACION ===========================================

  useEffect(() => {
    if (filtrosInicializados === true) {
      handleBuscarProductos();
    }
  }, [paginaActual, filtrosInicializados, take]);

  // MANEJO DE PAGINACION ===========================================

  const columns: Column<ConsultarProducto>[] = [
    {
      header: "Cód.",
      accessor: "codigoProveedor",
      flex: 0.27,
      type: "text",
      align: "right",
      editable: false,
      scrollable: false,
    },
    {
      header: "Denominación",
      accessor: "denominacion",
      flex: 0.8,
      type: "text",
      editable: false,
      formatFunction: ({ value, row }) => (
        <div className="flex flex-col">
          <div
            className="flex items-center gap-1 truncate whitespace-nowrap max-w-[700px]"
            title={typeof value === "string" ? `${value}${row.observacion ? `\n${row.observacion}` : ""}` : undefined}
          >
            <Star size={16} className={row.esAlternativo ? "text-red-500 shrink-0" : "text-yellow-500 shrink-0"} />
            <span>{value}</span>
          </div>
          {row.observacion && <div className="text-sm text-gray-500 truncate max-w-[700px]">{row.observacion}</div>}
        </div>
      ),
      scrollable: false,
    },
    {
      header: "Presentación",
      accessor: "presentacion",
      flex: 0.6,
      type: "text",
      editable: false,
      formatFunction: ({ value }) => <span>{textoPresentacion(value)}</span>,
    },
    {
      header: "Precio",
      accessor: "precio",
      flex: 0.3,
      type: "text",
      editable: false,
      align: "left",
      autoHeight: true,
      formatFunction: ({ value }) => <span className="break-all">${formatPrice(value)}</span>,
    },
  ];

  return (
    <div className="w-full">
      {/* Contenido Principal */}
      <div className="p-2">
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
            {/* Tabla de productos */}
            <Card className="border-gray-200 dark:border-slate-700">
              <div className="hidden lg:block">
                {/*  HEADER Desktop */}
                <ProductosHeader
                  roles={getRoles()}
                  codigo={codigo}
                  exacto={exacto}
                  onChangeCodigo={setCodigo}
                  onChangeExacto={setExacto}
                  onBuscarRapido={() => handleBuscarProductosRapido(true)}
                  onNuevo={openModal}
                  total={entidadesTotales}
                  mostrados={productos.length}
                  paginaActual={paginaActual}
                  onImprimirTodo={handleImprimirTodo}
                  onImprimirPagina={handleImprimirPagina}
                />
              </div>

              <div className="lg:hidden">
                <ProductosHeaderLg
                  codigo={codigo}
                  exacto={exacto}
                  roles={getRoles()}
                  onChangeCodigo={setCodigo}
                  onChangeExacto={setExacto}
                  onBuscarRapido={() => handleBuscarProductosRapido(true)}
                  onNuevo={openModal}
                  total={entidadesTotales}
                  mostrados={productos.length}
                  paginaActual={paginaActual}
                  onImprimirTodo={handleImprimirTodo}
                  onImprimirPagina={handleImprimirPagina}
                />
              </div>

              <CardContent className="p-0">
                <FiltrosAplicados />
                <DatosTabla
                  productos={productos}
                  columns={columns}
                  puedeAccionar={puedeHacerAcciones(getRoles())}
                  onEditar={handleAbrirActualizarProducto}
                  onInfo={handleMostrarInfo}
                  onDelete={handleDelete}
                  onAjustarStock={handleAbrirAjusteStock}
                  onMovimientos={handleMostrarMovimientosStock}
                  onCambioPrecios={handleMostrarCambioPrecios}
                  onHistorial={handleMostrarHistorialPrecios}
                  onNotificar={handleNotificar}
                />

                <div className="lg:hidden space-y-3">
                  {productos.map((producto) => (
                    <DatosCard
                      key={producto.id}
                      producto={producto}
                      onEditar={handleAbrirActualizarProducto}
                      onInfo={handleMostrarInfo}
                      onDelete={handleDelete}
                      onMovimientos={handleMostrarMovimientosStock}
                      onCambioPrecios={handleMostrarCambioPrecios}
                      onHistorial={puedeHacerAcciones(getRoles()) ? handleMostrarHistorialPrecios : undefined}
                      onNotificar={handleNotificar}
                      onAjustarStock={puedeHacerAcciones(getRoles()) ? handleAbrirAjusteStock : undefined}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Paginación */}
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

      {/* ================= MODALES ================= */}
      <ProductosModales
        isAltaOpen={isModalOpen}
        mostrarActualizarProducto={mostrarActualizarProducto}
        mostrarAjusteStock={mostrarAjusteStock}
        mostrarInfoAuditoria={mostrarInfoAuditoria}
        mostrarMovimientosStock={mostrarMovimientosStock}
        mostrarHistorialPrecios={mostrarHistorialPrecios}
        mostrarCambioPrecios={mostrarCambioPrecios}
        mostrarProductosAlternativos={mostrarProductosAlternativos}
        mostrarDeQuienEsAlternativo={mostrarDeQuienEsAlternativo}
        productoSeleccionado={productoSeleccionado}
        productoHistorial={productoHistorial}
        productoInfo={productoInfo}
        auditoria={auditoria}
        onCloseAlta={closeModal}
        onCloseActualizar={handleCerrarActualizarProducto}
        onCloseAjusteStock={handleCerrarAjusteStock}
        onCloseAuditoria={handleCerrarInfo}
        onCloseMovimientosStock={handleCerrarMovimientosStock}
        onCloseHistorialPrecios={handleCerrarHistorialPrecios}
        onCloseCambioPrecios={handleCerrarCambioPrecios}
        onCloseProductosAlternativos={handleCerrarProductosAlternativos}
        onCloseDeQuienEsAlternativo={handleCerrarDeQuienEsAlternativo}
        onSuccessAlta={handleSuccess}
        onSuccessActualizar={handleActualizarSuccess}
        onSuccessAjusteStock={handleAjusteStockSuccess}
        onRefetch={handleBuscarProductos}
        onNotify={(alert) => addAlert({ ...alert, autoClose: true, duration: 3000 })}
      />

      {productoNotificacionSeleccionado && (
        <NotificacionModal
          open={modalAbierto}
          producto={productoNotificacionSeleccionado}
          entidadTipo={EntidadTipo.PRODUCTO}
          onClose={() => {
            setModalAbierto(false);
            setProductoNotificacionSeleccionado(null);
          }}
        />
      )}
      {/* =========================================== */}
    </div>
  );
}
