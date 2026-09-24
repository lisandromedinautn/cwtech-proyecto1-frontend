import { PlusCircle, Package } from "lucide-react";
import { Button } from "../../../ui/Button";
import { CardHeader, CardTitle } from "../../../ui/Card";

interface HeaderLgProps {
  entidadesTotales: number;
  datosLength: number;
  openModal: () => void;
}

// Encabezado para pantallas chicas. A diferencia del de SuperLínea, incluye
// el botón de alta, porque en celular es la única forma de crear un envase.
export const HeaderLg = ({ openModal }: HeaderLgProps) => {
  return (
    <CardHeader className="items-center p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <CardTitle className="flex items-center space-x-2">
          <Package className="consultar-icon w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-base sm:text-xl font-semibold">Envases</span>
        </CardTitle>
        <Button
          className="bg-blue-500 hover:bg-blue-700 text-white flex items-center gap-1.5 px-3 py-2 rounded-lg shadow-sm"
          onClick={openModal}
          title="Agregar envase"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
      </div>
    </CardHeader>
  );
};
