// components/Herramientas/FormulariosGenerales/DomicilioForm.tsx
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import {
  SelectLocalidad,
  SelectProvincia,
} from "../../../interfaces/gestion-organizacion/localidad/interfaces-localidad";
import FormInput from "../formateo-de-campos/form-input";
import Select from "react-select";
import ClienteService from "../../gestion-organizacion/cliente/services/cliente-service";
import { Button } from "../../ui/Button";
import { PlusCircle } from "lucide-react";

import { ModalPortal } from "../../../utils/modal-portal";
import React from "react";
import RegistrarActualizarLocalidadForm from "../../gestion-organizacion/localidad/utils/registrar-actualizar-localidad";
import { getApiErrorMessage, normalizeApiError } from "../../../utils/errores";

export default function DomicilioForm({
  sistema,
  onNotify,
}: {
  sistema?: number;
  onNotify?: (alert: { type: "error" | "warning"; title: string; message: string }) => void;
}) {
  const [localidades, setLocalidades] = useState<SelectLocalidad[]>([]);
  const [provincias, setProvincias] = useState<SelectProvincia[]>([]);
  const [mostrarFormularioLocalidad, setMostrarFormularioLocalidad] = useState(false);
  const [selectedProvincia, setSelectedProvincia] = React.useState<SelectProvincia>({} as SelectProvincia);

  const { setValue, watch, formState: { errors } } = useFormContext();
  const localidadId = watch("domicilio.localidadId");
  const provinciaId = watch("domicilio.provinciaId");

  useEffect(() => {
    const fetch = async () => {
      try {
        if (provinciaId > 0 && provinciaId !== undefined) {
          const localidades = await ClienteService.obtenerTotalesPara(provinciaId, "localidades"); // deberías tener este endpoint
          setLocalidades(localidades.data);
        }
      } catch (error) {
        console.error("Error al cargar provincias:", error);
        onNotify?.({ type: "error", title: "Error", message: getApiErrorMessage(normalizeApiError(error)) });
      }
    };
    fetch();
  }, [provinciaId]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const provincias = await ClienteService.obtenerTotales({ denominacion: " " }, "provincias"); // deberías tener este endpoint
        setProvincias(provincias.data);
      } catch (error) {
        console.error("Error al cargar provincias:", error);
        onNotify?.({ type: "error", title: "Error", message: getApiErrorMessage(normalizeApiError(error)) });
      }
    };
    fetch();
  }, []);

  const handleSuccess = async () => {
    setMostrarFormularioLocalidad(false);

    try {
      const localidades = await ClienteService.obtenerTotalesPara(provinciaId, "localidades"); // deberías tener este endpoint
      setLocalidades(localidades.data);
    } catch (error) {
      onNotify?.({ type: "error", title: "Error", message: getApiErrorMessage(normalizeApiError(error)) });
    }
  };

  return (
    <>
      <div className="border border-gray-300 rounded-lg p-2 shadow-sm bg-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput name="domicilio.direccion" label="Dirección" placeholder="Ingrese la dirección" />

            <div>
              <label className="block text-sm font-medium text-gray-700 py-1">Provincia</label>
              <Select
                value={provincias.find((option) => option.id === provinciaId) || null}
                options={provincias}
                getOptionLabel={(option) => option.denominacion}
                getOptionValue={(option) => String(option.id)}
                onChange={(selectedOption) => {
                  setSelectedProvincia(selectedOption as SelectProvincia);
                  setValue("domicilio.provinciaId", selectedOption?.id || 0);
                  setValue("domicilio.localidadId", 0);
                }}
                placeholder="Seleccione"
                className="text-black"
                isDisabled={sistema === 1}
                menuPortalTarget={document.body}
                styles={{
                  control: (base) => ({
                    ...base,
                    color: "black",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "black",
                  }),
                  option: (base, { isSelected }) => ({
                    ...base,
                    color: isSelected ? "white" : "black",
                    backgroundColor: isSelected ? "#3b82f6" : "white",
                  }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
              {errors.domicilio?.provinciaId?.message && (
                <small className="text-red-500">{String(errors.domicilio.provinciaId.message)}</small>
              )}
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 py-1">Localidad</label>
                <Select
                  value={localidades.find((option) => option.id === localidadId) || null}
                  options={localidades}
                  getOptionLabel={(option) => option.denominacion}
                  getOptionValue={(option) => String(option.id)}
                  onChange={(selectedOption) => {
                    setValue("domicilio.localidadId", selectedOption?.id || 0);
                  }}
                  placeholder="Seleccione"
                  isDisabled={!provinciaId || sistema === 1} // 👈 Deshabilita si no hay provincia
                  className="text-black"
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base) => ({
                      ...base,
                      color: "black",
                    }),
                    singleValue: (base) => ({
                      ...base,
                      color: "black",
                    }),
                    option: (base, { isSelected }) => ({
                      ...base,
                      color: isSelected ? "white" : "black",
                      backgroundColor: isSelected ? "#3b82f6" : "white",
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
                {errors.domicilio?.localidadId?.message && (
                  <small className="text-red-500">{String(errors.domicilio.localidadId.message)}</small>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-blue-500 text-white hover:bg-gray-700 w-10 h-10 rounded-full shadow-md transition"
                onClick={() => setMostrarFormularioLocalidad(true)}
              >
                <PlusCircle size={20} />
              </Button>
            </div>
          </div>
      </div>
      {mostrarFormularioLocalidad && (
        <ModalPortal>
          <RegistrarActualizarLocalidadForm
            onClose={() => setMostrarFormularioLocalidad(false)}
            onSuccess={handleSuccess}
            provincia={selectedProvincia}
          />
        </ModalPortal>
      )}
    </>
  );
}
