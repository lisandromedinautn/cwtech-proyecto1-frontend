import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProductoService from "../services/producto-service";
import AjustarStockManualModal from "./ajustar-stock-manual-modal";

vi.mock("../services/producto-service", () => ({
  default: {
    ajustarStockManual: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", () => ({ getUsuarioId: () => 7 }));

describe("AjustarStockManualModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("envía una variación y motivo mediante el caso de uso de ajuste manual", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(ProductoService.ajustarStockManual).mockResolvedValue({
      message: 'Stock ajustado para "Producto de prueba"',
      stockActual: 12,
    });

    render(
      <AjustarStockManualModal
        producto={{ id: 3, denominacion: "Producto de prueba", stock: 10 } as any}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    await user.type(screen.getByLabelText("Variación de stock"), "2");
    await user.type(screen.getByLabelText("Motivo"), "Recuento de inventario");
    await user.click(screen.getByRole("button", { name: "Confirmar ajuste" }));

    expect(ProductoService.ajustarStockManual).toHaveBeenCalledWith(3, {
      cantidad: 2,
      motivo: "Recuento de inventario",
      usuarioId: 7,
    });
    expect(onSuccess).toHaveBeenCalledWith(
      'Stock ajustado para "Producto de prueba"',
    );
  });

  it("muestra el conflicto informado por el backend", async () => {
    const user = userEvent.setup();
    const onNotify = vi.fn();
    vi.mocked(ProductoService.ajustarStockManual).mockRejectedValue({
      response: {
        status: 409,
        data: { statusCode: 409, code: "STOCK_NEGATIVO", message: "El stock no puede quedar negativo" },
      },
    });

    render(
      <AjustarStockManualModal
        producto={{ id: 3, denominacion: "Producto de prueba", stock: 10 } as any}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onNotify={onNotify}
      />,
    );

    await user.type(screen.getByLabelText("Variación de stock"), "-20");
    await user.type(screen.getByLabelText("Motivo"), "Recuento de inventario");
    await user.click(screen.getByRole("button", { name: "Confirmar ajuste" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No hay stock suficiente para este ajuste.",
    );
    expect(onNotify).toHaveBeenCalledWith({
      type: "error",
      title: "Conflicto",
      message: "No hay stock suficiente para este ajuste.",
    });
  });
});
