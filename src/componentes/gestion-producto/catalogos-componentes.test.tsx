import { act, cleanup, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TablaAGGridMock } from "../../test/mock-tabla";

vi.mock("../herramientas/tablas/tabla-flexible-ag-grid", () => ({ TablaAGGrid: TablaAGGridMock }));
vi.mock("../herramientas/reutilizables/impresion-form", () => ({
  ImpresionForm: ({ onImprimirTodo, onImprimirPagina }: { onImprimirTodo: () => void; onImprimirPagina: () => void }) => (
    <div>
      <button onClick={onImprimirTodo}>Imprimir todo</button>
      <button onClick={onImprimirPagina}>Imprimir página</button>
    </div>
  ),
}));
vi.mock("../herramientas/reutilizables/informacion-auditoria", () => ({
  default: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>Auditoría mock</button>,
}));
vi.mock("./marca/utils/registrar-actualizar-marca", () => ({
  default: ({ marca }: { marca?: unknown }) => <div>{marca ? "form marca edición" : "form marca alta"}</div>,
}));
vi.mock("./linea/utils/registrar-actualizar-linea", () => ({
  default: ({ linea }: { linea?: unknown }) => <div>{linea ? "form linea edición" : "form linea alta"}</div>,
}));
vi.mock("./superlinea/utils/registrar-actualizar-superlinea", () => ({
  default: ({ superlinea }: { superlinea?: unknown }) => (
    <div>{superlinea ? "form superlinea edición" : "form superlinea alta"}</div>
  ),
}));
vi.mock("./envase-presentacion/utils/registrar-actualizar-envase-presentacion", () => ({
  default: ({ envase }: { envase?: unknown }) => <div>{envase ? "form envase edición" : "form envase alta"}</div>,
}));

import { Header as HeaderMarca } from "./marca/componentes/header";
import { HeaderLg as HeaderLgMarca } from "./marca/componentes/header-lg";
import { DatosCards as CardMarca } from "./marca/componentes/datos-card";
import { DatosTabla as TablaMarca } from "./marca/componentes/datos-tabla";
import { MarcaModal } from "./marca/modales/marca-modal";
import { useMarcaModal } from "./marca/hooks/use-marca-modal";
import { Header as HeaderLinea } from "./linea/componentes/header";
import { HeaderLg as HeaderLgLinea } from "./linea/componentes/header-lg";
import { DatosCards as CardLinea } from "./linea/componentes/datos-card";
import { DatosTabla as TablaLinea } from "./linea/componentes/datos-tabla";
import { LineaModal } from "./linea/modales/linea-modal";
import { useLineaModal } from "./linea/hooks/use-linea-modal";
import { Header as HeaderSuper } from "./superlinea/componentes/header";
import { HeaderLg as HeaderLgSuper } from "./superlinea/componentes/header-lg";
import { DatosTabla as TablaSuper } from "./superlinea/componentes/datos-tabla";
import { SuperlineaModal } from "./superlinea/modales/superlinea-modal";
import { useSuperlineaModal } from "./superlinea/hooks/use-superlinea-modal";
import { Header as HeaderEnvase } from "./envase-presentacion/componentes/header";
import { HeaderLg as HeaderLgEnvase } from "./envase-presentacion/componentes/header-lg";
import { DatosCards as CardEnvase } from "./envase-presentacion/componentes/datos-card";
import { DatosTabla as TablaEnvase } from "./envase-presentacion/componentes/datos-tabla";
import { EnvasePresentacionModal } from "./envase-presentacion/modales/envase-presentacion-modal";
import { useEnvasePresentacionModal } from "./envase-presentacion/hooks/use-envase-presentacion-modal";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const base: any = { id: 1, denominacion: "ALGO", observacion: "una obs", sistema: 0, deletedAt: null };
const eliminado: any = { ...base, id: 2, denominacion: "BORRADO", deletedAt: "2026-09-15T10:00:00.000Z" };
const deSistema: any = { ...base, id: 3, denominacion: "SISTEMA", sistema: 1 };

const acciones = () => ({ onEditar: vi.fn(), onInfo: vi.fn(), onDelete: vi.fn() });

// ---------------------------------------------------------------------------
// Encabezados
// ---------------------------------------------------------------------------
describe("encabezados de los catálogos", () => {
  const conImpresion = { entidadesTotales: 12, datosLength: 5, handleImprimirTodo: vi.fn(), handleImprimirPagina: vi.fn(), paginaActual: 1 };

  it.each([
    ["Marcas", HeaderMarca as ComponentType<any>, HeaderLgMarca as ComponentType<any>, true],
    ["Líneas", HeaderLinea as ComponentType<any>, HeaderLgLinea as ComponentType<any>, true],
    ["SuperLíneas", HeaderSuper as ComponentType<any>, HeaderLgSuper as ComponentType<any>, false],
    ["Envases de presentación", HeaderEnvase as ComponentType<any>, HeaderLgEnvase as ComponentType<any>, false],
  ])("%s: muestra título, totales y el botón de alta", async (titulo, Header, HeaderLg, imprime) => {
    const user = userEvent.setup();
    const openModal = vi.fn();
    render(<Header {...conImpresion} openModal={openModal} />);

    expect(screen.getByText(titulo)).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    const botonAlta = screen.getAllByRole("button").filter((b) => !/Imprimir/.test(b.textContent ?? ""))[0];
    await user.click(botonAlta);
    expect(openModal).toHaveBeenCalledTimes(1);

    if (imprime) {
      await user.click(screen.getByText("Imprimir todo"));
      await user.click(screen.getByText("Imprimir página"));
      expect(conImpresion.handleImprimirTodo).toHaveBeenCalled();
      expect(conImpresion.handleImprimirPagina).toHaveBeenCalled();
    }

    cleanup();
    render(<HeaderLg {...conImpresion} openModal={openModal} />);
    expect(screen.getAllByText(/Marcas|Líneas|SuperLíneas|Envases/).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------
describe("tablas de los catálogos", () => {
  it.each([
    ["marcas", TablaMarca as ComponentType<any>, "marcas"],
    ["líneas", TablaLinea as ComponentType<any>, "lineas"],
    ["superlíneas", TablaSuper as ComponentType<any>, "superlineas"],
    ["envases", TablaEnvase as ComponentType<any>, "envases"],
  ])("%s: muestra filas y dispara las acciones", async (_nombre, Tabla, prop) => {
    const user = userEvent.setup();
    const { onEditar, onInfo, onDelete } = acciones();

    render(<Tabla {...{ [prop]: [base, eliminado] }} onEditar={onEditar} onInfo={onInfo} onDelete={onDelete} />);

    expect(screen.getByText("ALGO")).toBeInTheDocument();
    expect(screen.getByText(/Eliminad[oa] el/)).toBeInTheDocument();
    // La fila eliminada no ofrece acciones.
    expect(screen.getAllByTitle("Editar")).toHaveLength(1);

    await user.click(screen.getByTitle("Ver información"));
    await user.click(screen.getByTitle("Editar"));
    await user.click(screen.getByTitle("Eliminar"));
    expect(onInfo).toHaveBeenCalledWith(1);
    expect(onEditar).toHaveBeenCalledWith(1);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it("superlínea y envase de sistema: muestran la marca y no se editan ni eliminan", () => {
    render(<TablaSuper superlineas={[deSistema]} {...acciones()} />);
    expect(screen.getByText("Sistema")).toBeInTheDocument();
    expect(screen.getByTitle("Editar")).toBeDisabled();
    expect(screen.getByTitle("Eliminar")).toBeDisabled();
    cleanup();

    render(<TablaEnvase envases={[deSistema]} {...acciones()} />);
    expect(screen.getByText("Sistema")).toBeInTheDocument();
    expect(screen.getByTitle("Editar")).toBeDisabled();
    expect(screen.getByTitle("Eliminar")).toBeDisabled();
  });

  it("línea: muestra la SuperLínea o un guion", () => {
    render(
      <TablaLinea
        lineas={[
          { ...base, superlineaDenominacion: "BEBIDAS" },
          { ...base, id: 9, superlinea: { id: 1, denominacion: "ALMACEN" } },
          { ...base, id: 10 },
        ]}
        {...acciones()}
      />,
    );
    expect(screen.getByText("BEBIDAS")).toBeInTheDocument();
    expect(screen.getByText("ALMACEN")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("marca de sistema no se elimina", () => {
    render(<TablaMarca marcas={[{ ...deSistema }]} {...acciones()} />);
    expect(screen.getByTitle("Eliminar")).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Tarjetas
// ---------------------------------------------------------------------------
describe("tarjetas de los catálogos", () => {
  it.each([
    ["marca", CardMarca as ComponentType<any>, "marca"],
    ["línea", CardLinea as ComponentType<any>, "linea"],
    ["envase", CardEnvase as ComponentType<any>, "envase"],
  ])("%s: muestra datos y acciones; eliminada no ofrece acciones", async (_n, Card, prop) => {
    const user = userEvent.setup();
    const { onEditar, onInfo, onDelete } = acciones();

    render(<Card {...{ [prop]: base }} onEditar={onEditar} onInfo={onInfo} onDelete={onDelete} />);
    expect(screen.getByText("ALGO")).toBeInTheDocument();
    expect(screen.getByText("una obs")).toBeInTheDocument();
    await user.click(screen.getByTitle("Ver información"));
    await user.click(screen.getByTitle("Editar"));
    await user.click(screen.getByTitle("Eliminar"));
    expect(onInfo).toHaveBeenCalledWith(1);
    expect(onEditar).toHaveBeenCalledWith(1);
    expect(onDelete).toHaveBeenCalledWith(1);
    cleanup();

    render(<Card {...{ [prop]: eliminado }} {...acciones()} />);
    expect(screen.getByText(/Eliminad[oa] el/)).toBeInTheDocument();
    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument();
    cleanup();

    render(<Card {...{ [prop]: deSistema }} {...acciones()} />);
    expect(screen.getByTitle("Eliminar")).toBeDisabled();
  });

  it("línea: muestra la SuperLínea", () => {
    render(<CardLinea linea={{ ...base, superlineaDenominacion: "BEBIDAS" }} {...acciones()} />);
    expect(screen.getByText("BEBIDAS")).toBeInTheDocument();
    cleanup();
    render(<CardLinea linea={{ ...base, superlinea: { id: 1, denominacion: "ALMACEN" } }} {...acciones()} />);
    expect(screen.getByText("ALMACEN")).toBeInTheDocument();
    cleanup();
    render(<CardLinea linea={{ ...base, observacion: "" }} {...acciones()} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Modales
// ---------------------------------------------------------------------------
describe("modales de los catálogos", () => {
  const casos: [string, ComponentType<any>, string, string][] = [
    ["marca", MarcaModal, "marca", "form marca"],
    ["línea", LineaModal, "linea", "form linea"],
    ["superlínea", SuperlineaModal, "superlinea", "form superlinea"],
    ["envase", EnvasePresentacionModal, "envase", "form envase"],
  ];

  it.each(casos)("%s: no renderiza cerrado y abre alta, edición y auditoría", async (_n, Modal, prop, textoForm) => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    const { container } = render(<Modal open={false} tipo="alta" onClose={onClose} onSuccess={onSuccess} />);
    expect(container).toBeEmptyDOMElement();
    cleanup();

    render(<Modal open tipo={null} onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.queryByText(/form /)).not.toBeInTheDocument();
    cleanup();

    render(<Modal open tipo="alta" onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.getByText(`${textoForm} alta`)).toBeInTheDocument();
    cleanup();

    render(<Modal open tipo="edicion" {...{ [prop]: base }} onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.getByText(`${textoForm} edición`)).toBeInTheDocument();
    cleanup();

    render(<Modal open tipo="auditoria" auditoria={{ id: 1 }} onClose={onClose} onSuccess={onSuccess} />);
    await user.click(screen.getByText("Cerrar"));
    expect(onClose).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Hooks de modal
// ---------------------------------------------------------------------------
describe("hooks de modal de los catálogos", () => {
  it.each([
    ["marca", useMarcaModal, "marca"],
    ["línea", useLineaModal, "linea"],
    ["superlínea", useSuperlineaModal, "superlinea"],
    ["envase", useEnvasePresentacionModal, "envase"],
  ])("%s: abre alta, edición y auditoría, y cierra", (_n, hook, prop) => {
    const { result } = renderHook(() => (hook as () => any)());
    expect(result.current.tipo).toBeNull();

    act(() => result.current.abrirAlta());
    expect(result.current.tipo).toBe("alta");

    act(() => result.current.abrirEdicion(base));
    expect(result.current.tipo).toBe("edicion");
    expect(result.current[prop]).toEqual(base);

    act(() => result.current.abrirAuditoria({ id: 7 }));
    expect(result.current.tipo).toBe("auditoria");
    expect(result.current.auditoria).toEqual({ id: 7 });
    expect(result.current[prop]).toBeNull();

    act(() => result.current.cerrar());
    expect(result.current.tipo).toBeNull();
    expect(result.current.auditoria).toBeNull();
  });
});
