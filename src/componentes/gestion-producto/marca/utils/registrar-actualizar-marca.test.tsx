import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const confirmacion = vi.hoisted(() => ({ respuesta: true }));

vi.mock("../services/marca-service", () => ({ default: { nuevo: vi.fn(), actualizar: vi.fn() } }));
vi.mock("../../../../utils/auth", () => ({ getUsuarioId: () => 7 }));
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

import MarcaService from "../services/marca-service";
import RegistrarActualizarMarcaForm from "./registrar-actualizar-marca";
import { schema, transformData } from "../interfaces/interfaces-validaciones-marca";

const marca = { id: 4, denominacion: "natura", observacion: "obs", sistema: 0 } as never;

describe("RegistrarActualizarMarcaForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    confirmacion.respuesta = true;
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("alta: envía denominación y observación con usuarioCreatedId", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(MarcaService.nuevo).mockResolvedValue({ mensaje: "Marca creada" });

    render(<RegistrarActualizarMarcaForm onClose={onClose} onSuccess={onSuccess} />);
    expect(screen.getByText("Marca")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Denominación"), "Natura");
    await user.type(screen.getByLabelText("Observación"), "una obs");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(MarcaService.nuevo).toHaveBeenCalledWith({ denominacion: "natura", observacion: "una obs", usuarioCreatedId: 7 });
    expect(onClose).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith("Marca creada");
  });

  it("alta: no envía si falta la denominación", async () => {
    const user = userEvent.setup();
    render(<RegistrarActualizarMarcaForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(await screen.findByText("La denominación es obligatoria.")).toBeInTheDocument();
    expect(MarcaService.nuevo).not.toHaveBeenCalled();
  });

  it("edición: precarga y envía usuarioUpdatedId", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    vi.mocked(MarcaService.actualizar).mockResolvedValue({ mensaje: "Marca editada" });

    render(<RegistrarActualizarMarcaForm marca={marca} onClose={vi.fn()} onSuccess={onSuccess} />);
    expect(screen.getByText("Actualizar Marca")).toBeInTheDocument();
    expect(screen.getByLabelText("Denominación")).toHaveValue("natura");

    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(MarcaService.actualizar).toHaveBeenCalledWith(4, { denominacion: "natura", observacion: "obs", usuarioUpdatedId: 7 });
    expect(onSuccess).toHaveBeenCalledWith("Marca editada");
  });

  it("una marca de sistema no permite editar la denominación", () => {
    render(<RegistrarActualizarMarcaForm marca={{ ...(marca as object), sistema: 1 } as never} onClose={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByLabelText("Denominación")).toBeDisabled();
  });

  it("muestra el error del backend en el formulario", async () => {
    const user = userEvent.setup();
    vi.mocked(MarcaService.nuevo).mockRejectedValue({
      response: { status: 409, data: { statusCode: 409, code: "CONFLICTO", message: "Denominación ya en uso." } },
    });

    render(<RegistrarActualizarMarcaForm onClose={vi.fn()} onSuccess={vi.fn()} />);
    await user.type(screen.getByLabelText("Denominación"), "Natura");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText(/Denominación ya en uso|modificado por otra operación/)).toBeInTheDocument();
  });

  it("cerrar pide confirmación y solo cierra si se acepta", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<RegistrarActualizarMarcaForm onClose={onClose} onSuccess={vi.fn()} />);

    confirmacion.respuesta = false;
    await user.click(screen.getByText("Cerrar formulario"));
    expect(onClose).not.toHaveBeenCalled();

    confirmacion.respuesta = true;
    await user.click(screen.getByText("Cerrar formulario"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("esquema de marca", () => {
  it("valida caracteres y largo de la denominación", async () => {
    await expect(schema.validate({ denominacion: "Natura 2" })).resolves.toMatchObject({ denominacion: "natura 2" });
    await expect(schema.validate({ denominacion: "a-b" })).rejects.toThrow("Solo se permiten letras, números y espacios.");
    await expect(schema.validate({ denominacion: "a".repeat(256) })).rejects.toThrow("no puede superar los 255");
    expect(transformData({ denominacion: "x", observacion: undefined } as never)).toEqual({ denominacion: "x", observacion: null });
  });
});
