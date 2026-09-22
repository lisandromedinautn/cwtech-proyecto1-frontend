import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProductoService from "../services/producto-service";
import RegistrarActualizarProductoForm from "./registrar-actualizar-producto";
import type { Producto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";

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
  default: function MockFormInput({ name, label, disabled }: { name: string; label: string; disabled?: boolean }) {
    const { register, formState: { errors } } = useFormContext();
    return (
      <label>
        {label}
        <input aria-label={label} disabled={disabled} {...register(name)} />
        {errors[name]?.message && <span>{String(errors[name].message)}</span>}
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

// El selector de envase usa EntidadSelectorBase (react-select). El valor y la
// unidad de la presentación se prueban con los componentes reales.
vi.mock("../../../herramientas/reutilizables/entidad-selector-base", () => ({
  default: ({
    titulo,
    error,
    onChange,
    onAgregar,
  }: {
    titulo: string;
    error?: string;
    onChange?: (entidad: { id: number; denominacion: string }) => void;
    onAgregar: () => void;
  }) => (
    <div>
      <button type="button" onClick={() => onChange?.({ id: 3, denominacion: "BOTELLA" })}>
        Seleccionar {titulo}
      </button>
      <button type="button" onClick={onAgregar}>
        Agregar {titulo}
      </button>
      {error && <span>{error}</span>}
    </div>
  ),
}));

vi.mock("../../envase-presentacion/services/envase-presentacion-service", () => ({
  default: { obtenerSelect: vi.fn().mockResolvedValue({ data: [], total: 0 }) },
}));

const completarDatosBasicos = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText("Denominación"), "Producto de prueba");
  await user.clear(screen.getByLabelText("Costo"));
  await user.type(screen.getByLabelText("Costo"), "100");
  await user.click(screen.getByRole("button", { name: "Seleccionar línea" }));
  await user.click(screen.getByRole("button", { name: "Seleccionar marca" }));
};

const completarPresentacion = async (
  user: ReturnType<typeof userEvent.setup>,
  valor = "1.5",
  unidad = "L",
) => {
  await user.click(screen.getByRole("button", { name: "Seleccionar Envase" }));
  await user.type(screen.getByLabelText("Valor"), valor);
  await user.selectOptions(screen.getByLabelText("Unidad de medida"), unidad);
};

const productoExistente = (presentacion: Producto["presentacion"]): Producto =>
  ({
    id: 10,
    denominacion: "ACEITE GIRASOL NATURA",
    observacion: null,
    codigoProveedor: "ac-900",
    codigoReferencia: "",
    codigoBarra: null,
    stock: 5,
    costo: 100,
    margen: 15,
    alicuotaIva: 21,
    linea: { id: 1, denominacion: "ACEITES" },
    marca: { id: 2, denominacion: "NATURA" },
    sistema: 0,
    stockMinimo: 0,
    cantidadPorPack: 0,
    utilizaStockMinimo: false,
    utilizaPack: false,
    presentacion,
  }) as unknown as Producto;

describe("RegistrarActualizarProductoForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
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
    await completarPresentacion(user);

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
    expect(ProductoService.nuevo.mock.calls[0][0]).not.toHaveProperty("stock");
    expect(onSuccess).toHaveBeenCalledWith("Producto creado");
    expect(onClose).toHaveBeenCalled();
  });

  it("mapea un detalle 400 del backend al campo del formulario", async () => {
    const user = userEvent.setup();
    vi.mocked(ProductoService.nuevo).mockRejectedValue({
      response: {
        status: 400,
        data: {
          statusCode: 400,
          code: "VALIDACION_DTO",
          details: [{ field: "denominacion", reason: "La denominación ya existe." }],
        },
      },
    });

    render(<RegistrarActualizarProductoForm onClose={vi.fn()} onSuccess={vi.fn()} />);

    await completarDatosBasicos(user);
    await completarPresentacion(user);
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText("La denominación ya existe.")).toBeInTheDocument();
  });

  describe("presentación (CR-002)", () => {
    it("en el alta envía la presentación anidada, con números", async () => {
      const user = userEvent.setup();
      vi.mocked(ProductoService.nuevo).mockResolvedValue({ mensaje: "Producto creado" });

      render(<RegistrarActualizarProductoForm onClose={vi.fn()} onSuccess={vi.fn()} />);

      expect(screen.getByText("(obligatoria)")).toBeInTheDocument();
      await completarDatosBasicos(user);
      await completarPresentacion(user, "1.5", "L");
      await user.click(screen.getByRole("button", { name: "Registrar" }));

      const payload = vi.mocked(ProductoService.nuevo).mock.calls[0][0];
      expect(payload.presentacion).toStrictEqual({ envaseId: 3, cantidad: 1.5, unidad: "L" });
    });

    it("en el alta no envía el producto si falta la presentación", async () => {
      const user = userEvent.setup();

      render(<RegistrarActualizarProductoForm onClose={vi.fn()} onSuccess={vi.fn()} />);

      await completarDatosBasicos(user);
      await user.click(screen.getByRole("button", { name: "Registrar" }));

      expect(await screen.findByText("Seleccioná un envase.")).toBeInTheDocument();
      expect(screen.getByText("Ingresá el valor.")).toBeInTheDocument();
      expect(screen.getByText("Seleccioná la unidad de medida.")).toBeInTheDocument();
      expect(ProductoService.nuevo).not.toHaveBeenCalled();
    });

    it("no acepta separador de miles ni más de 2 decimales en el valor", async () => {
      const user = userEvent.setup();

      render(<RegistrarActualizarProductoForm onClose={vi.fn()} onSuccess={vi.fn()} />);

      await user.type(screen.getByLabelText("Valor"), "1.255");

      expect(screen.getByLabelText("Valor")).toHaveValue("1.25");
    });

    it("muestra junto a la presentación el mensaje de una regla del backend", async () => {
      const user = userEvent.setup();
      vi.mocked(ProductoService.nuevo).mockRejectedValue({
        response: {
          status: 400,
          data: {
            statusCode: 400,
            code: "PRESENTACION_INVALIDA",
            message: "Los ml no admiten decimales.",
          },
        },
      });

      render(<RegistrarActualizarProductoForm onClose={vi.fn()} onSuccess={vi.fn()} />);

      await completarDatosBasicos(user);
      await completarPresentacion(user, "2.5", "ml");
      await user.click(screen.getByRole("button", { name: "Registrar" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("Los ml no admiten decimales.");
    });

    it("asigna al campo el error de validación de un campo de la presentación", async () => {
      const user = userEvent.setup();
      vi.mocked(ProductoService.nuevo).mockRejectedValue({
        response: {
          status: 400,
          data: {
            statusCode: 400,
            code: "VALIDACION_DTO",
            details: [
              { field: "presentacion.cantidad", reason: "La cantidad de la presentación debe ser un número." },
            ],
          },
        },
      });

      render(<RegistrarActualizarProductoForm onClose={vi.fn()} onSuccess={vi.fn()} />);

      await completarDatosBasicos(user);
      await completarPresentacion(user);
      await user.click(screen.getByRole("button", { name: "Registrar" }));

      expect(
        await screen.findByText("La cantidad de la presentación debe ser un número."),
      ).toBeInTheDocument();
    });

    it("en la edición precarga la presentación y la envía al actualizar", async () => {
      const user = userEvent.setup();
      vi.mocked(ProductoService.actualizar).mockResolvedValue({ mensaje: "Producto editado" });

      render(
        <RegistrarActualizarProductoForm
          producto={productoExistente({
            envase: { id: 3, denominacion: "BOTELLA" },
            contenido: { cantidad: 900, unidad: "ml" },
            texto: "BOTELLA 900 ml",
          })}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      expect(screen.getByText("(obligatoria)")).toBeInTheDocument();
      expect(screen.getByLabelText("Valor")).toHaveValue("900");
      expect(screen.getByLabelText("Unidad de medida")).toHaveValue("ml");

      await user.clear(screen.getByLabelText("Valor"));
      await user.type(screen.getByLabelText("Valor"), "1");
      await user.selectOptions(screen.getByLabelText("Unidad de medida"), "L");
      await user.click(screen.getByRole("button", { name: "Actualizar" }));

      expect(ProductoService.actualizar).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          presentacion: { envaseId: 3, cantidad: 1, unidad: "L" },
          usuarioUpdatedId: 7,
        }),
      );
    });

    it("en la edición no deja vaciar una presentación cargada", async () => {
      const user = userEvent.setup();

      render(
        <RegistrarActualizarProductoForm
          producto={productoExistente({
            envase: { id: 3, denominacion: "BOTELLA" },
            contenido: { cantidad: 900, unidad: "ml" },
            texto: "BOTELLA 900 ml",
          })}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      await user.clear(screen.getByLabelText("Valor"));
      await user.click(screen.getByRole("button", { name: "Actualizar" }));

      expect(await screen.findByText("Ingresá el valor.")).toBeInTheDocument();
      expect(ProductoService.actualizar).not.toHaveBeenCalled();
    });

    it("en la edición de un producto sin presentación no la exige ni la envía", async () => {
      const user = userEvent.setup();
      vi.mocked(ProductoService.actualizar).mockResolvedValue({ mensaje: "Producto editado" });

      render(
        <RegistrarActualizarProductoForm
          producto={productoExistente(null)}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      expect(screen.getByText("(opcional para productos anteriores)")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Actualizar" }));

      expect(ProductoService.actualizar).toHaveBeenCalledTimes(1);
      expect(vi.mocked(ProductoService.actualizar).mock.calls[0][1]).not.toHaveProperty("presentacion");
    });

    it("en un producto sin presentación, si se completa un campo exige los tres", async () => {
      const user = userEvent.setup();

      render(
        <RegistrarActualizarProductoForm
          producto={productoExistente(null)}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      await user.type(screen.getByLabelText("Valor"), "500");
      await user.click(screen.getByRole("button", { name: "Actualizar" }));

      expect(await screen.findByText("Seleccioná un envase.")).toBeInTheDocument();
      expect(screen.getByText("Seleccioná la unidad de medida.")).toBeInTheDocument();
      expect(ProductoService.actualizar).not.toHaveBeenCalled();
    });
  });
});
