import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TablaAGGridMock } from "../../test/mock-tabla";
import type { servicioMock } from "../../test/mock-consultar";

const estado = vi.hoisted(() => ({
  confirmar: true,
  buscar: { cont: 0, componente: "" },
}));

vi.mock("../herramientas/tablas/tabla-flexible-ag-grid", async () => ({ TablaAGGrid: (await import("../../test/mock-tabla")).TablaAGGridMock }));
vi.mock("../herramientas/reutilizables/impresion-form", () => ({
  ImpresionForm: ({ onImprimirTodo, onImprimirPagina }: { onImprimirTodo: () => void; onImprimirPagina: () => void }) => (
    <div>
      <button onClick={onImprimirTodo}>Imprimir todo</button>
      <button onClick={onImprimirPagina}>Imprimir página</button>
    </div>
  ),
}));
vi.mock("../../context/filtros-contesxt", () => ({
  useFiltrosContext: () => ({
    setFiltrosNecesarios: vi.fn(),
    limpiarFiltros: vi.fn(),
    setBuscar: vi.fn(),
    buscar: estado.buscar,
  }),
}));
vi.mock("../herramientas/alertas/alertas-confirmacion", () => ({
  TipoAlertaConfirmacion: { DEFAULT: "default", DESTRUCTIVE: "destructive" },
  TituloAlertaConfirmacion: { DEFAULT: "Confirmación", DESTRUCTIVE: "Eliminar" },
  useConfirmation: () => ({
    showConfirmation: () => Promise.resolve(estado.confirmar),
    AlertasConfirmacion: () => null,
  }),
}));
vi.mock("../../utils/auth", () => ({ getUsuarioId: () => 7 }));
vi.mock("./marca/services/marca-service", async () => ({ default: (await import("../../test/mock-consultar")).servicioMock() }));
vi.mock("./envase-presentacion/services/envase-presentacion-service", async () => ({ default: (await import("../../test/mock-consultar")).servicioMock() }));
vi.mock("./linea/services/linea-service", async () => ({ default: (await import("../../test/mock-consultar")).servicioMock() }));
vi.mock("./linea/modales/linea-modal", async () => ({ LineaModal: (await import("../../test/mock-consultar")).modalMock("linea") }));
vi.mock("./superlinea/componentes/superlinea-filtro", () => ({
  default: ({ onChange }: { onChange: (id?: number) => void }) => (
    <div>
      <button onClick={() => onChange(5)}>filtrar superlinea 5</button>
      <button onClick={() => onChange(undefined)}>quitar superlinea</button>
    </div>
  ),
}));
vi.mock("./superlinea/services/superlinea-service", async () => ({ default: (await import("../../test/mock-consultar")).servicioMock() }));

vi.mock("./marca/modales/marca-modal", async () => ({ MarcaModal: (await import("../../test/mock-consultar")).modalMock("marca") }));
vi.mock("./envase-presentacion/modales/envase-presentacion-modal", async () => ({ EnvasePresentacionModal: (await import("../../test/mock-consultar")).modalMock("envase") }));
vi.mock("./superlinea/modales/superlinea-modal", async () => ({ SuperlineaModal: (await import("../../test/mock-consultar")).modalMock("superlinea") }));

import MarcaService from "./marca/services/marca-service";
import EnvaseService from "./envase-presentacion/services/envase-presentacion-service";
import SuperlineaService from "./superlinea/services/superlinea-service";
import LineaService from "./linea/services/linea-service";
import ConsultarLineas from "./linea/utils/consultar-linea";
import ConsultarMarcas from "./marca/utils/consultar-marca";
import ConsultarEnvases from "./envase-presentacion/utils/consultar-envase-presentacion";
import ConsultarSuperlineas from "./superlinea/utils/consultar-superlinea";

interface Caso {
  nombre: string;
  Pagina: ComponentType;
  servicio: ReturnType<typeof servicioMock>;
  componente: string;
  modal: string;
  manejaErrores: boolean;
  vacio?: string;
}

const casos: Caso[] = [
  { nombre: "Marcas", Pagina: ConsultarMarcas, servicio: MarcaService as never, componente: "consultar-marca", modal: "marca", manejaErrores: false },
  { nombre: "Líneas", Pagina: ConsultarLineas, servicio: LineaService as never, componente: "consultar-linea", modal: "linea", manejaErrores: false },
  { nombre: "Envases", Pagina: ConsultarEnvases, servicio: EnvaseService as never, componente: "consultar-envase-presentacion", modal: "envase", manejaErrores: true, vacio: "No se encontraron envases." },
  { nombre: "SuperLíneas", Pagina: ConsultarSuperlineas, servicio: SuperlineaService as never, componente: "consultar-superlinea", modal: "superlinea", manejaErrores: true, vacio: "No se encontraron SuperLíneas." },
];

const fila = (id: number, denominacion: string) => ({ id, denominacion, observacion: "", sistema: 0, deletedAt: null });

beforeEach(() => {
  estado.confirmar = true;
  estado.buscar = { cont: 0, componente: "" };
  vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn().mockReturnValue("blob:x");
  vi.spyOn(window, "open").mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe.each(casos)("pantalla de $nombre", ({ Pagina, servicio, componente, modal, manejaErrores, vacio }) => {
  const cargar = (filas = [fila(1, "UNO"), fila(2, "DOS")], total = 2) =>
    vi.mocked(servicio.obtener).mockResolvedValue({ data: filas, total });

  it("busca al montar y muestra las filas y el total", async () => {
    cargar();
    render(<Pagina />);

    expect((await screen.findAllByText("UNO")).length).toBeGreaterThan(0);
    expect(servicio.obtener).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
    expect(screen.getAllByText("DOS").length).toBeGreaterThan(0);
  });

  it("filtra por denominación e incluye eliminados", async () => {
    const user = userEvent.setup();
    cargar();
    render(<Pagina />);
    await screen.findAllByText("UNO");

    await user.click(screen.getAllByText("Filtros")[0]);
    await user.type(screen.getByPlaceholderText("Buscar por denominación..."), "uno");
    await user.click(screen.getByRole("checkbox", { name: /Incluir eliminados/ }));
    await user.click(screen.getByRole("button", { name: /Buscar/ }));

    await waitFor(() =>
      expect(servicio.obtener).toHaveBeenLastCalledWith(
        expect.objectContaining({ denominacion: "uno", incluirEliminados: true }),
      ),
    );
  });

  it("muestra el estado de carga mientras espera al backend", async () => {
    let resolver!: (v: unknown) => void;
    vi.mocked(servicio.obtener).mockReturnValue(new Promise((r) => (resolver = r)) as never);
    render(<Pagina />);

    expect(await screen.findByText(/Cargando/)).toBeInTheDocument();
    await act(async () => resolver({ data: [fila(1, "UNO")], total: 1 }));
    await screen.findAllByText("UNO");
  });

  it("abre el alta, cierra el modal y al guardar avisa y recarga", async () => {
    const user = userEvent.setup();
    cargar();
    render(<Pagina />);
    await screen.findAllByText("UNO");

    const alta = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-circle-plus, svg.lucide-plus-circle"))!;
    await user.click(alta);
    expect(await screen.findByText(`modal ${modal} alta`)).toBeInTheDocument();

    await user.click(screen.getByText("cerrar modal"));
    expect(screen.queryByText(`modal ${modal} alta`)).not.toBeInTheDocument();

    await user.click(alta);
    const llamadas = vi.mocked(servicio.obtener).mock.calls.length;
    await user.click(await screen.findByText("guardar modal"));
    expect(await screen.findByText("Guardado ok")).toBeInTheDocument();
    await waitFor(() => expect(vi.mocked(servicio.obtener).mock.calls.length).toBeGreaterThan(llamadas));
  });

  it("edita: pide la entidad y abre el modal de edición", async () => {
    const user = userEvent.setup();
    cargar();
    vi.mocked(servicio.obtenerId).mockResolvedValue(fila(1, "UNO"));
    render(<Pagina />);
    await screen.findAllByText("UNO");

    await user.click(screen.getAllByTitle("Editar")[0]);

    expect(servicio.obtenerId).toHaveBeenCalledWith(1);
    expect(await screen.findByText(`modal ${modal} edicion`)).toBeInTheDocument();
  });

  it("info: pide la auditoría y abre el modal de auditoría", async () => {
    const user = userEvent.setup();
    cargar();
    vi.mocked(servicio.obtenerAuditoria).mockResolvedValue({ id: 1 });
    render(<Pagina />);
    await screen.findAllByText("UNO");

    await user.click(screen.getAllByTitle("Ver información")[0]);

    expect(servicio.obtenerAuditoria).toHaveBeenCalledWith(1);
    expect(await screen.findByText(`modal ${modal} auditoria`)).toBeInTheDocument();
  });

  it("elimina con confirmación, quita la fila y avisa", async () => {
    const user = userEvent.setup();
    cargar();
    vi.mocked(servicio.eliminar).mockResolvedValue({ mensaje: "Eliminado ok" });
    render(<Pagina />);
    await screen.findAllByText("UNO");

    await user.click(screen.getAllByTitle("Eliminar")[0]);

    expect(servicio.eliminar).toHaveBeenCalledWith(1, 7);
    expect(await screen.findByText("Eliminado ok")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryAllByText("UNO")).toHaveLength(0));
  });

  it("si se cancela la confirmación no elimina", async () => {
    const user = userEvent.setup();
    cargar();
    estado.confirmar = false;
    render(<Pagina />);
    await screen.findAllByText("UNO");

    await user.click(screen.getAllByTitle("Eliminar")[0]);

    expect(servicio.eliminar).not.toHaveBeenCalled();
  });

  it("si el backend rechaza la baja muestra una alerta de error", async () => {
    const user = userEvent.setup();
    cargar();
    vi.mocked(servicio.eliminar).mockRejectedValue({
      response: { status: 409, data: { statusCode: 409, code: "CONFLICTO", message: "Está en uso." } },
    });
    render(<Pagina />);
    await screen.findAllByText("UNO");

    await user.click(screen.getAllByTitle("Eliminar")[0]);

    await waitFor(() => expect(screen.getAllByText(/en uso|utilizada|modificado/i).length).toBeGreaterThan(0));
    expect(screen.getAllByText("UNO").length).toBeGreaterThan(0);
  });

  it("imprime todo y la página en una pestaña nueva", async () => {
    const user = userEvent.setup();
    cargar();
    vi.mocked(servicio.imprimirTodo).mockResolvedValue("pdf");
    vi.mocked(servicio.imprimirPagina).mockResolvedValue("pdf");
    render(<Pagina />);
    await screen.findAllByText("UNO");

    if (componente === "consultar-marca" || componente === "consultar-linea") {
      await user.click(screen.getAllByText("Imprimir todo")[0]);
      await user.click(screen.getAllByText("Imprimir página")[0]);
      await waitFor(() => expect(window.open).toHaveBeenCalledTimes(2));
    } else {
      expect(screen.queryByText("Imprimir todo")).not.toBeInTheDocument();
    }
  });

  it("pagina: al cambiar de página vuelve a buscar con el skip correspondiente", async () => {
    const user = userEvent.setup();
    cargar([fila(1, "UNO")], 25);
    render(<Pagina />);
    await screen.findAllByText("UNO");

    await user.click(screen.getByRole("button", { name: "2" }));

    await waitFor(() => expect(servicio.obtener).toHaveBeenLastCalledWith(expect.objectContaining({ skip: 10, take: 10 })));
  });

  it("reacciona a la búsqueda del contexto (botón Buscar de la barra lateral)", async () => {
    cargar();
    const { rerender } = render(<Pagina />);
    await screen.findAllByText("UNO");
    const antes = vi.mocked(servicio.obtener).mock.calls.length;

    estado.buscar = { cont: 1, componente };
    rerender(<Pagina />);

    await waitFor(() => expect(vi.mocked(servicio.obtener).mock.calls.length).toBeGreaterThan(antes));
  });

  if (manejaErrores) {
    it("sin resultados muestra el mensaje de vacío", async () => {
      cargar([], 0);
      render(<Pagina />);
      expect(await screen.findByText(vacio!)).toBeInTheDocument();
    });

    it("si la búsqueda falla muestra el error del backend", async () => {
      vi.mocked(servicio.obtener).mockRejectedValue({
        response: { status: 500, data: { statusCode: 500, code: "ERROR_INTERNO", message: "Se rompió todo" } },
      });
      render(<Pagina />);
      expect(await screen.findByText(/Se rompió todo|error/i)).toBeInTheDocument();
    });

    it("si falla pedir la entidad o la auditoría avisa con una alerta", async () => {
      const user = userEvent.setup();
      cargar();
      const falla = { response: { status: 404, data: { statusCode: 404, code: "NO_ENCONTRADO", message: "No existe." } } };
      vi.mocked(servicio.obtenerId).mockRejectedValue(falla);
      vi.mocked(servicio.obtenerAuditoria).mockRejectedValue(falla);
      render(<Pagina />);
      await screen.findAllByText("UNO");

      await user.click(screen.getAllByTitle("Editar")[0]);
      expect((await screen.findAllByText(/No existe/)).length).toBeGreaterThan(0);
      await user.click(screen.getAllByTitle("Ver información")[0]);
      await waitFor(() => expect(servicio.obtenerAuditoria).toHaveBeenCalled());
    });
  }
});

describe("pantalla de Líneas: filtro por SuperLínea", () => {
  it("agrega superlineaId a la búsqueda y lo quita al volver a 'todas'", async () => {
    const user = userEvent.setup();
    vi.mocked(LineaService.obtener as never as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [fila(1, "UNO")], total: 1 });
    render(<ConsultarLineas />);
    await screen.findAllByText("UNO");

    await user.click(screen.getByText("filtrar superlinea 5"));
    await waitFor(() =>
      expect(LineaService.obtener).toHaveBeenLastCalledWith(expect.objectContaining({ superlineaId: 5 })),
    );

    await user.click(screen.getByText("quitar superlinea"));
    await waitFor(() =>
      expect((LineaService.obtener as never as ReturnType<typeof vi.fn>).mock.calls[(LineaService.obtener as never as ReturnType<typeof vi.fn>).mock.calls.length - 1][0]).not.toHaveProperty("superlineaId"),
    );
  });
});
