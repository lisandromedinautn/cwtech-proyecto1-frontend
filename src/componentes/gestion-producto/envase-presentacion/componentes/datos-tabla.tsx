import { Info, Pencil, Trash } from "lucide-react";
import { TablaAGGrid, type Column } from "../../../herramientas/tablas/tabla-flexible-ag-grid";
import {
  denominacionNotScrollColumnProps,
  observacionesColumnProps,
} from "../../../herramientas/tablas/formateo-columnas-documentos";
import type { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import { ActionButton } from "../../../herramientas/reutilizables/action-button";
import { formatFechaHora } from "../../../herramientas/formateo-de-campos/fucion-formateo";
import { Badge } from "../../../ui/Badge";

interface Props {
  envases: EnvasePresentacion[];
  onEditar: (id: number) => void;
  onInfo: (id: number) => void;
  onDelete: (id: number) => void;
}

export function DatosTabla({ envases, onEditar, onInfo, onDelete }: Props) {
  const columns: Column<EnvasePresentacion>[] = [
    {
      header: "Denominación",
      accessor: "denominacion",
      ...denominacionNotScrollColumnProps,
      formatFunction: ({ value, row }) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {row.sistema === 1 && (
            <Badge variant="secondary" className="text-xs">
              Sistema
            </Badge>
          )}
          {row.deletedAt && (
            <span className="text-xs text-red-500 font-medium">
              Eliminado el {formatFechaHora(row.deletedAt)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Observación",
      accessor: "observacion",
      ...observacionesColumnProps,
    },
  ];

  return (
    <TablaAGGrid
      columns={columns}
      data={envases}
      getRowClass={(params: any) =>
        params.data?.deletedAt
          ? "opacity-50 bg-gray-100 dark:bg-slate-800 pointer-events-none"
          : ""
      }
      actions={(row: EnvasePresentacion) => {
        if (row.deletedAt) return <div className="w-full" />;

        return (
          <div className="flex justify-end gap-1">
            <ActionButton variant="info" title="Ver información" onClick={() => onInfo(row.id)}>
              <Info size={16} />
            </ActionButton>
            <ActionButton
              variant="edit"
              title="Editar"
              disabled={row.sistema === 1}
              onClick={() => onEditar(row.id)}
            >
              <Pencil size={16} />
            </ActionButton>
            <ActionButton
              variant="delete"
              title="Eliminar"
              disabled={row.sistema === 1}
              onClick={() => onDelete(row.id)}
            >
              <Trash size={16} />
            </ActionButton>
          </div>
        );
      }}
      actionsFlex={0.5}
      rowHeight={60}
    />
  );
}
