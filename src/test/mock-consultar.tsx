import { vi } from "vitest";

export function servicioMock() {
  return {
    obtener: vi.fn(),
    obtenerId: vi.fn(),
    obtenerAuditoria: vi.fn(),
    eliminar: vi.fn(),
    imprimirTodo: vi.fn(),
    imprimirPagina: vi.fn(),
  };
}

export const modalMock =
  (nombre: string) =>
  ({ open, tipo, onClose, onSuccess }: { open: boolean; tipo: string | null; onClose: () => void; onSuccess: (m: string) => void }) =>
    open ? (
      <div>
        <span>{`modal ${nombre} ${tipo}`}</span>
        <button onClick={onClose}>cerrar modal</button>
        <button onClick={() => onSuccess("Guardado ok")}>guardar modal</button>
      </div>
    ) : null;
