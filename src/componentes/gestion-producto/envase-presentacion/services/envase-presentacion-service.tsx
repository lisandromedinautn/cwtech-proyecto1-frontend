import { createCrudService } from "../../../../utils/crudFactory";
import ApiService from "../../../../utils/apiService";
import { FormValues } from "../interfaces/interfaces-validaciones-envase-presentacion";
import type { SelectEnvasePresentacion } from "../../../../interfaces/gestion-producto/envase-presentacion/interfaces-envase-presentacion";

const baseService = createCrudService<FormValues>("envase-presentacion");

const EnvasePresentacionService = {
  ...baseService,

  // Envases activos para el selector del formulario de producto.
  obtenerSelect: (denominacion: string): Promise<{ data: SelectEnvasePresentacion[]; total: number }> =>
    ApiService.get("/envase-presentacion/select", denominacion.trim() ? { denominacion } : {}),
};

export default EnvasePresentacionService;
