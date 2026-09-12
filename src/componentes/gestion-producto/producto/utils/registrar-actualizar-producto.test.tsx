import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductoService from "../services/producto-service";
import RegistrarActualizarProductoForm from "./registrar-actualizar-producto";

vi.mock("../services/producto-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
    obtenerTotales: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", () => ({ getUsuarioId: () => 7 }));

vi.mock("../../../sistema/ConfiguracionSistemaContext", () => ({
  useConfiguracionSistema: () => ({ configuracion: null }),
}));

vi.mock("../../../herramientas/formateo-de-campos/movimiento-campos", () => ({
  useEnterFocus: () => vi.fn(),
}));

vi.mock("../../../herramientas/formateo-de-campos/form-input", () => ({
  default: ({ name, label, disabled }: { name: string; label: string; disabled?: boolean }) => {
    const { register } = useFormContext();
    return (
      <label>
        {label}
        <input aria-label={label} disabled={disabled} {...register(name)} />
      </label>
    );
  },
}));

vi.mock("../../../herramientas/formateo-de-campos/price-input", () => ({
  default: ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
    <label>
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  ),
}));

vi.mock("../../../herramientas/formateo-de-campos/porcentaje-input", () => ({
  default: ({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) => (
    <label>
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  ),
}));

vi.mock("../componentes/configuracion/lineas-selector", () => ({
  default: ({ onLineaChange }: { onLineaChange: (linea: { id: number }) => void }) => (
    <button type="button" onClick={() => onLineaChange({ id: 1 })}>Seleccionar línea</button>
  ),
}));

vi.mock("../componentes/configuracion/marcas-selector", () => ({
  default: ({ onChangeMarca }: { onChangeMarca: (marca: { id: number }) => void }) => (
    <button type="button" onClick={() => onChangeMarca({ id: 2 })}>Seleccionar marca</button>
  ),
}));

vi.mock("../../../ui/encabezadoFormularios", () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("react-select", () => ({ default: () => <div /> }));

describe("RegistrarActualizarProductoForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("envía costo y margen, pero no el precio derivado", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(ProductoService.nuevo).mockResolvedValue({ mensaje: "Producto creado" });

    render(<RegistrarActualizarProductoForm onClose={onClose} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Denominación"), "Producto de prueba");
    await user.clear(screen.getByLabelText("Costo"));
    await user.type(screen.getByLabelText("Costo"), "100");
    await user.clear(screen.getByLabelText("Margen particular"));
    await user.type(screen.getByLabelText("Margen particular"), "20");
    await user.click(screen.getByRole("button", { name: "Seleccionar línea" }));
    await user.click(screen.getByRole("button", { name: "Seleccionar marca" }));

    expect(screen.getByText("$120,00")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(ProductoService.nuevo).toHaveBeenCalledWith(
      expect.objectContaining({
        denominacion: "producto de prueba",
        costo: 100,
        margen: 20,
        lineaId: 1,
        marcaId: 2,
        usuarioCreatedId: 7,
      }),
    );
    expect(ProductoService.nuevo.mock.calls[0][0]).not.toHaveProperty("precio");
    expect(onSuccess).toHaveBeenCalledWith("Producto creado");
    expect(onClose).toHaveBeenCalled();
  });
});
