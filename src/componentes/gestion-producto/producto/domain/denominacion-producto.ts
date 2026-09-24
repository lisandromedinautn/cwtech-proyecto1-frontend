// Denominación automática (CR-005). La regla vive en el backend
// (Producto.generarDenominacionAutomatica, PA-031): en el alta, con
// `generarDenominacionAutomatica: true`, el backend arma "Marca Línea
// Presentación" y descarta cualquier denominación que reciba. La edición
// nunca la regenera.
//
// Acá solo se arma la vista previa que ve el usuario antes de registrar, con
// los datos tal como los cargó. No normaliza el contenido (1000 ml → 1 L,
// 1 unidades → 1 unidad): eso lo hace el dominio del backend al guardar, y
// copiarlo acá duplicaría la regla (PA-025 ya lo descartó).

export interface DatosVistaPreviaDenominacion {
  marca?: string | null;
  linea?: string | null;
  envase?: string | null;
  cantidad?: number | null;
  unidad?: string | null;
}

const texto = (valor?: string | null): string => (valor ?? "").trim();

// Devuelve null mientras falte alguno de los datos que usa el backend.
export const vistaPreviaDenominacion = (datos: DatosVistaPreviaDenominacion): string | null => {
  const partes = [texto(datos.marca), texto(datos.linea), texto(datos.envase), texto(datos.unidad)];
  if (partes.some((parte) => parte.length === 0) || datos.cantidad == null) return null;

  const [marca, linea, envase, unidad] = partes;
  return `${marca} ${linea} ${envase} ${datos.cantidad} ${unidad}`;
};
