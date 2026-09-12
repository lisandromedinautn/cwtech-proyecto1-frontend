export const MARGEN_GENERAL = 15;

// Solo es una proyeccion visual; el backend calcula y persiste el precio final.
export const calcularPrecioEstimado = (costo: number, margen?: number | null) => {
  const margenResuelto = margen ?? MARGEN_GENERAL;
  return Math.round((costo * (1 + margenResuelto / 100) + Number.EPSILON) * 100000) / 100000;
};
