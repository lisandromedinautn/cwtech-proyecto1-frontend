import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";

import EnvasePresentacionService from "../services/envase-presentacion-service";
import RegistrarActualizarEnvasePresentacionForm from "./registrar-actualizar-envase-presentacion";
import type { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";

vi.mock("../services/envase-presentacion-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", () => ({ getUsuarioId: () => 7 }));

vi.mock("../../../herramientas/formateo-de-campos/form-input", () => ({
  default: function MockFormInput({ name, label }: { name: string; label: string }) {
    const {
      register,
      formState: { errors },
    } = useFormContext();
    return (
      <label>
        {label}
        <input aria-label={label} {...register(name)} />
        {errors[name]?.message && <span>{String(errors[name].message)}</span>}
      </label>
    );
  },
}));

vi.mock("../../../ui/encabezadoFormularios", () => ({
  default: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("../../../herramientas/alertas/alertas-confirmacion", () => ({
  TipoAlertaConfirmacion: { DEFAULT: "default" },
  TituloAlertaConfirmacion: { DEFAULT: "Confirmación" },
  useConfirmation: () => ({
    showConfirmation: vi.fn().mockResolvedValue(true),
    AlertasConfirmacion: () => null,
  }),
}));

const botella: EnvasePresentacion = {
  id: 3,
  denominacion: "BOTELLA",
  observacion: "",
  sistema: 0,
  deletedAt: null,
};

describe("RegistrarActualizarEnvasePresentacionForm", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("da de alta un envase con usuarioCreatedId", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    vi.mocked(EnvasePresentacionService.nuevo).mockResolvedValue({
      mensaje: "Envase de presentación bolsón creada",
    });

    render(<RegistrarActualizarEnvasePresentacionForm onClose={onClose} onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Denominación"), "Bolsón");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(EnvasePresentacionService.nuevo).toHaveBeenCalledWith(
      expect.objectContaining({ denominacion: "bolsón", usuarioCreatedId: 7 }),
    );
    expect(onSuccess).toHaveBeenCalledWith("Envase de presentación bolsón creada");
    expect(onClose).toHaveBeenCalled();
  });

  it("no envía un envase sin denominación", async () => {
    const user = userEvent.setup();

    render(<RegistrarActualizarEnvasePresentacionForm onClose={vi.fn()} onSuccess={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText("La denominación es obligatoria.")).toBeInTheDocument();
    expect(EnvasePresentacionService.nuevo).not.toHaveBeenCalled();
  });

  it("modifica un envase con usuarioUpdatedId", async () => {
    const user = userEvent.setup();
    vi.mocked(EnvasePresentacionService.actualizar).mockResolvedValue({ mensaje: "editada" });

    render(
      <RegistrarActualizarEnvasePresentacionForm
        envase={botella}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Denominación")).toHaveValue("BOTELLA");
    await user.type(screen.getByLabelText("Observación"), "De vidrio");
    await user.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(EnvasePresentacionService.actualizar).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        denominacion: "botella",
        observacion: "De vidrio",
        usuarioUpdatedId: 7,
      }),
    );
  });

  it("muestra el conflicto del backend cuando la denominación ya existe", async () => {
    const user = userEvent.setup();
    vi.mocked(EnvasePresentacionService.nuevo).mockRejectedValue({
      response: {
        status: 409,
        data: { statusCode: 409, code: "CONFLICTO", message: "Denominación ya en uso." },
      },
    });

    render(<RegistrarActualizarEnvasePresentacionForm onClose={vi.fn()} onSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText("Denominación"), "Botella");
    await user.click(screen.getByRole("button", { name: "Registrar" }));

    expect(await screen.findByText("Denominación ya en uso.")).toBeInTheDocument();
    expect(EnvasePresentacionService.nuevo).toHaveBeenCalledTimes(1);
  });
});
