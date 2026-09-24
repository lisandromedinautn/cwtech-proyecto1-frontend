import {
  Info,
  Pencil,
  Trash,
  Tag,
  Layers,
  History,
  Bell,
  PackagePlus,
} from "lucide-react";
import type { ConsultarProducto } from "../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { ActionButton } from "../../../herramientas/reutilizables/action-button";


interface Props {
  producto: ConsultarProducto;

  onEditar: (id: number) => void;
  onInfo: (id: number) => void;
  onDelete: (id: number) => void;
  onAjustarStock: (id: number) => void;
  onHistorial?: (id: number) => void;

  compact?: boolean;
}

export function ProductoActions({
  producto,
  onEditar,
  onInfo,
  onDelete,
  onAjustarStock,
  onHistorial,
 
  compact = false,
}: Props) {
  const botonInfo = (
    <ActionButton
      variant="info"
      title="Ver información"
      onClick={() => onInfo(producto.id)}
    >
      <Info size={16} />
    </ActionButton>
  );

  // Un producto dado de baja solo se consulta: el backend rechaza editarlo,
  // ajustarle stock, ver su historial o volver a eliminarlo.
  if (producto.eliminado) {
    return (
      <div className={`flex items-center gap-1 ${compact ? "justify-end" : ""}`}>
        {botonInfo}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${compact ? "justify-end" : ""}`}>
      {botonInfo}

      {onHistorial && (
        <ActionButton
          variant="info"
          title="Historial de precios"
          onClick={() => onHistorial(producto.id)}
        >
          <History size={16} />
        </ActionButton>
      )}

      <ActionButton
        variant="edit"
        title="Ajustar stock"
        onClick={() => onAjustarStock(producto.id)}
      >
        <PackagePlus size={16} />
      </ActionButton>

      <ActionButton
        variant="edit"
        title="Editar producto"
        onClick={() => onEditar(producto.id)}
      >
        <Pencil size={16} />
      </ActionButton>
      
      <ActionButton 
      variant="delete"
      title="Eliminar producto"
      onClick={() => onDelete(producto.id)}
      >
      <Trash size={16} />
      </ActionButton>

     
    </div>
  );
}
