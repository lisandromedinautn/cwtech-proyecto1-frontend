// cambio-precios-masivo-service.ts
import axiosConfig from "../../../../utils/axiosConfig";
import axios from "axios";
import { createCrudService } from "../../../../utils/crudFactory";
import { FormValues } from "../../producto/interfaces/interfaces-validaciones-producto";


const apiUrl = axiosConfig.apiUrl;

const baseService = createCrudService<FormValues>("cambio-precios");

const CambioPreciosMasivoService = {
  ...baseService,

  aplicarCambios: async (payload: {
    tipo: number;
    valor: number;
    alcance: "LINEA" | "GLOBAL";
    lineaId?: number;
  }) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const { data } = await axios.post(
        `${apiUrl}/producto/cambio-precios-masivo/preview`,
        payload,
        { headers }
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  guardarCambios: async (payload: {
    tipo: number;
    valor: number;
    alcance: "LINEA" | "GLOBAL";
    lineaId?: number;
  }) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const { data } = await axios.post(
        `${apiUrl}/producto/cambio-precios-masivo/confirmar`,
        payload,
        { headers }
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default CambioPreciosMasivoService;