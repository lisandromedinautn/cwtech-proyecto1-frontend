import { get, useFormContext } from "react-hook-form";
import { NumericFormat } from "react-number-format";
import type { SelectEnvasePresentacion } from "../../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import EntidadSelectorBase from "../../../../herramientas/reutilizables/entidad-selector-base";
import { UNIDADES_PRESENTACION } from "../../domain/presentacion-producto";

// Presentación del producto (CR-002): envase + valor + unidad de medida.
// Los campos viven en el formulario como `presentacion.envaseId`,
// `presentacion.cantidad` y `presentacion.unidad`, los mismos nombres que usa
// el backend en los errores de validación.
export default function PresentacionProducto(props: {
  obligatoria: boolean;
  envases: SelectEnvasePresentacion[];
  envaseSeleccionado: SelectEnvasePresentacion | null;
  denominacionEnvase: string;
  setDenominacionEnvase: (v: string) => void;
  denominacionEnvaseRef: React.RefObject<HTMLInputElement>;
  selectEnvaseRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
  onEnterEnvase: (e: React.KeyboardEvent) => void;
  onChangeEnvase: (envase: SelectEnvasePresentacion | null) => void;
  onAgregarEnvase: () => void;
}) {
  const {
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = useFormContext();

  const envaseId = watch("presentacion.envaseId");
  const cantidad = watch("presentacion.cantidad");
  const unidad = watch("presentacion.unidad");

  // Los nombres son anidados: errors["presentacion.cantidad"] no existe.
  const error = (campo: string): string | undefined => get(errors, campo)?.message;

  return (
    <div className="border border-gray-300 rounded-lg p-2 shadow-sm bg-gray-50 space-y-2">
      <p className="text-sm font-semibold text-gray-700">
        Presentación{" "}
        <span className="font-normal text-gray-500">
          {props.obligatoria ? "(obligatoria)" : "(opcional para productos anteriores)"}
        </span>
      </p>

      <EntidadSelectorBase<SelectEnvasePresentacion>
        titulo="Envase"
        denominacion={props.denominacionEnvase}
        setDenominacion={props.setDenominacionEnvase}
        denominacionRef={props.denominacionEnvaseRef}
        opciones={props.envases}
        selected={props.envaseSeleccionado}
        selectedId={envaseId ?? 0}
        selectRef={props.selectEnvaseRef}
        disabled={props.disabled}
        error={error("presentacion.envaseId")}
        onEnterInput={props.onEnterEnvase}
        onChange={props.onChangeEnvase}
        onAgregar={props.onAgregarEnvase}
      />

      <div className="grid grid-cols-2 gap-4 px-2 pb-1">
        <div className="space-y-1">
          <label htmlFor="presentacion-cantidad" className="block text-sm font-medium text-gray-700">
            Valor
          </label>
          {/* Punto decimal y sin separador de miles, como el texto "1.5 L" (PA-023). */}
          <NumericFormat
            id="presentacion-cantidad"
            value={cantidad ?? ""}
            decimalSeparator="."
            thousandSeparator={false}
            decimalScale={2}
            allowNegative={false}
            placeholder="Ej.: 500 o 1.5"
            disabled={props.disabled}
            onValueChange={(values) =>
              setValue("presentacion.cantidad", values.floatValue ?? null, {
                shouldValidate: isSubmitted,
                shouldDirty: true,
              })
            }
            className="w-full text-right p-2 border border-gray-300 bg-white rounded-md text-black"
          />
          {error("presentacion.cantidad") && (
            <small className="text-red-500">{error("presentacion.cantidad")}</small>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="presentacion-unidad" className="block text-sm font-medium text-gray-700">
            Unidad de medida
          </label>
          <select
            id="presentacion-unidad"
            value={unidad ?? ""}
            disabled={props.disabled}
            onChange={(e) =>
              setValue("presentacion.unidad", e.target.value || null, {
                shouldValidate: isSubmitted,
                shouldDirty: true,
              })
            }
            className="w-full p-2 border border-gray-300 bg-white rounded-md text-black"
          >
            <option value="">Seleccione</option>
            {UNIDADES_PRESENTACION.map((u) => (
              <option key={u.valor} value={u.valor}>
                {u.etiqueta}
              </option>
            ))}
          </select>
          {error("presentacion.unidad") && (
            <small className="text-red-500">{error("presentacion.unidad")}</small>
          )}
        </div>
      </div>

      {/* Errores de regla del backend (PRESENTACION_INVALIDA / _REQUERIDA). */}
      {error("presentacion") && (
        <p className="text-sm text-red-600 px-2" role="alert">
          {error("presentacion")}
        </p>
      )}
    </div>
  );
}
