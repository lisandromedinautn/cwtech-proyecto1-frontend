import { SelectSublinea } from "../sublinea/interfaces-sublinea";
import { SelectSuperlinea } from "../superlinea/interfaces-superlinea";

export interface Linea {
  id: number;
  denominacion: string;
  observacion: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
  usuarioCreatedId: number;
  usuarioUpdatedId: number;
  superlineaId: number;
  superlineaDenominacion?: string;
  superlinea?: SelectSuperlinea;
  sublineas: SelectSublinea[];
  sistema: number;
  stockMinimo: number | null;
  utilizaStockMinimo: boolean | null;
  porcentajeOcasional: number;
  porcentajeMayorista: number;
  porcentajeCliente: number;
}

export interface DtoConsultarLinea {
  data: ConsultarLinea[];
  total: number;
}

export interface ConsultarLinea {
  id: number;
  denominacion: string;
}

export interface SelectLinea {
  id: number;
  denominacion: string;
}

export interface LineaAgrupada {
  superlineaId: number;
  superlineaDenominacion: string;
  lineas: Linea[];
  total: number;
}