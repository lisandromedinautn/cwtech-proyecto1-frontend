# Nota técnica — SYS-011: configuración y filtros frontend inconsistentes

## Estado
Se corrigió la inconsistencia en el frontend que permitía sobrescribir valores de filtros por defaults o por limpieza accidental del estado.

## Qué se corrigió

### 1) Centralización de defaults
Se dejó una única fuente de verdad para los defaults de filtros en:
- [src/config/filtros-iniciales.ts](src/config/filtros-iniciales.ts)

Se agregó la función `getFiltrosInicialesPorModulo` para evitar que un módulo desconocido o no configurado fuerce un valor vacío o un default incorrecto.

### 2) Reset de filtros seguro
Se ajustó la lógica de limpieza del contexto global en:
- [src/context/filtros-contesxt.tsx](src/context/filtros-contesxt.tsx)

La intención es:
- si el módulo tiene defaults declarados, aplicarlos;
- si no existe configuración para ese módulo, no reemplazar el estado actual de manera accidental.

Esto evita el problema de "configuración remota reemplazada por defaults" y de "estado vacío por limpieza no controlada".

### 3) Eliminación de duplicación relevante
Se removió la doble inicialización en el flujo del módulo producto, con la carga concentrada en un único punto de entrada del hook para ese módulo:
- [src/componentes/gestion-producto/producto/hooks/use-producto-filtros.ts](src/componentes/gestion-producto/producto/hooks/use-producto-filtros.ts)

## Deuda técnica que queda

Queda pendiente la eliminación de hooks duplicados y la consolidación final de la inicialización de filtros para todos los módulos del frontend, no solo productos.

### Deuda específica
- Los hooks de inicialización de filtros siguen repartidos entre varios archivos y pantallas.
- La lógica de `setBuscar`, `setFiltrosNecesarios` y `setValoresFiltros` todavía se repite en varios módulos.
- El ideal es un único patrón reutilizable para:
  1. definir qué filtros muestra cada pantalla,
  2. cargar defaults por módulo,
  3. ejecutar reset/limpieza sin afectar estado ya cargado.

### Recomendación
Crear un helper o hook compartido de filtros por módulo, por ejemplo:
- `useInicializarFiltros(modulo)`
- o un reducer centralizado del contexto de filtros

Con esto se evita que cada pantalla vuelva a reimplementarse la misma secuencia de inicialización.

## Evidencia de validación
Se validó con una prueba específica del comportamiento de defaults y módulo no definido:
- [src/config/filtros-iniciales.test.ts](src/config/filtros-iniciales.test.ts)

Resultado verificado: 2 tests pasando, 0 fallos.
