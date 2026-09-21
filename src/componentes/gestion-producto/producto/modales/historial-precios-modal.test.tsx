import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HistorialPreciosPaginado } from "../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";
import { formatFechaHora } from "../../../herramientas/formateo-de-campos/fucion-formateo";
import ProductoService from "../services/producto-service";
import HistorialPreciosModal from "./historial-precios-modal";

vi.mock("../services/producto-service", () => ({
  default: {
    obtenerHistorialPrecios: vi.fn(),
  },
}));

const producto = { id: 3, denominacion: "Yerba mate 1 kg" };

const cambio = (
  id: number,
  precioAnterior: number,
  precioNuevo: number,
  motivo: string,
  fecha: string,
) => ({ id, productoId: producto.id, precioAnterior, precioNuevo, motivo, fecha, usuarioId: 1 });

function respuestaPendiente() {
  let resolver!: (respuesta: HistorialPreciosPaginado) => void;
  const promesa = new Promise<HistorialPreciosPaginado>((resolve) => {
    resolver = resolve;
  });
  return { promesa, resolver };
}

describe("HistorialPreciosModal", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("muestra los cambios confirmados por el backend con precio anterior, nuevo, fecha y motivo", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const pendiente = respuestaPendiente();
    vi.mocked(ProductoService.obtenerHistorialPrecios).mockReturnValue(pendiente.promesa);

    render(<HistorialPreciosModal producto={producto} onClose={onClose} />);

    expect(screen.getByRole("status")).toHaveTextContent("Cargando historial de precios...");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(ProductoService.obtenerHistorialPrecios).toHaveBeenCalledWith(3, 0, 10);

    await act(async () => {
      pendiente.resolver({
        data: [
          cambio(2, 1200, 1500.5, "Aumento de costo del proveedor", "2026-09-17T15:30:00.000Z"),
          cambio(1, 1000, 1200, "Actualización de lista", "2026-09-10T12:00:00.000Z"),
        ],
        total: 2,
      });
    });

    const tabla = screen.getByRole("table");
    expect(within(tabla).getAllByRole("columnheader").map((th) => th.textContent)).toEqual([
      "Fecha",
      "Precio anterior",
      "Precio nuevo",
      "Motivo",
    ]);
    const [, masReciente, anterior] = within(tabla).getAllByRole("row");
    expect(within(masReciente).getAllByRole("cell").map((td) => td.textContent)).toEqual([
      formatFechaHora("2026-09-17T15:30:00.000Z"),
      "$ 1.200,00",
      "$ 1.500,50",
      "Aumento de costo del proveedor",
    ]);
    expect(within(anterior).getAllByRole("cell").map((td) => td.textContent)).toEqual([
      formatFechaHora("2026-09-10T12:00:00.000Z"),
      "$ 1.000,00",
      "$ 1.200,00",
      "Actualización de lista",
    ]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("informa cuando el producto todavía no tiene cambios de precio", async () => {
    vi.mocked(ProductoService.obtenerHistorialPrecios).mockResolvedValue({ data: [], total: 0 });

    render(<HistorialPreciosModal producto={producto} onClose={vi.fn()} />);

    expect(
      await screen.findByText("Este producto todavía no tiene cambios de precio registrados."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("muestra el error del backend sin datos y permite reintentar", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.obtenerHistorialPrecios)
      .mockRejectedValueOnce({
        response: {
          status: 404,
          data: { statusCode: 404, code: "NO_ENCONTRADO", message: "Producto con ID 3 no encontrado." },
        },
      })
      .mockResolvedValueOnce({
        data: [cambio(1, 1000, 1200, "Actualización de lista", "2026-09-10T12:00:00.000Z")],
        total: 1,
      });

    render(<HistorialPreciosModal producto={producto} onClose={vi.fn()} />);

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("No se pudo cargar el historial de precios.");
    expect(alerta).toHaveTextContent("El recurso ya no existe. Actualizá la lista.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    await user.click(within(alerta).getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(ProductoService.obtenerHistorialPrecios).toHaveBeenCalledTimes(2);
  });

  it("pide la página elegida sin mostrar los datos de la anterior mientras carga", async () => {
    const user = userEvent.setup();
    const primeraPagina = Array.from({ length: 10 }, (_, i) =>
      cambio(25 - i, 100 + i, 200 + i, `Cambio ${25 - i}`, "2026-09-17T12:00:00.000Z"),
    );
    const segundaPagina = respuestaPendiente();
    vi.mocked(ProductoService.obtenerHistorialPrecios)
      .mockResolvedValueOnce({ data: primeraPagina, total: 25 })
      .mockReturnValueOnce(segundaPagina.promesa);

    render(<HistorialPreciosModal producto={producto} onClose={vi.fn()} />);

    expect(await screen.findByText("Cambio 25")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "2" }));

    expect(ProductoService.obtenerHistorialPrecios).toHaveBeenLastCalledWith(3, 10, 10);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("Cambio 25")).not.toBeInTheDocument();

    await act(async () => {
      segundaPagina.resolver({
        data: [cambio(15, 90, 95, "Cambio 15", "2026-09-01T12:00:00.000Z")],
        total: 25,
      });
    });

    expect(screen.getByText("Cambio 15")).toBeInTheDocument();
  });
});
