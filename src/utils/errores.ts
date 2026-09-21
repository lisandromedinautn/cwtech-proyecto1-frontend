export interface ApiErrorDetail {
  field: string;
  reason: string;
}

export interface ApiError {
  statusCode: number;
  code: string;
  message: string;
  details: ApiErrorDetail[];
}

export type ApiErrorCategory = "validation" | "not-found" | "conflict" | "generic";

type FormSetError = (name: string, error: { type: string; message: string }) => void;
type Notify = (alert: { type: "error" | "warning"; title: string; message: string }) => void;

const ERROR_MESSAGES: Record<string, string> = {
  VALIDACION_DTO: "Revisá los datos ingresados.",
  CANTIDAD_INVALIDA: "La cantidad no puede ser cero.",
  MOTIVO_REQUERIDO: "El ajuste manual requiere un motivo.",
  NO_ENCONTRADO: "El recurso ya no existe. Actualizá la lista.",
  CONFLICTO: "El recurso fue modificado por otra operación.",
  STOCK_NEGATIVO: "No hay stock suficiente para este ajuste.",
};

function fallbackCode(statusCode: number) {
  if (statusCode === 400) return "SOLICITUD_INVALIDA";
  if (statusCode === 404) return "NO_ENCONTRADO";
  if (statusCode === 409) return "CONFLICTO";
  return "ERROR_INTERNO";
}

export function normalizeApiError(error: unknown): ApiError {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response;
  const responseData = response?.data;
  const data = typeof responseData === "object" && responseData !== null ? responseData as Record<string, unknown> : {};
  const statusCode = typeof data.statusCode === "number" ? data.statusCode : response?.status ?? 0;
  const code = typeof data.code === "string" ? data.code : fallbackCode(statusCode);
  const message = typeof data.message === "string"
    ? data.message
    : typeof responseData === "string"
      ? responseData
      : "Ocurrió un error inesperado.";
  const details = Array.isArray(data.details)
    ? data.details.filter(
      (detail): detail is ApiErrorDetail =>
        typeof detail === "object" &&
        detail !== null &&
        typeof (detail as ApiErrorDetail).field === "string" &&
        typeof (detail as ApiErrorDetail).reason === "string",
    )
    : [];

  return { statusCode, code, message, details };
}

export function getApiErrorCategory(error: ApiError): ApiErrorCategory {
  if (error.statusCode === 400) return "validation";
  if (error.statusCode === 404) return "not-found";
  if (error.statusCode === 409) return "conflict";
  return "generic";
}

export function getApiErrorMessage(error: ApiError): string {
  return ERROR_MESSAGES[error.code] ?? error.message;
}

export function applyApiErrorToForm(error: unknown, setError: FormSetError, notify: Notify): ApiError {
  const apiError = normalizeApiError(error);
  const category = getApiErrorCategory(apiError);

  if (category === "validation") {
    if (apiError.details.length > 0) {
      apiError.details.forEach(({ field, reason }) => {
        setError(field, { type: "server", message: reason });
      });
    } else {
      setError("root", { type: "server", message: getApiErrorMessage(apiError) });
    }
    return apiError;
  }

  if (category === "not-found") {
    notify({ type: "warning", title: "Recurso inexistente", message: getApiErrorMessage(apiError) });
    return apiError;
  }

  notify({
    type: "error",
    title: category === "conflict" ? "Conflicto" : "Error",
    message: getApiErrorMessage(apiError),
  });
  return apiError;
}

// Compatibilidad temporal para los flujos que aún muestran un único texto.
export function parseApiError(error: unknown): string {
  return getApiErrorMessage(normalizeApiError(error));
}
