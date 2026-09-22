// Envase de la presentación de un producto (CR-002): "BOTELLA", "BOLSA"...
// Catálogo que cargan los usuarios. Forma de EnvasePresentacionDto del backend.
export interface EnvasePresentacion {
  id: number;
  denominacion: string;
  observacion: string;
  sistema: number;
  deletedAt: string | null;
}

export interface SelectEnvasePresentacion {
  id: number;
  denominacion: string;
}

export interface DtoConsultarEnvasePresentacion {
  data: EnvasePresentacion[];
  total: number;
}
