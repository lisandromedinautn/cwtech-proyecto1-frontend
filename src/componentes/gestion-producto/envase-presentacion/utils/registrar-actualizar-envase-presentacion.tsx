import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CardContent, CardFooter, Card } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import FormInput from "../../../herramientas/formateo-de-campos/form-input";
import { Package } from "lucide-react";

import {
  FormValues,
  schema,
  transformData,
} from "../interfaces/interfaces-validaciones-envase-presentacion";
import EnvasePresentacionService from "../services/envase-presentacion-service";
import { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";
import { ResponsePost } from "../../../../interfaces/generales/interfaces-generales";
import { getUsuarioId } from "../../../../utils/auth";
import EncabezadoFormularios from "../../../ui/encabezadoFormularios";
import {
  TipoAlertaConfirmacion,
  TituloAlertaConfirmacion,
  useConfirmation,
} from "../../../herramientas/alertas/alertas-confirmacion";
import { applyApiErrorToForm, normalizeApiError } from "../../../../utils/errores";

// Alta y modificación de un envase. Se usa desde la página de envases y
// desde el formulario de producto (botón "+" del selector de envase).
export default function RegistrarActualizarEnvasePresentacionForm({
  envase,
  onClose,
  onSuccess,
}: {
  envase?: EnvasePresentacion;
  onClose: () => void;
  onSuccess: (mensajeAlerta: string) => void;
}) {
  const usuarioId = getUsuarioId();
  const { showConfirmation, AlertasConfirmacion } = useConfirmation();

  const methods = useForm<FormValues>({
    resolver: yupResolver(schema()) as any,
    defaultValues: envase ? transformData(envase) : {},
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
    setError,
  } = methods;

  const onSubmit = async (formData: FormValues) => {
    let response: ResponsePost;
    try {
      if (envase) {
        const payload = { ...formData, usuarioUpdatedId: usuarioId };
        response = await EnvasePresentacionService.actualizar(envase.id, payload);
      } else {
        const payload = { ...formData, usuarioCreatedId: usuarioId };
        response = await EnvasePresentacionService.nuevo(payload);
      }
      onClose();
      onSuccess(response.mensaje);
    } catch (error) {
      // Se muestra el mensaje del backend: el texto genérico de CONFLICTO
      // ("El recurso fue modificado por otra operación.") no explica un 409 por
      // denominación repetida ("Denominación ya en uso.").
      applyApiErrorToForm(error, setError, () => {
        setError("root", { type: "server", message: normalizeApiError(error).message });
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
          title={envase ? "Actualizar Envase" : "Registrar Envase"}
          subtitle={
            envase
              ? "Modifica los datos del envase."
              : "Ingresa los datos del nuevo envase de presentación."
          }
          icon={<Package className="form-icon" />}
          onClose={handleOnClose}
        />

        <fieldset disabled={envase?.sistema === 1}>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4">
                <div>
                  <FormInput
                    name="denominacion"
                    label="Denominación"
                    placeholder="Por ejemplo: Botella, Bolsa, Bolsón"
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
                    ? envase
                      ? "Actualizando..."
                      : "Registrando..."
                    : envase
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
