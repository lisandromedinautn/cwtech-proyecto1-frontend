import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TablaAGGridMock } from "../../../../test/mock-tabla";
import { Rol } from "../../../../interfaces/generales/interfaces-generales";

vi.mock("../../../herramientas/tablas/tabla-flexible-ag-grid", () => ({ TablaAGGrid: TablaAGGridMock }));
vi.mock("../../../herramientas/reutilizables/impresion-form", () => ({
  ImpresionForm: ({ onImprimirTodo, onImprimirPagina }: { onImprimirTodo: () => void; onImprimirPagina: () => void }) => (
    <div>
      <button onClick={onImprimirTodo}>Imprimir todo</button>
      <button onClick={onImprimirPagina}>Imprimir página</button>
    </div>
  ),
}));

import { ProductosHeader } from "./header-producto";
import { ProductosHeaderLg } from "./header-producto-lg";
import { DatosTabla } from "./datos-tabla";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const props = () => ({
  roles: [Rol.ADMINISTRADOR],
  codigo: "AB",
  exacto: false,
  mostrarEliminados: false,
  onChangeCodigo: vi.fn(),
  onChangeExacto: vi.fn(),
  onChangeMostrarEliminados: vi.fn(),
  onBuscarRapido: vi.fn(),
  onNuevo: vi.fn(),
  total: 40,
  mostrados: 10,
  paginaActual: 1,
  onImprimirTodo: vi.fn(),
  onImprimirPagina: vi.fn(),
});

describe.each([
  ["encabezado de escritorio", ProductosHeader],
  ["encabezado de celular", ProductosHeaderLg],
])("%s de productos", (_nombre, Header) => {
  it("muestra el título, los totales y el buscador por código", async () => {
    const p = props();
    render(<Header {...p} />);

    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByDisplayValue("AB")).toBeInTheDocument();
    if (Header === ProductosHeader) {
      expect(screen.getByText("40")).toBeInTheDocument();
    }

    fireEvent.change(screen.getByPlaceholderText("Código..."), { target: { value: "ABC" } });
    expect(p.onChangeCodigo).toHaveBeenCalledWith("ABC");
  });

  it("permite cambiar Exacto y Mostrar eliminados", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<Header {...p} />);

    await user.click(screen.getByRole("checkbox", { name: /Exacto/ }));
    expect(p.onChangeExacto).toHaveBeenCalledWith(true);

    const otros = screen.getAllByRole("checkbox").filter((c) => !/Exacto/.test(c.parentElement?.textContent ?? ""));
    await user.click(otros[0]);
    expect(p.onChangeMostrarEliminados).toHaveBeenCalledWith(true);
  });

  it("el botón de alta solo aparece para quien puede agregar", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<Header {...p} />);

    const alta = screen.getAllByRole("button").find((b) => /Añadir/.test(b.textContent ?? "") || b.querySelector("svg"))!;
    await user.click(alta);
    expect(p.onNuevo).toHaveBeenCalled();
    cleanup();

    const sinPermiso = props();
    render(<Header {...sinPermiso} roles={[Rol.VENDEDOR]} />);
    expect(screen.queryByText("Añadir")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(Header === ProductosHeader ? 2 : 0);
  });
});

describe("encabezado de escritorio: impresión y Enter", () => {
  it("imprime todo y la página", async () => {
    const user = userEvent.setup();
    const p = props();
    render(<ProductosHeader {...p} />);
    await user.click(screen.getByText("Imprimir todo"));
    await user.click(screen.getByText("Imprimir página"));
    expect(p.onImprimirTodo).toHaveBeenCalled();
    expect(p.onImprimirPagina).toHaveBeenCalled();
  });
});

describe("encabezado de celular: Enter dispara la búsqueda rápida", () => {
  it("con Enter busca; con otra tecla no", () => {
    const p = props();
    render(<ProductosHeaderLg {...p} />);
    const input = screen.getByPlaceholderText("Código...");
    fireEvent.keyDown(input, { key: "a" });
    expect(p.onBuscarRapido).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(p.onBuscarRapido).toHaveBeenCalledTimes(1);
  });
});

describe("DatosTabla de productos", () => {
  const productos = [{ id: 1, denominacion: "ACEITE", stock: 3 }] as never[];
  const columns = [{ header: "Denominación", accessor: "denominacion" }] as never[];
  const handlers = () => ({
    onEditar: vi.fn(),
    onInfo: vi.fn(),
    onDelete: vi.fn(),
    onAjustarStock: vi.fn(),
    onHistorial: vi.fn(),
  });

  it("muestra las filas y, si puede accionar, las acciones del producto", () => {
    render(<DatosTabla productos={productos} columns={columns} puedeAccionar {...handlers()} />);
    expect(screen.getByText("ACEITE")).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("sin permiso no ofrece acciones", () => {
    render(<DatosTabla productos={productos} columns={columns} puedeAccionar={false} {...handlers()} />);
    expect(screen.getByText("ACEITE")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
