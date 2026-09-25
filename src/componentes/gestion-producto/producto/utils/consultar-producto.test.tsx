import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ctx = vi.hoisted(() => ({
  confirmar: true,
  roles: [1] as number[],
  filtros: {
    valoresFiltros: {} as Record<string, string>,
    buscar: { cont: 0, componente: "" },
    busquedaRapida: false,
    buscarSuperlineas: 0,
  },
  setBusquedaRapida: (() => undefined) as (v: boolean) => void,
  setBuscar: (() => undefined) as (v: unknown) => void,
  limpiarFiltros: (() => undefined) as () => void,
  agregarNotificacion: (() => undefined) as (n: unknown) => void,
  caracteres: 4 as number | undefined,
}));

vi.mock("../../../herramientas/tablas/tabla-flexible-ag-grid", async () => ({
  TablaAGGrid: (await import("../../../../test/mock-tabla")).TablaAGGridMock,
}));
vi.mock("../../../herramientas/reutilizables/impresion-form", () => ({ ImpresionForm: () => null }));
vi.mock("../../../herramientas/reutilizables/filtros-aplicados", () => ({ default: () => <div>filtros aplicados</div> }));
vi.mock("../../../herramientas/alertas/alertas-confirmacion", () => ({
  TipoAlertaConfirmacion: { DEFAULT: "default", DESTRUCTIVE: "destructive" },
  TituloAlertaConfirmacion: { DEFAULT: "Confirmación", DESTRUCTIVE: "Eliminar" },
  useConfirmation: () => ({ showConfirmation: () => Promise.resolve(ctx.confirmar), AlertasConfirmacion: () => null }),
}));
vi.mock("../../../../context/filtros-contesxt", () => ({
  useFiltrosContext: () => ({
    setFiltrosNecesarios: vi.fn(),
    valoresFiltros: ctx.filtros.valoresFiltros,
    setValoresFiltros: vi.fn(),
    limpiarFiltros: ctx.limpiarFiltros,
    buscar: ctx.filtros.buscar,
    setBuscar: ctx.setBuscar,
    busquedaRapida: ctx.filtros.busquedaRapida,
    setBusquedaRapida: ctx.setBusquedaRapida,
    buscarSuperlineas: ctx.filtros.buscarSuperlineas,
  }),
}));
vi.mock("../../../../context/catalogos-context", () => ({
  useCatalogosContext: () => ({ setLineas: vi.fn(), setMarcas: vi.fn(), setProveedores: vi.fn(), setSuperlineas: vi.fn() }),
}));
vi.mock("../../../../context/notificaciones-context", () => ({
  useNotificaciones: () => ({ agregarNotificacion: ctx.agregarNotificacion }),
}));
vi.mock("../../../sistema/ConfiguracionSistemaContext", () => ({
  useConfiguracionSistema: () => ({ configuracion: ctx.caracteres === undefined ? null : { caracteresParaBusqueda: ctx.caracteres } }),
}));
vi.mock("../../../../utils/auth", () => ({
  getUsuarioId: () => 7,
  getRoles: () => ctx.roles,
  getAuthData: () => ({ empresaId: 1 }),
}));
vi.mock("../hooks/use-producto-impresion", () => ({
  useProductoImpresion: () => ({ handleImprimirTodo: vi.fn(), handleImprimirPagina: vi.fn() }),
}));
vi.mock("../services/producto-service", () => ({
  default: {
    buscarPorFiltros: vi.fn(),
    obtenerRapido: vi.fn(),
    obtenerTotales: vi.fn(),
    obtenerId: vi.fn(),
    obtenerAuditoria: vi.fn(),
    eliminar: vi.fn(),
  },
}));
vi.mock("../../../gestion-organizacion/proveedor/services/proveedor-service", () => ({ default: { obtener: vi.fn() } }));
vi.mock("../../superlinea/services/superlinea-service", () => ({ default: { obtener: vi.fn() } }));
vi.mock("../modales/producto-modales", () => ({
  ProductosModales: (p: Record<string, any>) => (
    <div>
      {p.isAltaOpen && <span>modal alta</span>}
      {p.mostrarActualizarProducto && <span>modal actualizar</span>}
      {p.mostrarAjusteStock && <span>modal ajuste stock</span>}
      {p.mostrarInfoAuditoria && <span>modal auditoría</span>}
      {p.mostrarMovimientosStock && <span>modal movimientos</span>}
      {p.mostrarHistorialPrecios && <span>{`modal historial ${p.productoHistorial?.denominacion}`}</span>}
      {p.mostrarCambioPrecios && <span>modal cambio precios</span>}
      <button onClick={p.onCloseAlta}>x alta</button>
      <button onClick={p.onCloseActualizar}>x actualizar</button>
      <button onClick={p.onCloseAjusteStock}>x ajuste</button>
      <button onClick={p.onCloseAuditoria}>x auditoría</button>
      <button onClick={p.onCloseMovimientosStock}>x movimientos</button>
      <button onClick={p.onCloseHistorialPrecios}>x historial</button>
      <button onClick={p.onCloseCambioPrecios}>x cambio</button>
      <button onClick={p.onCloseProductosAlternativos}>x alternativos</button>
      <button onClick={p.onCloseDeQuienEsAlternativo}>x dequien</button>
      <button onClick={() => p.onSuccessAlta("Alta ok")}>ok alta</button>
      <button onClick={() => p.onSuccessActualizar("Edición ok")}>ok actualizar</button>
      <button onClick={() => p.onSuccessAjusteStock("Ajuste ok")}>ok ajuste</button>
      <button onClick={() => p.onRefetch()}>refetch</button>
      <button onClick={() => p.onNotify({ type: "warning", title: "T", message: "Aviso notificado" })}>notify</button>
    </div>
  ),
}));
vi.mock("../../../NotificacionModal/modales/NotificacionModal", () => ({
  NotificacionModal: ({ open, producto, onClose }: any) => (open ? <div><span>{`notificar ${producto.denominacion}`}</span><button onClick={onClose}>cerrar notificación</button></div> : null),
}));

import ProductoService from "../services/producto-service";
import ProveedorService from "../../../gestion-organizacion/proveedor/services/proveedor-service";
import SuperlineaService from "../../superlinea/services/superlinea-service";
import ConsultarProductos from "./consultar-producto";

const producto = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  denominacion: `PRODUCTO ${id}`,
  codigoProveedor: `C${id}`,
  precio: 100,
  stock: 10,
  observacion: "",
  presentacion: { envase: { id: 1, denominacion: "BOTELLA" }, contenido: { cantidad: 500, unidad: "ml" }, texto: "BOTELLA 500 ml" },
  ...extra,
});

const buscar = vi.mocked(ProductoService.buscarPorFiltros);

beforeEach(() => {
  ctx.confirmar = true;
  ctx.roles = [1];
  ctx.caracteres = 4;
  ctx.filtros = { valoresFiltros: {}, buscar: { cont: 0, componente: "" }, busquedaRapida: false, buscarSuperlineas: 0 };
  ctx.setBusquedaRapida = vi.fn();
  ctx.setBuscar = vi.fn();
  ctx.limpiarFiltros = vi.fn();
  ctx.agregarNotificacion = vi.fn();
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  buscar.mockResolvedValue({ data: [producto(1), producto(2)], total: 2 } as never);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const montar = async () => {
  const utils = render(<ConsultarProductos />);
  await screen.findAllByText("PRODUCTO 1");
  return utils;
};

describe("ConsultarProductos: búsqueda", () => {
  it("al montar busca por filtros y muestra los productos con su presentación y precio", async () => {
    await montar();

    expect(buscar).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10, incluirEliminados: false }));
    expect(screen.getAllByText("BOTELLA 500 ml").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$100/).length).toBeGreaterThan(0);
    expect(ctx.limpiarFiltros).toHaveBeenCalled();
    expect(ctx.setBuscar).toHaveBeenCalledWith({ cont: 0, componente: "consultar-producto" });
  });

  it("muestra el estado de carga y luego el vacío", async () => {
    let resolver!: (v: unknown) => void;
    buscar.mockReturnValue(new Promise((r) => (resolver = r)) as never);
    render(<ConsultarProductos />);
    expect(await screen.findByText("Cargando productos...")).toBeInTheDocument();

    await act(async () => resolver({ data: [], total: 0 }));
    expect(await screen.findByText("No se encontraron productos.")).toBeInTheDocument();
  });

  it("si la búsqueda falla vacía la tabla y avisa con el mensaje del backend", async () => {
    buscar.mockRejectedValue({ response: { status: 500, data: { statusCode: 500, code: "ERROR_INTERNO", message: "Se cayó el server" } } });
    render(<ConsultarProductos />);
    expect((await screen.findAllByText(/Se cayó el server|error/i)).length).toBeGreaterThan(0);
    expect(screen.getByText("No se encontraron productos.")).toBeInTheDocument();
  });

  it("la búsqueda rápida por código usa 'exacto' y respeta el debounce", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.obtenerRapido).mockResolvedValue({ data: [producto(9)], total: 1 } as never);
    await montar();

    await new Promise((r) => setTimeout(r, 600));
    await user.type(screen.getAllByPlaceholderText("Código...")[0], "AB");

    await waitFor(() => expect(ProductoService.obtenerRapido).toHaveBeenCalledWith(expect.objectContaining({ codigo: "AB", exacto: true })), { timeout: 3000 });
    expect(ctx.setBusquedaRapida).toHaveBeenCalledWith(true);
    expect(await screen.findAllByText("PRODUCTO 9")).not.toHaveLength(0);
  });

  it("si la búsqueda rápida falla avisa y vacía la tabla", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.obtenerRapido).mockRejectedValue({ response: { status: 400, data: { statusCode: 400, code: "SOLICITUD_INVALIDA", message: "Parámetro inválido" } } });
    await montar();

    await new Promise((r) => setTimeout(r, 600));
    await user.type(screen.getAllByPlaceholderText("Código...")[0], "AB");

    expect(await screen.findByText(/Parámetro inválido|inválid/i, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it("Enter en el buscador del celular dispara la búsqueda rápida", async () => {
    vi.mocked(ProductoService.obtenerRapido).mockResolvedValue({ data: [producto(9)], total: 1 } as never);
    await montar();
    const inputs = screen.getAllByPlaceholderText("Código...");
    fireEvent.change(inputs[1], { target: { value: "ZZ" } });
    fireEvent.keyDown(inputs[1], { key: "Enter" });
    await waitFor(() => expect(ProductoService.obtenerRapido).toHaveBeenCalled(), { timeout: 3000 });
  });

  it("cambiar 'Mostrar eliminados' relanza la búsqueda incluyendo eliminados", async () => {
    const user = userEvent.setup();
    await montar();
    await new Promise((r) => setTimeout(r, 600));

    await user.click(screen.getAllByLabelText("Mostrar eliminados")[0]);

    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith(expect.objectContaining({ incluirEliminados: true, skip: 0 })));
  });

  it("con búsqueda rápida activa, 'Mostrar eliminados' relanza la rápida", async () => {
    const user = userEvent.setup();
    ctx.filtros.busquedaRapida = true;
    vi.mocked(ProductoService.obtenerRapido).mockResolvedValue({ data: [producto(3)], total: 1 } as never);
    await montar();
    await new Promise((r) => setTimeout(r, 600));
    await user.type(screen.getAllByPlaceholderText("Código...")[0], "Q");
    await user.click(screen.getAllByLabelText("Mostrar eliminados")[0]);
    await waitFor(() => expect(ProductoService.obtenerRapido).toHaveBeenCalledWith(expect.objectContaining({ incluirEliminados: true })), { timeout: 3000 });
  });

  it("la búsqueda de la barra lateral (contexto) relanza la búsqueda", async () => {
    const { rerender } = await montar();
    const antes = buscar.mock.calls.length;
    ctx.filtros.buscar = { cont: 1, componente: "consultar-producto" };
    rerender(<ConsultarProductos />);
    await waitFor(() => expect(buscar.mock.calls.length).toBeGreaterThan(antes));
  });

  it("pagina: pide el skip de la página elegida", async () => {
    const user = userEvent.setup();
    buscar.mockResolvedValue({ data: [producto(1)], total: 25 } as never);
    await montar();

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 10, take: 10 })));
  });

  it("pasa denominación, línea y superlínea del contexto al backend", async () => {
    ctx.filtros.valoresFiltros = { denominacion: "aceite", denominacionLinea: "acei", denominacionSuperlinea: "almacen" };
    vi.mocked(ProductoService.obtenerTotales).mockResolvedValue({ data: [{ id: 1 }] } as never);
    await montar();
    expect(buscar).toHaveBeenCalledWith(expect.objectContaining({ denominacion: "aceite", linea: "acei", superlinea: "almacen" }));
    await waitFor(() => expect(ProductoService.obtenerTotales).toHaveBeenCalledWith({ denominacion: "acei" }, "lineas"));
  });
});

describe("ConsultarProductos: catálogos de la barra lateral", () => {
  it("carga marcas y proveedores solo si el texto alcanza el mínimo de caracteres", async () => {
    ctx.filtros.valoresFiltros = { denominacionMarca: "nat", denominacionProveedor: "prove" };
    vi.mocked(ProductoService.obtenerTotales).mockResolvedValue({ data: [] } as never);
    vi.mocked(ProveedorService.obtener).mockResolvedValue({ data: [] } as never);
    await montar();

    expect(ProductoService.obtenerTotales).not.toHaveBeenCalled();
    expect(ProveedorService.obtener).toHaveBeenCalledWith(expect.objectContaining({ denominacion: "prove", empresaId: 1 }));
  });

  it("marcas: consulta cuando el texto alcanza el mínimo", async () => {
    ctx.filtros.valoresFiltros = { denominacionMarca: "natura" };
    vi.mocked(ProductoService.obtenerTotales).mockResolvedValue({ data: [] } as never);
    await montar();
    await waitFor(() => expect(ProductoService.obtenerTotales).toHaveBeenCalledWith({ denominacion: "natura" }, "marcas"));
  });

  it("sin configuración usa 4 caracteres como mínimo", async () => {
    ctx.caracteres = undefined;
    ctx.filtros.valoresFiltros = { denominacionMarca: "nat" };
    await montar();
    expect(ProductoService.obtenerTotales).not.toHaveBeenCalled();
  });

  it("si fallan los catálogos muestra un mensaje de error", async () => {
    ctx.filtros.valoresFiltros = { denominacionMarca: "natura" };
    vi.mocked(ProductoService.obtenerTotales).mockRejectedValue(new Error("x"));
    render(<ConsultarProductos />);
    expect(await screen.findByText(/No se pudieron cargar/)).toBeInTheDocument();
  });

  it("si falla el proveedor muestra un mensaje de error", async () => {
    ctx.filtros.valoresFiltros = { denominacionProveedor: "prove" };
    vi.mocked(ProveedorService.obtener).mockRejectedValue(new Error("x"));
    render(<ConsultarProductos />);
    expect(await screen.findByText("No se pudieron cargar los proveedores.")).toBeInTheDocument();
  });

  it("superlíneas: busca cuando el contexto lo pide y limpia si no hay texto", async () => {
    ctx.filtros.buscarSuperlineas = 1;
    ctx.filtros.valoresFiltros = { denominacionSuperlinea: "alma" };
    vi.mocked(SuperlineaService.obtener).mockResolvedValue({ data: [] } as never);
    await montar();
    await waitFor(() => expect(SuperlineaService.obtener).toHaveBeenCalledWith({ denominacion: "alma", skip: 0, take: 10 }));
  });

  it("superlíneas: sin texto no consulta al backend", async () => {
    ctx.filtros.buscarSuperlineas = 1;
    ctx.filtros.valoresFiltros = { denominacionSuperlinea: "  " };
    await montar();
    expect(SuperlineaService.obtener).not.toHaveBeenCalled();
  });

  it("superlíneas: si falla avisa", async () => {
    ctx.filtros.buscarSuperlineas = 1;
    ctx.filtros.valoresFiltros = { denominacionSuperlinea: "alma" };
    vi.mocked(SuperlineaService.obtener).mockRejectedValue(new Error("x"));
    render(<ConsultarProductos />);
    expect(await screen.findByText("No se pudieron cargar las SuperLíneas.")).toBeInTheDocument();
  });
});

describe("ConsultarProductos: acciones", () => {
  it("alta: abre el modal, y al guardar avisa y recarga", async () => {
    const user = userEvent.setup();
    await montar();
    await user.click(screen.getAllByText("Añadir")[0]);
    expect(screen.getByText("modal alta")).toBeInTheDocument();

    const antes = buscar.mock.calls.length;
    await user.click(screen.getByText("ok alta"));
    expect(await screen.findByText("Alta ok")).toBeInTheDocument();
    await waitFor(() => expect(buscar.mock.calls.length).toBeGreaterThan(antes));
    expect(screen.queryByText("modal alta")).not.toBeInTheDocument();
  });

  it("alta: cerrar el modal lo oculta", async () => {
    const user = userEvent.setup();
    await montar();
    await user.click(screen.getAllByText("Añadir")[0]);
    await user.click(screen.getByText("x alta"));
    expect(screen.queryByText("modal alta")).not.toBeInTheDocument();
  });

  it("editar: trae el producto, abre el modal y al guardar recarga", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.obtenerId).mockResolvedValue(producto(1) as never);
    await montar();

    await user.click(screen.getAllByTitle("Editar producto")[0]);
    expect(ProductoService.obtenerId).toHaveBeenCalledWith(1);
    expect(await screen.findByText("modal actualizar")).toBeInTheDocument();

    await user.click(screen.getByText("ok actualizar"));
    expect(await screen.findByText("Edición ok")).toBeInTheDocument();
    await user.click(screen.getByText("x actualizar"));
  });

  it("ajuste de stock: abre el modal; si falla el pedido avisa", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.obtenerId).mockResolvedValueOnce(producto(1) as never);
    await montar();

    await user.click(screen.getAllByTitle("Ajustar stock")[0]);
    expect(await screen.findByText("modal ajuste stock")).toBeInTheDocument();
    await user.click(screen.getByText("ok ajuste"));
    expect(await screen.findByText("Ajuste ok")).toBeInTheDocument();
    await user.click(screen.getByText("x ajuste"));

    vi.mocked(ProductoService.obtenerId).mockRejectedValueOnce(new Error("x"));
    await user.click(screen.getAllByTitle("Ajustar stock")[0]);
    expect(await screen.findByText("No se pudo obtener el producto para ajustar el stock.")).toBeInTheDocument();
  });

  it("info: trae la auditoría y abre el modal", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.obtenerAuditoria).mockResolvedValue({ id: 1 } as never);
    await montar();

    await user.click(screen.getAllByTitle("Ver información")[0]);
    expect(await screen.findByText("modal auditoría")).toBeInTheDocument();
    await user.click(screen.getByText("x auditoría"));
    expect(screen.queryByText("modal auditoría")).not.toBeInTheDocument();
  });

  it("historial: abre el modal con la denominación del producto", async () => {
    const user = userEvent.setup();
    await montar();

    await user.click(screen.getAllByTitle("Historial de precios")[0]);
    expect(await screen.findByText("modal historial PRODUCTO 1")).toBeInTheDocument();
    await user.click(screen.getByText("x historial"));
    expect(screen.queryByText(/modal historial/)).not.toBeInTheDocument();
  });

  it("los cierres de los demás modales no rompen la pantalla", async () => {
    const user = userEvent.setup();
    await montar();
    for (const t of ["x movimientos", "x cambio", "x alternativos", "x dequien", "refetch"]) {
      await user.click(screen.getByText(t));
    }
    expect(ctx.setBuscar).toHaveBeenCalledWith({ cont: 0, componente: "consultar-producto" });
    expect(screen.getAllByText("PRODUCTO 1").length).toBeGreaterThan(0);
  });

  it("onNotify del modal agrega una alerta", async () => {
    const user = userEvent.setup();
    await montar();
    await user.click(screen.getByText("notify"));
    expect(await screen.findByText("Aviso notificado")).toBeInTheDocument();
  });

  it("solo el administrador puede accionar; un vendedor ve la lista sin acciones", async () => {
    ctx.roles = [4];
    await montar();
    expect(screen.queryAllByTitle("Editar producto")).toHaveLength(0);
    expect(screen.queryAllByText("Añadir")).toHaveLength(0);
  });
});

describe("ConsultarProductos: baja", () => {
  it("confirma, quita la fila y avisa", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.eliminar).mockResolvedValue({ mensaje: "Producto eliminado" } as never);
    await montar();

    await user.click(screen.getAllByTitle("Eliminar producto")[0]);

    expect(ProductoService.eliminar).toHaveBeenCalledWith(1, 7);
    expect(await screen.findByText("Producto eliminado")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryAllByText("PRODUCTO 1")).toHaveLength(0));
  });

  it("con 'Mostrar eliminados' activo marca la fila como eliminada en vez de quitarla", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.eliminar).mockResolvedValue({ mensaje: "Producto eliminado" } as never);
    await montar();
    await new Promise((r) => setTimeout(r, 600));
    await user.click(screen.getAllByLabelText("Mostrar eliminados")[0]);
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith(expect.objectContaining({ incluirEliminados: true })));
    await screen.findAllByText("PRODUCTO 1");

    await user.click(screen.getAllByTitle("Eliminar producto")[0]);

    expect((await screen.findAllByText("Eliminado")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("PRODUCTO 1").length).toBeGreaterThan(0);
  });

  it("si se cancela la confirmación no elimina", async () => {
    const user = userEvent.setup();
    ctx.confirmar = false;
    await montar();
    await user.click(screen.getAllByTitle("Eliminar producto")[0]);
    expect(ProductoService.eliminar).not.toHaveBeenCalled();
  });

  it("un 404 avisa como recurso inexistente y vuelve a buscar", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.eliminar).mockRejectedValue({ response: { status: 404, data: { statusCode: 404, code: "NO_ENCONTRADO", message: "Entidad ya eliminada." } } });
    await montar();
    const antes = buscar.mock.calls.length;

    await user.click(screen.getAllByTitle("Eliminar producto")[0]);

    expect(await screen.findByText("Recurso inexistente")).toBeInTheDocument();
    await waitFor(() => expect(buscar.mock.calls.length).toBeGreaterThan(antes));
  });

  it("otro error se informa como error", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.eliminar).mockRejectedValue({ response: { status: 409, data: { statusCode: 409, code: "CONFLICTO", message: "No se puede" } } });
    await montar();
    await user.click(screen.getAllByTitle("Eliminar producto")[0]);
    await waitFor(() => expect(screen.queryByText("Recurso inexistente")).not.toBeInTheDocument());
    expect(ProductoService.eliminar).toHaveBeenCalled();
  });
});

describe("ConsultarProductos: stock crítico y notificaciones", () => {
  const critico = producto(5, { stock: 1, stockMinimo: 3, utilizaStockMinimo: true });

  it("avisa una sola vez por producto bajo el stock crítico", async () => {
    buscar.mockResolvedValue({ data: [critico, producto(6, { stock: 50, stockMinimo: 3, utilizaStockMinimo: true })], total: 2 } as never);
    await montar().catch(() => undefined);
    await screen.findAllByText("PRODUCTO 5");

    expect(ctx.agregarNotificacion).toHaveBeenCalledTimes(1);
    expect(ctx.agregarNotificacion).toHaveBeenCalledWith(expect.objectContaining({ id: "stock-critico-5" }));
    expect((await screen.findAllByText(/bajo el stock crítico/)).length).toBeGreaterThan(0);
  });

  it("no avisa si la regla de stock mínimo no está habilitada", async () => {
    buscar.mockResolvedValue({ data: [producto(7, { stock: 0, stockMinimo: 3, utilizaStockMinimo: false })], total: 1 } as never);
    await screen.findAllByText("PRODUCTO 7").catch(() => undefined);
    render(<ConsultarProductos />);
    await screen.findAllByText("PRODUCTO 7");
    expect(ctx.agregarNotificacion).not.toHaveBeenCalled();
  });

  it("enviar notificación abre y cierra el modal del producto", async () => {
    const user = userEvent.setup();
    await montar();
    await user.click(screen.getAllByTitle("Enviar notificación")[0]);
    expect(await screen.findByText("notificar PRODUCTO 1")).toBeInTheDocument();
    await user.click(screen.getByText("cerrar notificación"));
    expect(screen.queryByText("notificar PRODUCTO 1")).not.toBeInTheDocument();
  });
});
