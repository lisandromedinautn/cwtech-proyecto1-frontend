import { useEffect, useState } from "react";
import { Label } from "../../../ui/Label";
import {
  SelectUI,
  SelectTriggerUI,
  SelectValueUI,
  SelectContentUI,
  SelectItemUI,
} from "../../../ui/Select";
import SuperlineaService from "../services/superlinea-service";
import type { SelectSuperlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";

interface Props {
  value?: number;
  onChange: (superlineaId?: number) => void;
  label?: string;
}

const VALOR_TODAS = "todas";

export default function SuperlineaFiltro({ value, onChange, label = "SuperLínea" }: Props) {
  const [opciones, setOpciones] = useState<SelectSuperlinea[]>([]);
  const [loading, setLoading] = useState(false);

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
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-700 block mb-1">{label}</Label>
      <SelectUI
        value={value ? String(value) : VALOR_TODAS}
        onValueChange={(v) =>
          onChange(v === VALOR_TODAS ? undefined : Number(v))
        }
        disabled={loading}
      >
        <SelectTriggerUI className="w-full">
          <SelectValueUI
            placeholder={loading ? "Cargando..." : "Todas las SuperLíneas"}
          />
        </SelectTriggerUI>
        <SelectContentUI className="bg-white dark:bg-slate-900">
          <SelectItemUI value={VALOR_TODAS}>Todas las SuperLíneas</SelectItemUI>
          {opciones.map((opcion) => (
            <SelectItemUI key={opcion.id} value={String(opcion.id)}>
              {opcion.denominacion}
            </SelectItemUI>
          ))}
        </SelectContentUI>
      </SelectUI>
    </div>
  );
}
