import { FormEvent, useState } from "react";
import { Producto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { getUsuarioId } from "../../../../utils/auth";
import { parseApiError } from "../../../../utils/errores";
import { Button } from "../../../ui/Button";
import ProductoService from "../services/producto-service";

interface Props {
  producto: Producto;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

export default function AjustarStockManualModal({
  producto,
  onClose,
  onSuccess,
}: Props) {
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cantidadNumerica = Number(cantidad);
    const motivoNormalizado = motivo.trim();

    if (!Number.isInteger(cantidadNumerica) || cantidadNumerica === 0) {
      setError("La variación de stock debe ser un número entero distinto de cero.");
      return;
    }
    if (!motivoNormalizado) {
      setError("El motivo es obligatorio para ajuste manual.");
      return;
    }

    setError("");
    setEnviando(true);
    try {
      const response = await ProductoService.ajustarStockManual(producto.id, {
        cantidad: cantidadNumerica,
        motivo: motivoNormalizado,
        usuarioId: getUsuarioId(),
      });
      onSuccess(response.message);
    } catch (apiError) {
      setError(parseApiError(apiError));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      aria-labelledby="ajuste-stock-titulo"
    >
      <h2 id="ajuste-stock-titulo" className="text-lg font-semibold text-gray-900">
        Ajustar stock
      </h2>
      <p className="mt-1 text-sm text-gray-600">{producto.denominacion}</p>
      <p className="mt-3 rounded bg-gray-100 px-3 py-2 text-sm text-gray-700">
        Stock actual: <strong>{producto.stock ?? 0}</strong>
      </p>

      <div className="mt-4">
        <label htmlFor="cantidad-ajuste" className="block text-sm font-medium text-gray-700">
          Variación de stock
        </label>
        <input
          id="cantidad-ajuste"
          type="number"
          step="1"
          value={cantidad}
          onChange={(event) => setCantidad(event.target.value)}
          placeholder="Ej.: 5 o -3"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <p className="mt-1 text-xs text-gray-500">Use positivo para ingreso y negativo para descuento.</p>
      </div>

      <div className="mt-4">
        <label htmlFor="motivo-ajuste" className="block text-sm font-medium text-gray-700">
          Motivo
        </label>
        <textarea
          id="motivo-ajuste"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          rows={3}
        />
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onClose} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Ajustando..." : "Confirmar ajuste"}
        </Button>
      </div>
    </form>
  );
}
