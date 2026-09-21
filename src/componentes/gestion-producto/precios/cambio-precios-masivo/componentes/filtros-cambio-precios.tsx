import { Search, Package, Eye, Save, Eraser } from "lucide-react";
import Select from "react-select";
import { CardHeader, CardTitle } from "../../../../ui/Card";
import { Input } from "../../../../ui/Input";
import { Button } from "../../../../ui/Button";

type Props = { 
    valoresFiltros: any; 
    setValoresFiltros: any; 
    lineas: any[]; 
    productosLength: number; 
    onBuscar: () => void; 
    onGuardarCambios: () => void; 
    fetchLineas: () => void;
    onLimpiarFiltros: () => void;
    tipoAjuste: number;
    setTipoAjuste: (tipo: number) => void;
    valorAjuste: number;
    setValorAjuste: (valor: number) => void;
    alcance: "" | "LINEA" | "GLOBAL";
    setAlcance: (alcance: "" | "LINEA" | "GLOBAL") => void;
    onAplicarCambios: () => void;
    puedeGuardarCambios: boolean;
};

export default function FiltrosCambioPrecios({
  valoresFiltros,
  setValoresFiltros,
  lineas,
  productosLength,
  onBuscar,
  onGuardarCambios,
  fetchLineas,
  onLimpiarFiltros,
  tipoAjuste,
  setTipoAjuste,
  valorAjuste,
  setValorAjuste,
  alcance,
  setAlcance,
  onAplicarCambios,
  puedeGuardarCambios,
}: Props) {
  return (
    <CardHeader className="flex flex-col gap-5 p-4">
      <CardTitle className="flex items-center space-x-2">
        <Package className="consultar-icon" />
        <span>Actualización masiva de precios</span>
      </CardTitle>

      <div className="w-full lg:max-w-sm">
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="alcance-modificacion">
          Seleccioná el alcance de la modificación
        </label>
        <select
          id="alcance-modificacion"
          value={alcance}
          onChange={(event) => setAlcance(event.target.value as "" | "LINEA" | "GLOBAL")}
          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-black dark:border-slate-500 dark:bg-slate-600"
        >
          <option value="" disabled>Seleccione el alcance...</option>
          <option value="GLOBAL">Global</option>
          <option value="LINEA">Línea</option>
        </select>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="w-full lg:max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Denominación..."
              className="pl-10 bg-white dark:bg-slate-600 border-gray-300 dark:border-slate-500 focus:border-blue-500 focus:ring-blue-500"
              value={valoresFiltros.denominacionLinea ?? ""}
              disabled={alcance !== "LINEA"}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchLineas();
              }}
              onChange={(e) => setValoresFiltros({ ...valoresFiltros, denominacionLinea: e.target.value })}
            />
          </div>
        </div>
        <div className="w-full lg:max-w-sm">
          <Select
            value={(lineas ?? []).find((option) => option.id === valoresFiltros.lineaId) || null}
            options={lineas ?? []}
            getOptionLabel={(option) => option.denominacion}
            getOptionValue={(option) => String(option.id)}
            onChange={(option) => setValoresFiltros({ ...valoresFiltros, lineaId: option ? option.id : undefined })}
            placeholder="Seleccione una línea"
            isDisabled={alcance !== "LINEA"}
            className="text-black"
            menuPortalTarget={document.body}
            styles={{
              control: (base, { isDisabled }) => ({ ...base, color: "black", cursor: isDisabled ? "not-allowed" : "default" }),
              singleValue: (base) => ({ ...base, color: "black" }),
              option: (base, { isSelected, isFocused }) => ({ ...base, color: isSelected ? "white" : "black", backgroundColor: isSelected ? "#3b82f6" : isFocused ? "#93c5fd" : "white" }),
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBuscar} disabled={!alcance} className="bg-blue-500 text-white hover:bg-blue-800" title="Buscar productos">
            <Search className="mr-2 h-4 w-4" /> Buscar
          </Button>
          <Button variant="outline" onClick={onLimpiarFiltros} disabled={!alcance} className="bg-gray-500 text-white hover:bg-gray-700" title="Limpiar filtros">
            <Eraser className="mr-2 h-4 w-4" /> Borrar
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5 dark:border-slate-700">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <select
            value={tipoAjuste}
            onChange={(event) => setTipoAjuste(Number(event.target.value))}
            disabled={!alcance || productosLength === 0}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-black disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:border-slate-500 dark:bg-slate-600 dark:disabled:border-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
            aria-label="Tipo de ajuste"
          >
            <option value={1}>Porcentaje</option>
            <option value={2}>Monto fijo</option>
          </select>
          <div className="w-full lg:w-52">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={valorAjuste === 0 ? "" : valorAjuste}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (raw === "") {
                    setValorAjuste(0);
                    return;
                  }
                  const val = Number(raw);
                  if (tipoAjuste === 1 && Math.abs(val) > 100) return;
                  setValorAjuste(val);
                }}
                disabled={!alcance || productosLength === 0}
                placeholder={tipoAjuste === 1 ? "Porcentaje" : "Monto"}
                aria-label={tipoAjuste === 1 ? "Porcentaje de ajuste" : "Monto de ajuste"}
                aria-describedby="ayuda-valor-ajuste"
                className="bg-white disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400 dark:bg-slate-600 dark:disabled:border-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
              />
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400" aria-hidden="true">*</span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={onAplicarCambios}
            className={productosLength === 0 ? "bg-gray-400 text-gray-600 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-800"}
            title="Previsualizar cambios"
            disabled={productosLength === 0}
          >
            <Eye className="mr-2 h-4 w-4" /> Previsualizar cambios
          </Button>
          <Button
            variant="outline"
            onClick={onGuardarCambios}
            className="bg-blue-500 text-white hover:bg-blue-800"
            title="Guardar cambios"
            disabled={!puedeGuardarCambios}
          >
            <Save className="mr-2 h-4 w-4" /> Guardar cambios
          </Button>
        </div>
        <p id="ayuda-valor-ajuste" className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          * Para disminuir el precio, ingresá un valor negativo.
        </p>
      </div>
    </CardHeader>
  );
}
