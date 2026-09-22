import * as yup from "yup";
import { EnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";

//===================== schema de validacion ============================================//
// Mismas reglas de forma que el DTO del backend (CreateEnvasePresentacionDto).

export const schema = () =>
  yup.object().shape({
    denominacion: yup
      .string()
      .trim()
      .lowercase()
      .required("La denominación es obligatoria.")
      .max(255, "La denominación no puede superar los 255 caracteres.")
      .matches(/^[A-Za-z0-9 áéíóúÁÉÍÓÚñÑ]+$/, "Solo se permiten letras, números y espacios."),
    observacion: yup.string().nullable().optional(),
  });

export type FormValues = yup.InferType<ReturnType<typeof schema>>;

//===================== transform data ============================================//

export const transformData = (envase: EnvasePresentacion): FormValues => {
  return {
    denominacion: envase.denominacion,
    observacion: envase.observacion || null,
  };
};
