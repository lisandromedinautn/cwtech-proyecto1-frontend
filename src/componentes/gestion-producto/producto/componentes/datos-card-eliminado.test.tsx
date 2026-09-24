import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConsultarProducto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { DatosCard } from "./datos-card";

const producto = {
  id: 7,
  denominacion: "MARGARINA 500G",
  codigoProveedor: "MAR-001",
  stock: 40,
  presentacion: null,
} as ConsultarProducto;

const handlers = () => ({
  onEditar: vi.fn(),
  onInfo: vi.fn(),
  onDelete: vi.fn(),
  onMovimientos: vi.fn(),
  onCambioPrecios: vi.fn(),
  onHistorial: vi.fn(),
  onNotificar: vi.fn(),
  onAjustarStock: vi.fn(),
});

describe("DatosCard con productos eliminados", () => {
  afterEach(() => {
    cleanup();
  });

  it("un producto activo no muestra la marca de eliminado", () => {
    render(<DatosCard producto={producto} {...handlers()} />);

    expect(screen.queryByText("Eliminado")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ajustar stock" })).toBeInTheDocument();
  });

  it("un producto eliminado se marca y solo deja ver su información", () => {
    render(<DatosCard producto={{ ...producto, eliminado: true }} {...handlers()} />);

    expect(screen.getByText("Eliminado")).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((boton) => boton.getAttribute("title"))).toEqual([
      "Ver información",
    ]);
  });
});
