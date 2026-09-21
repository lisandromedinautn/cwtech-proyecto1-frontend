import { createCrudService } from "../../../../utils/crudFactory";
import { FormValues } from "../interfaces/interfaces-validaciones-superlinea";

const baseService = createCrudService<FormValues>("superlinea");

const SuperlineaService = {
  ...baseService,
};

export default SuperlineaService;