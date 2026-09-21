import axios from "axios";
import axiosConfig from "../../../../utils/axiosConfig";

import { createCrudService } from "../../../../utils/crudFactory";
import { FormValues } from "../interfaces/interfaces-validaciones-producto";
import ApiService from "../../../../utils/apiService";
import type { HistorialPreciosPaginado } from "../../../../interfaces/gestion-producto/historial-precios/interfaces-historial-precios";


const apiUrl = axiosConfig.apiUrl;

const baseService = createCrudService<FormValues>("producto");

export interface AjusteStockManualPayload {
  cantidad: number;
  motivo: string;
  usuarioId: number;
}

const ProductoService = {
  ...baseService,

  ajustarStockManual: (id: number, payload: AjusteStockManualPayload) =>
    ApiService.post(`/producto/${id}/ajustar-manual`, payload),

  obtenerHistorialPrecios: (id: number, skip: number, take: number): Promise<HistorialPreciosPaginado> =>
    ApiService.get(`/producto/${id}/historial-precios`, { skip, take }),

  
  obtenerMobile: async (filtros: any) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const { data } = await axios.get(`${apiUrl}/producto/search-by-mobile`, { headers, params: filtros });

      return data;
    } catch (error) {
      throw error;
    }
  },

  actualizarPreciosProducto: async (id: number, payload: any) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      console.log(">> PATCH iniciado a:", `${apiUrl}/producto/${id}/precios`);
      console.log(">> Payload PATCH:", payload);

      const result = await axios.patch(`${apiUrl}/producto/${id}/precios`, payload, { headers });
      console.log(">> PATCH terminado con éxito:", result);
      return result;
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw error;
    }
  },

  calcularPreciosConPorcentaje: async (
    productoId: number,
    baseImponible: number,
    porcentajeOcasional: number,
    porcentajeMayorista: number,
    porcentajeCliente: number,
  ) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const body = {
        productoId,
        baseImponible,
        porcentajeOcasional,
        porcentajeMayorista,
        porcentajeCliente,
      };

      const { data } = await axios.post(`${apiUrl}/producto/calcular-precio-item`, body, { headers });

      console.log("Respuesta de la API en calcular importes:", data);
      return data;
    } catch (error) {
      console.error("Error al calcular precios:", error);
      return null;
    }
  },

  calcularPreciosEnCrearProducto: async (
    alicuotaIva: number,
    baseImponible: number,
    porcentajeOcasional: number,
    porcentajeMayorista: number,
    porcentajeCliente: number,
  ) => {
    try {
      const token = localStorage.getItem("Token");
      const headers = {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      };

      const body = {
        alicuotaIva,
        baseImponible,
        porcentajeOcasional,
        porcentajeMayorista,
        porcentajeCliente,
      };

      const { data } = await axios.post(`${apiUrl}/producto/calcular-precio-item-from-nuevo`, body, { headers });

      console.log("Respuesta de la API en calcular importes:", data);
      return data;
    } catch (error) {
      console.error("Error al calcular precios:", error);
      return null;
    }
  },

  calcularPrecioConFlete: async (
    precio: number,
    tipo: number,
    valor: number,
  ): Promise<{ precioConFlete: number }> => {
    const token = localStorage.getItem("Token");
    const headers = {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };
    const { data } = await axios.post(
      `${apiUrl}/producto/calcular-precio-con-flete`,
      { precio, tipo, valor },
      { headers },
    );
    return data;
  },
};

export default ProductoService;
