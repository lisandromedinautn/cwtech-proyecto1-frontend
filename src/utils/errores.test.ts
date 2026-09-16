import { describe, expect, it, vi } from "vitest";
import {
  applyApiErrorToForm,
  getApiErrorCategory,
  getApiErrorMessage,
  normalizeApiError,
} from "./errores";

describe("errores HTTP", () => {
  it("normaliza detalles de validación del backend", () => {
    const error = normalizeApiError({
      response: {
        status: 400,
        data: {
          statusCode: 400,
          code: "VALIDACION_DTO",
          message: "Datos inválidos",
          details: [{ field: "denominacion", reason: "Es obligatoria" }],
        },
      },
    });

    expect(error).toMatchObject({ statusCode: 400, code: "VALIDACION_DTO" });
    expect(error.details).toEqual([{ field: "denominacion", reason: "Es obligatoria" }]);
    expect(getApiErrorCategory(error)).toBe("validation");
  });

  it("clasifica inexistencia y conflicto con mensajes de interfaz", () => {
    const notFound = normalizeApiError({ response: { status: 404, data: {} } });
    const conflict = normalizeApiError({
      response: { status: 409, data: { code: "STOCK_NEGATIVO", message: "Stock negativo" } },
    });

    expect(getApiErrorCategory(notFound)).toBe("not-found");
    expect(getApiErrorMessage(notFound)).toBe("El recurso ya no existe. Actualizá la lista.");
    expect(getApiErrorCategory(conflict)).toBe("conflict");
    expect(getApiErrorMessage(conflict)).toBe("No hay stock suficiente para este ajuste.");
  });

  it("mapea detalles 400 a campos del formulario", () => {
    const setError = vi.fn();
    const notify = vi.fn();

    applyApiErrorToForm(
      {
        response: {
          status: 400,
          data: { details: [{ field: "domicilio.localidadId", reason: "No existe" }] },
        },
      },
      setError,
      notify,
    );

    expect(setError).toHaveBeenCalledWith("domicilio.localidadId", { type: "server", message: "No existe" });
    expect(notify).not.toHaveBeenCalled();
  });

  it("conserva un fallback para errores de red", () => {
    expect(normalizeApiError(new Error("sin conexión"))).toMatchObject({
      statusCode: 0,
      code: "ERROR_INTERNO",
      message: "Ocurrió un error inesperado.",
    });
  });
});
