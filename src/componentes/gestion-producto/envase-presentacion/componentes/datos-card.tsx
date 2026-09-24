import type { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import { Info, Pencil, Trash } from "lucide-react";
import { ActionButton } from "../../../herramientas/reutilizables/action-button";
import { formatFechaHora } from "../../../herramientas/formateo-de-campos/fucion-formateo";
import { Badge } from "../../../ui/Badge";

interface Props {
  envase: EnvasePresentacion;
  onEditar: (id: number) => void;
  onInfo: (id: number) => void;
  onDelete: (id: number) => void;
}

export function DatosCards({ envase, onEditar, onInfo, onDelete }: Props) {
  const eliminado = !!envase.deletedAt;
  const esSistema = envase.sistema === 1;

  return (
    <div
      className={`border rounded-md px-3 py-3 ${
        eliminado
          ? "border-gray-200 bg-gray-100 dark:bg-slate-800 opacity-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="mb-2">
        <p className="text-xs text-gray-500">Denominación</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-800 line-clamp-2">{envase.denominacion}</p>
          {esSistema && (
            <Badge variant="secondary" className="text-xs">
              Sistema
            </Badge>
          )}
        </div>
        {eliminado && (
          <p className="text-xs text-red-500 font-medium mt-0.5">
            Eliminado el {formatFechaHora(envase.deletedAt)}
          </p>
        )}
      </div>

      {envase.observacion && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">Observación</p>
          <p className="text-sm text-gray-700 line-clamp-2">{envase.observacion}</p>
        </div>
      )}

      {!eliminado && (
        <div className="flex justify-end gap-1 pt-2 border-t border-gray-100">
          <ActionButton variant="info" onClick={() => onInfo(envase.id)} title="Ver información">
            <Info size={16} />
          </ActionButton>
          <ActionButton
            variant="edit"
            onClick={() => onEditar(envase.id)}
            disabled={esSistema}
            title="Editar"
          >
            <Pencil size={16} />
          </ActionButton>
          <ActionButton
            variant="delete"
            onClick={() => onDelete(envase.id)}
            disabled={esSistema}
            title="Eliminar"
          >
            <Trash size={16} />
          </ActionButton>
        </div>
      )}
    </div>
  );
}
