// cambio-precios-masivo-service.ts
import axiosConfig from "../../../../utils/axiosConfig";
import axios from "axios";
import { createCrudService } from "../../../../utils/crudFactory";
import { FormValues } from "../../producto/interfaces/interfaces-validaciones-producto";


const apiUrl = axiosConfig.apiUrl;

const baseService = createCrudService<FormValues>("cambio-precios");

const normalizarPayload = (payload: {
  tipo: number;
  valor: number;
  alcance: "LINEA" | "GLOBAL";
  lineaId?: number;
  usuarioId?: number;
}) => ({
  ...payload,
  tipo: Number(payload.tipo),
  valor: Number(payload.valor),
  usuarioId: payload.usuarioId !== undefined ? Number(payload.usuarioId) : undefined,
  lineaId: payload.lineaId !== undefined ? Number(payload.lineaId) : undefined,
});

const CambioPreciosMasivoService = {
  ...baseService,

  aplicarCambios: async (payload: {
    tipo: number;
    valor: number;
    alcance: "LINEA" | "GLOBAL";
    lineaId?: number;
    usuarioId?: number;
  }) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payloadNormalizado = normalizarPayload(payload);

      const { data } = await axios.post(
        `${apiUrl}/producto/cambio-precios-masivo/preview`,
        payloadNormalizado,
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
    usuarioId?: number;
  }) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const payloadNormalizado = normalizarPayload(payload);

      const { data } = await axios.post(
        `${apiUrl}/producto/ajustar-precios-masivo`,
        payloadNormalizado,
        { headers }
      );
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default CambioPreciosMasivoService;