import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CardContent, CardFooter, Card } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import FormInput from "../../../herramientas/formateo-de-campos/form-input";
import { Layers } from "lucide-react";

import {
  FormValues,
  schema,
  transformData,
} from "../interfaces/interfaces-validaciones-superlinea";
import SuperlineaService from "../services/superlinea-service";
import { Superlinea } from "../../../../interfaces/gestion-producto/superlinea/interfaces-superlinea";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { getUsuarioId } from "../../../../utils/auth";
import EncabezadoFormularios from "../../../ui/encabezadoFormularios";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";
import { applyApiErrorToForm } from "../../../../utils/errores";

export default function RegistrarActualizarSuperlineaForm({
  superlinea,
  onClose,
  onSuccess,
}: {
  superlinea?: Superlinea;
  onClose: () => void;
  onSuccess: (mensajeAlerta: string) => void;
}) {
  const usuarioId = getUsuarioId();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema()) as any,
    defaultValues: superlinea ? transformData(superlinea) : {},
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    setError,
  } = methods;

  useEffect(() => {
    if (superlinea) {
      setValue("denominacion", superlinea.denominacion || "");
      setValue("observacion", superlinea.observacion || null);
    }
  }, []);

  const onSubmit = async (formData: FormValues) => {
    let response: ResponsePost;
    try {
      if (superlinea) {
        const payload = { ...formData, usuarioUpdatedId: usuarioId };
        response = await SuperlineaService.actualizar(superlinea.id, payload);
      } else {
        const payload = { ...formData, usuarioCreatedId: usuarioId };
        response = await SuperlineaService.nuevo(payload);
      }
      onClose();
      onSuccess(response.mensaje);
    } catch (error) {
      applyApiErrorToForm(error, setError, (alert) => {
        setError("root", { type: "server", message: alert.message });
      });
    }
  };

  const handleOnClose = async () => {
    const confirmed = await showConfirmation({
      type: TipoAlertaConfirmacion.DEFAULT,
      title: TituloAlertaConfirmacion.DEFAULT,
      message:
        "¿Estás seguro de que quieres cerrar el formulario? NO se guardarán los cambios.",
      confirmText: "Aceptar",
      cancelText: "Cancelar",
      onConfirm: () => {},
    });
    if (confirmed) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 overflow-y-auto py-5">
      <Card className="relative w-full max-w-3xl bg-white mx-auto shadow-lg rounded-lg overflow-hidden mt-10 mb-12">
        <EncabezadoFormularios
          title={superlinea ? "Actualizar SuperLínea" : "Registrar SuperLínea"}
          subtitle={
            superlinea
              ? "Modifica los detalles de la SuperLínea."
              : "Ingresa los datos de la nueva SuperLínea."
          }
          icon={<Layers className="form-icon" />}
          onClose={handleOnClose}
        />

        <fieldset disabled={superlinea?.sistema === 1}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4">
                <div>
                  <FormInput
                    name="denominacion"
                    label="Denominación"
                    placeholder="Ingresa la denominación"
                  />
                </div>

                <div>
                  <FormInput
                    name="observacion"
                    label="Observación"
                    placeholder="Ingresa una observación (opcional)"
                  />
                </div>
              </CardContent>

              {errors.root?.message && (
                <div className="text-red-600 text-center mb-4">
                  {String(errors.root.message)}
                </div>
              )}

              <CardFooter className="flex justify-center">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-dark"
                >
                  {isSubmitting
                    ? superlinea
                      ? "Actualizando..."
                      : "Registrando..."
                    : superlinea
                      ? "Actualizar"
                      : "Registrar"}
                </Button>
              </CardFooter>
            </form>
          </FormProvider>
        </fieldset>
      </Card>

      <AlertasConfirmacion />
    </div>
  );
}