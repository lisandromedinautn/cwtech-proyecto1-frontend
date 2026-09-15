import { useEffect, useState } from "react";
import { useFiltrosContext } from "../../../../context/filtros-contesxt";
import { useFiltrosIniciales } from "../../../../hooks/useFiltrosIniciales";

export function useProductoFiltros() {
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);
  const filtrosInicialesConsultarProducto = useFiltrosIniciales("consultar-producto");
  const { setFiltrosNecesarios, setValoresFiltros, setBuscar } = useFiltrosContext();

  useEffect(() => {
    setBuscar({ cont: 0, componente: "consultar-producto" });
    setFiltrosNecesarios({
      denominacion: true,
      codigoProveedor: true,
      linea: true,
      marca: true,
      proveedor: true,
      conStock: true,
    });
    setValoresFiltros(filtrosInicialesConsultarProducto);
    setFiltrosInicializados(true);
  }, [filtrosInicialesConsultarProducto, setBuscar, setFiltrosNecesarios, setValoresFiltros]);

  return { filtrosInicializados };
}
