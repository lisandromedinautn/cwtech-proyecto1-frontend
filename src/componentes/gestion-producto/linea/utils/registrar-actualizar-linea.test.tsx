import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmacion = vi.hoisted(() => ({ respuesta: true }));

vi.mock("../services/linea-service", () => ({ default: { nuevo: vi.fn(), actualizar: vi.fn() } }));
vi.mock("../../../../utils/auth", () => ({ getUsuarioId: () => 7 }));
vi.mock("../../../herramientas/formateo-de-campos/form-input", () => ({
  default: function MockFormInput({ name, label }: { name: string; label: string }) {
    const { register, formState: { errors } } = useFormContext();
    return (
      <label>
        {label}
        <input aria-label={label} {...register(name)} />
        {errors[name]?.message && <span>{String(errors[name].message)}</span>}
      </label>
    );
  },
}));
vi.mock("../../../herramientas/formateo-de-campos/cantidades-input", () => ({
  default: ({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) => (
    <label>
      {label}
      <input aria-label={label} disabled={disabled} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  ),
}));
vi.mock("../../superlinea/componentes/superlineas-selector", () => ({
  default: function MockSuper() {
    const { setValue, formState: { errors } } = useFormContext();
    return (
      <div>
        <button type="button" onClick={() => setValue("superlineaId", 3)}>Elegir superlínea</button>
        {errors.superlineaId?.message && <span>{String(errors.superlineaId.message)}</span>}
      </div>
    );
  },
}));
vi.mock("../../../ui/encabezadoFormularios", () => ({
  default: ({ title, onClose }: { title: string; onClose: () => void }) => (
    <div>
      <h1>{title}</h1>
      <button onClick={onClose}>Cerrar formulario</button>
    </div>
  ),
}));
vi.mock("../../../herramientas/alertas/alertas-confirmacion", () => ({
  TipoAlertaConfirmacion: { DEFAULT: "default" },
  TituloAlertaConfirmacion: { DEFAULT: "Confirmación" },
  useConfirmation: () => ({
    showConfirmation: () => Promise.resolve(confirmacion.respuesta),
    AlertasConfirmacion: () => null,
  }),
}));

import LineaService from "../services/linea-service";
import RegistrarActualizarLineaForm from "./registrar-actualizar-linea";
import { schema, transformData } from "../interfaces/interfaces-validaciones-linea";

const linea = { id: 8, denominacion: "gaseosas", observacion: "obs", stockMinimo: 5, utilizaStockMinimo: true, superlineaId: 2, sistema: 0 } as never;

describe("RegistrarActualizarLineaForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    confirmacion.respuesta = true;
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("alta: exige la SuperLínea y luego envía con usuarioCreatedId", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(LineaService.nuevo).mockResolvedValue({ mensaje: "Línea creada" });

    render(<RegistrarActualizarLineaForm onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.getByText("Registrar Línea")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Denominación"), "Gaseosas");
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(await screen.findByText("La SuperLínea es obligatoria.")).toBeInTheDocument();
    expect(LineaService.nuevo).not.toHaveBeenCalled();

    await user.click(screen.getByText("Elegir superlínea"));
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(LineaService.nuevo).toHaveBeenCalledWith(expect.objectContaining({ denominacion: "gaseosas", superlineaId: 3, usuarioCreatedId: 7, stockMinimo: 0 }));
    expect(onClose).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith("Línea creada");
  });

  it("stock crítico: se habilita con el check y debe ser mayor a 0", async () => {
    const user = userEvent.setup();
    render(<RegistrarActualizarLineaForm onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByLabelText("Stock Crítico")).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByLabelText("Stock Crítico")).toBeEnabled();

    await user.type(screen.getByLabelText("Denominación"), "Gaseosas");
    await user.click(screen.getByText("Elegir superlínea"));
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(LineaService.nuevo).not.toHaveBeenCalled();
  });

  it("edición: precarga y envía usuarioUpdatedId", async () => {
    const user = userEvent.setup();
    vi.mocked(LineaService.actualizar).mockResolvedValue({ mensaje: "Línea editada" });

    render(<RegistrarActualizarLineaForm linea={linea} onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText("Actualizar Línea")).toBeInTheDocument();
    expect(screen.getByLabelText("Denominación")).toHaveValue("gaseosas");

    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(LineaService.actualizar).toHaveBeenCalledWith(8, expect.objectContaining({ denominacion: "gaseosas", superlineaId: 2, usuarioUpdatedId: 7 }));
  });

  it("muestra el error del backend", async () => {
    const user = userEvent.setup();
    vi.mocked(LineaService.actualizar).mockRejectedValue({
      response: { status: 409, data: { statusCode: 409, code: "CONFLICTO", message: "En uso." } },
    });

    render(<RegistrarActualizarLineaForm linea={linea} onClose={vi.fn()} onSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(await screen.findByText(/En uso|modificado por otra operación/)).toBeInTheDocument();
  });

  it("cerrar pide confirmación", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RegistrarActualizarLineaForm onClose={onClose} onSuccess={vi.fn()} />);

    confirmacion.respuesta = false;
    await user.click(screen.getByText("Cerrar formulario"));
    expect(onClose).not.toHaveBeenCalled();
    confirmacion.respuesta = true;
    await user.click(screen.getByText("Cerrar formulario"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("una línea de sistema deshabilita el formulario", () => {
    const { container } = render(<RegistrarActualizarLineaForm linea={{ ...(linea as object), sistema: 1 } as never} onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(container.querySelector("fieldset")).toBeDisabled();
  });
});

describe("esquema y transformación de línea", () => {
  it("valida denominación y stock mínimo condicional", async () => {
    await expect(schema(false).validate({ denominacion: "Ok 1", superlineaId: 1 })).resolves.toMatchObject({ denominacion: "ok 1" });
    await expect(schema(true).validate({ denominacion: "ok", superlineaId: 1, stockMinimo: 0 })).rejects.toThrow("mayor a 0");
    await expect(schema(false).validate({ denominacion: "a-b", superlineaId: 1 })).rejects.toThrow("Solo se permiten");
    await expect(schema(false).validate({ denominacion: "ok" })).rejects.toThrow("La SuperLínea es obligatoria.");
    expect(transformData({ denominacion: "x", superlineaId: 4 } as never)).toEqual({
      denominacion: "x",
      observacion: null,
      stockMinimo: 0,
      utilizaStockMinimo: false,
      superlineaId: 4,
    });
  });
});
