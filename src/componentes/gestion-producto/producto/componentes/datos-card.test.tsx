import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatosCard } from "./datos-card";
import type { ConsultarProducto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";

const producto = (presentacion: ConsultarProducto["presentacion"]) =>
  ({
    id: 1,
    denominacion: "ACEITE GIRASOL NATURA",
    codigoProveedor: "ac-900",
    stock: 5,
    precioOcasionalConIva: 0,
    precioClienteConIva: 0,
    precioMayoristaConIva: 0,
    precioOfertaConIva: 0,
    observacion: "",
    presentacion,
  }) as unknown as ConsultarProducto;

const acciones = {
  onEditar: vi.fn(),
  onInfo: vi.fn(),
  onDelete: vi.fn(),
  onMovimientos: vi.fn(),
  onCambioPrecios: vi.fn(),
};

describe("DatosCard de producto — presentación", () => {
  afterEach(cleanup);

  it("muestra el texto de la presentación", () => {
    render(
      <DatosCard
        producto={producto({
          envase: { id: 3, denominacion: "BOTELLA" },
          contenido: { cantidad: 900, unidad: "ml" },
          texto: "BOTELLA 900 ml",
        })}
        {...acciones}
      />,
    );

    expect(screen.getByText("Presentación")).toBeInTheDocument();
    expect(screen.getByText("BOTELLA 900 ml")).toBeInTheDocument();
  });

  it("muestra un guion si el producto no tiene presentación", () => {
    render(<DatosCard producto={producto(null)} {...acciones} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
