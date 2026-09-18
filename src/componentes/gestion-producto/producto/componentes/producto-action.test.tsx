import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ConsultarProducto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { ProductoActions } from "./producto-action";

const producto = { id: 7, denominacion: "Yerba mate 1 kg" } as ConsultarProducto;

const acciones = () => ({
  onEditar: vi.fn(),
  onInfo: vi.fn(),
  onDelete: vi.fn(),
  onAjustarStock: vi.fn(),
});

describe("ProductoActions", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("abre el historial de precios del producto", async () => {
    const user = userEvent.setup();
    const onHistorial = vi.fn();

    render(<ProductoActions producto={producto} {...acciones()} onHistorial={onHistorial} />);

    await user.click(screen.getByRole("button", { name: "Historial de precios" }));

    expect(onHistorial).toHaveBeenCalledWith(7);
  });

  it("no ofrece el historial si la acción no está habilitada", () => {
    render(<ProductoActions producto={producto} {...acciones()} />);

    expect(screen.queryByRole("button", { name: "Historial de precios" })).not.toBeInTheDocument();
  });
});
