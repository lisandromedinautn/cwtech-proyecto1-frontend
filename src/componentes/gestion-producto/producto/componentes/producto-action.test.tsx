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

  it("ofrece todas las acciones para un producto activo", () => {
    render(<ProductoActions producto={producto} {...acciones()} onHistorial={vi.fn()} />);

    expect(screen.getAllByRole("button").map((boton) => boton.getAttribute("title"))).toEqual([
      "Ver información",
      "Historial de precios",
      "Ajustar stock",
      "Editar producto",
      "Eliminar producto",
    ]);
  });

  it("para un producto eliminado solo deja ver su información", async () => {
    const user = userEvent.setup();
    const handlers = acciones();

    render(
      <ProductoActions producto={{ ...producto, eliminado: true }} {...handlers} onHistorial={vi.fn()} />,
    );

    expect(screen.getAllByRole("button").map((boton) => boton.getAttribute("title"))).toEqual([
      "Ver información",
    ]);
    await user.click(screen.getByRole("button", { name: "Ver información" }));
    expect(handlers.onInfo).toHaveBeenCalledWith(7);
  });
});
