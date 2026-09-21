import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import {
  SelectUI,
  SelectTriggerUI,
  SelectValueUI,
  SelectContentUI,
  SelectItemUI,
} from "../../../ui/Select";
import { Label } from "../../../ui/Label";
import SuperlineaService from "../services/superlinea-service";
import type { SelectSuperlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

interface Props {
  name?: string;
  label?: string;
  disabled?: boolean;
}

export default function SuperlineasSelector({
  name = "superlineaId",
  label = "SuperLínea",
  disabled = false,
}: Props) {
  const [opciones, setOpciones] = useState<SelectSuperlinea[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    control,
    formState: { errors },
  } = useFormContext();

  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const response = await SuperlineaService.obtener({ skip: 0, take: 1000 });
        const data: SelectSuperlinea[] = (response.data ?? []).map(
          (s: { id: number; denominacion: string }) => ({
            id: s.id,
            denominacion: s.denominacion,
          }),
        );
        setOpciones(data);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  return (
    <div className="space-y-1 sm:space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700 block mb-1">
        {label}
      </Label>

      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <SelectUI
            value={field.value ? String(field.value) : ""}
            onValueChange={(value) => field.onChange(Number(value))}
            disabled={disabled || loading}
          >
            <SelectTriggerUI id={name} className="w-full">
              <SelectValueUI
                placeholder={loading ? "Cargando SuperLíneas..." : "Selecciona una SuperLínea"}
              />
            </SelectTriggerUI>
            <SelectContentUI>
              {opciones.length === 0 && !loading ? (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No hay SuperLíneas disponibles.
                </div>
              ) : (
                opciones.map((opcion) => (
                  <SelectItemUI key={opcion.id} value={String(opcion.id)}>
                    {opcion.denominacion}
                  </SelectItemUI>
                ))
              )}
            </SelectContentUI>
          </SelectUI>
        )}
      />

      {errors[name] && (
        <small className="text-red-500">{errors[name]?.message as string}</small>
      )}
    </div>
  );
}