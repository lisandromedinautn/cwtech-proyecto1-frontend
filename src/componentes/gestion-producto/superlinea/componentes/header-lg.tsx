import { Layers } from "lucide-react";
import { CardHeader, CardTitle } from "../../../ui/Card";

interface HeaderLgProps {
  entidadesTotales: number;
  datosLength: number;
  openModal: () => void;
}

export const HeaderLg = ({
  entidadesTotales,
  datosLength,
  openModal,
}: HeaderLgProps) => {
  return (
    <CardHeader className="items-center p-3 space-y-2">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Layers className="consultar-icon w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-base sm:text-xl font-semibold">SuperLíneas</span>
        </CardTitle>
      </div>
    </CardHeader>
  );
};