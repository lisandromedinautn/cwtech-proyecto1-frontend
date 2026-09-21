import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useFormContext } from "react-hook-form";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SuperlineaService from "../services/superlinea-service";
import RegistrarActualizarSuperlineaForm from "./registrar-actualizar-superlinea";
import type { Superlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

vi.mock("../services/superlinea-service", () => ({
  default: {
    nuevo: vi.fn(),
    actualizar: vi.fn(),
  },
}));

vi.mock("../../../../utils/auth", () => ({ getUsuarioId: () => 7 }));

vi.mock("../../../herramientas/formateo-de-campos/form-input", () => ({
  default: function MockFormInput({
    name,
    label,
  }: {
    name: string;
    label: string;
  }) {
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

const superlineaBase = {
  id: 1,
  denominacion: "bebidas",
  observacion: "Bebidas en general",
  createdAt: null,
  updatedAt: null,
  deletedAt: null,
  usuarioCreatedId: 1,
  usuarioDeletedId: undefined,
  usuarioUpdatedId: undefined,
  sistema: 0,
} as Superlinea;

describe("RegistrarActualizarSuperlineaForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("alta", () => {
    it("envía denominación y observación con usuarioCreatedId", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      vi.mocked(SuperlineaService.nuevo).mockResolvedValue({
        mensaje: "SuperLinea bebidas creada",
      });

      render(
        <RegistrarActualizarSuperlineaForm
          onClose={onClose}
          onSuccess={onSuccess}
        />,
      );

      await user.type(screen.getByLabelText("Denominación"), "Bebidas");
      await user.type(screen.getByLabelText("Observación"), "Bebidas en general");
      await user.click(screen.getByRole("button", { name: "Registrar" }));

      expect(SuperlineaService.nuevo).toHaveBeenCalledWith(
        expect.objectContaining({
          denominacion: "bebidas",
          observacion: "Bebidas en general",
          usuarioCreatedId: 7,
        }),
      );
      expect(onSuccess).toHaveBeenCalledWith("SuperLinea bebidas creada");
      expect(onClose).toHaveBeenCalled();
    });

    it("no permite enviar sin denominación", async () => {
      const user = userEvent.setup();

      render(
        <RegistrarActualizarSuperlineaForm
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      await user.click(screen.getByRole("button", { name: "Registrar" }));

      expect(
        await screen.findByText("La denominación es obligatoria."),
      ).toBeInTheDocument();
      expect(SuperlineaService.nuevo).not.toHaveBeenCalled();
    });

    it("mapea un 409 del backend al campo root", async () => {
      const user = userEvent.setup();
      vi.mocked(SuperlineaService.nuevo).mockRejectedValue({
        response: {
          status: 409,
          data: {
            statusCode: 409,
            code: "CONFLICTO",
            message: "Denominación ya en uso o esta eliminada.",
            details: [],
          },
        },
      });

      render(
        <RegistrarActualizarSuperlineaForm
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      await user.type(screen.getByLabelText("Denominación"), "Bebidas");
      await user.click(screen.getByRole("button", { name: "Registrar" }));

      expect(
        await screen.findByText("El recurso fue modificado por otra operación."),
      ).toBeInTheDocument();
    });

    it("mapea un detalle 400 al campo del formulario", async () => {
      const user = userEvent.setup();
      vi.mocked(SuperlineaService.nuevo).mockRejectedValue({
        response: {
          status: 400,
          data: {
            statusCode: 400,
            code: "VALIDACION_DTO",
            message: "Revisá los datos ingresados.",
            details: [
              {
                field: "denominacion",
                reason: "La denominación ya existe.",
              },
            ],
          },
        },
      });

      render(
        <RegistrarActualizarSuperlineaForm
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      await user.type(screen.getByLabelText("Denominación"), "Bebidas");
      await user.click(screen.getByRole("button", { name: "Registrar" }));

      expect(
        await screen.findByText("La denominación ya existe."),
      ).toBeInTheDocument();
    });
  });

  describe("edición", () => {
    it("envía usuarioUpdatedId cuando hay superlinea", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      vi.mocked(SuperlineaService.actualizar).mockResolvedValue({
        mensaje: "SuperLinea almacen editada",
      });

      render(
        <RegistrarActualizarSuperlineaForm
          superlinea={superlineaBase}
          onClose={vi.fn()}
          onSuccess={onSuccess}
        />,
      );

      const input = screen.getByLabelText("Denominación") as HTMLInputElement;
      await user.clear(input);
      await user.type(input, "Almacén");
      await user.click(screen.getByRole("button", { name: "Actualizar" }));

      expect(SuperlineaService.actualizar).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          denominacion: "almacén",
          usuarioUpdatedId: 7,
        }),
      );
      expect(onSuccess).toHaveBeenCalledWith("SuperLinea almacen editada");
    });

    it("deshabilita el fieldset si la SuperLínea es de sistema", () => {
      const { container } = render(
        <RegistrarActualizarSuperlineaForm
          superlinea={{ ...superlineaBase, sistema: 1 }}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
        />,
      );

      const fieldset = container.querySelector("fieldset");
      expect(fieldset).toBeDisabled();
    });
  });
});