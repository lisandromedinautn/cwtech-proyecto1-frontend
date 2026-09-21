import * as yup from "yup";
import { Proveedor } from "../../../../interfaces/gestion-organizacion/proveedor/interfaces-proveedor";
import { limpiarCuit } from "../../../herramientas/formateo-de-campos/cuit-input";

//===================== interfaces para las cosas que se van a ingresar en el formulario y es necesario validarlas ==========//

export interface FormValues {
  codigoProveedor?: string | null;
  denominacion: string;
  denominacionAfip?: string | null;
  cuit: string;
  observacion?: string | null;
  condicionIvaId: number;
  esProveedorGastos: boolean;
  esProveedorMateriaPrima: boolean;
  domicilio: {
    direccion: string;
    provinciaId: number;
    localidadId: number;
  };
}

//===================== schema de validacion ============================================//

export const schema = yup.object().shape({
  denominacion: yup
    .string()
    .trim()
    .lowercase()
    .required("La denominación es obligatoria.")
    .max(255, "Máximo 255 caracteres.")
    
    .matches(/^[A-Za-z0-9 %-_"'áéíóúÁÉÍÓÚñÑ./]+$/, "Solo se permiten letras, números y espacios."),

  denominacionAfip: yup.string().optional().nullable().max(255, "Máximo 255 caracteres."),
  codigoProveedor: yup.string().optional().nullable(),
  cuit: yup
    .string()
    .required("El CUIT es obligatorio.")
    .test(
      "cuit-max-length",
      "El CUIT no puede tener más de 11 dígitos.",
      (value) => !value || limpiarCuit(value).length <= 11,
    ),
  observacion: yup.string().optional().nullable(),
  condicionIvaId: yup.number().required("La Condicion Iva es obligatoria."),
  esProveedorGastos: yup.boolean().required(),
  esProveedorMateriaPrima: yup.boolean().required(),
  domicilio: yup.object({
    direccion: yup.string().required("Campo requerido"),
    localidadId: yup.number().typeError("Campo requerido").required(),
    provinciaId: yup.number().typeError("Campo requerido").required(),
  }).required(),
}).test(
  "al-menos-un-tipo",
  "Debe seleccionar al menos un tipo de proveedor (Gastos o Materia Prima).",
  function (values) {
    return values.esProveedorGastos === true || values.esProveedorMateriaPrima === true;
  },
);

//===================== transform data ============================================//

export const transformData = (proveedor: Proveedor): FormValues => {
  return {
    codigoProveedor: proveedor.codigo,
    denominacion: proveedor.denominacion,
    denominacionAfip: proveedor.denominacionAfip ?? null,
    cuit: proveedor.cuit ?? "",
    condicionIvaId: proveedor.condicionIvaId,
    observacion: proveedor.observacion ?? null,
    esProveedorGastos: proveedor.esProveedorGastos ?? false,
    esProveedorMateriaPrima: proveedor.esProveedorMateriaPrima ?? false,
    domicilio: {
      direccion: proveedor.domicilio?.direccion ?? "",
      provinciaId: proveedor.domicilio?.provinciaId ?? 1,
      localidadId: proveedor.domicilio?.localidadId ?? 1,
    },
  };
};
