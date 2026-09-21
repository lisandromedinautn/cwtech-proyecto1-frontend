import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductoService from "../services/producto-service";
import { ProductosModales } from "./producto-modales";

vi.mock("../services/producto-service", () => ({
  default: {
    obtenerHistorialPrecios: vi.fn(),
  },
}));

const props = (mostrarHistorialPrecios: boolean) => ({
  isAltaOpen: false,
  mostrarActualizarProducto: false,
  mostrarInfoAuditoria: false,
  mostrarMovimientosStock: false,
  mostrarHistorialPrecios,
  mostrarCambioPrecios: false,
  mostrarProductosAlternativos: false,
  mostrarDeQuienEsAlternativo: false,
  mostrarAjusteStock: false,
  productoSeleccionado: null,
  productoHistorial: { id: 3, denominacion: "Yerba mate 1 kg" },
  productoInfo: null,
  auditoria: null,
  onCloseAlta: vi.fn(),
  onCloseActualizar: vi.fn(),
  onCloseAuditoria: vi.fn(),
  onCloseMovimientosStock: vi.fn(),
  onCloseHistorialPrecios: vi.fn(),
  onCloseCambioPrecios: vi.fn(),
  onCloseProductosAlternativos: vi.fn(),
  onCloseDeQuienEsAlternativo: vi.fn(),
  onCloseAjusteStock: vi.fn(),
  onSuccessAlta: vi.fn(),
  onSuccessActualizar: vi.fn(),
  onSuccessAjusteStock: vi.fn(),
  onRefetch: vi.fn(),
  onNotify: vi.fn(),
});

describe("ProductosModales — historial de precios", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("abre el historial del producto elegido y lo consulta al backend", async () => {
    vi.mocked(ProductoService.obtenerHistorialPrecios).mockResolvedValue({ data: [], total: 0 });

    render(<ProductosModales {...props(true)} />);

    expect(screen.getByRole("dialog", { name: "Historial de precios" })).toHaveTextContent(
      "Yerba mate 1 kg",
    );
    expect(ProductoService.obtenerHistorialPrecios).toHaveBeenCalledWith(3, 0, 10);
    expect(
      await screen.findByText("Este producto todavía no tiene cambios de precio registrados."),
    ).toBeInTheDocument();
  });

  it("no muestra el historial mientras está cerrado", () => {
    render(<ProductosModales {...props(false)} />);

    expect(screen.queryByRole("dialog", { name: "Historial de precios" })).not.toBeInTheDocument();
    expect(ProductoService.obtenerHistorialPrecios).not.toHaveBeenCalled();
  });
});
