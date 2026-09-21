import { ConsultarProductosCambioPreciosMasivo } from "../../../../../interfaces/gestion-producto/producto/interfaces-producto";
import { TablaAGGrid,Column } from "../../../../herramientas/tablas/tabla-flexible-ag-grid";


type Props = {
  productos: ConsultarProductosCambioPreciosMasivo[];
  columns: Column<ConsultarProductosCambioPreciosMasivo>[];
};

export default function TablaCambioPrecios({
  productos,
  columns,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <TablaAGGrid
        columns={columns}
        data={productos}
        onUpdate={() => {}}
        rowHeight={55}
        height={600}
      />
    </div>
  );
}