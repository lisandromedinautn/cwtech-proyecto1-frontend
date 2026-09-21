# Registro de decisiones asistidas por IA

Bitácora de trazabilidad exigida por la consigna (UTN — Ingeniería y Calidad de Software,
Proyecto 1). Se registra **una entrada por decisión significativa**, según los criterios de
[`CLAUDE.md`](CLAUDE.md).

Las entradas se agregan **al final**, en orden cronológico. No se reescribe la historia: si una
decisión se revierte, se agrega una entrada nueva que la revierte y se enlaza a la anterior.

---

## Plantilla

Copiar y completar. Los campos vacíos se dejan como `—`, no se borran.

```markdown
## [AAAA-MM-DD] ID — Título corto de la decisión

- **Tarjeta / CR:** PA-xxx, SYS-xxx, CR-00x o "ninguna"
- **Herramienta:** (modelo y versión, ej. Claude Opus 5 vía Claude Code)
- **Autor/a que condujo la sesión:** nombre
- **Link a la conversación:** URL, o "no disponible (CLI)"

### Prompt

Transcripción del pedido (o su síntesis fiel si fue largo — indicar si está resumido).

### Respuesta / propuesta de la IA

Qué propuso, en qué alternativas se abrió.

### Decisión tomada

Qué se aceptó y qué se implementó realmente.

### Qué se descartó y por qué

Lo más importante de la entrada. Alternativas evaluadas y motivo del rechazo.

### Modificaciones sobre lo generado

Qué hubo que corregir, ajustar o reescribir a mano.

### Impacto

Archivos, migraciones, endpoints, tests tocados.

### Verificación

Cómo se comprobó que funciona. Qué quedó **sin** verificar.
```

---

# Entradas

## [2026-09-18] PA-019 — Historial de precios por producto, en un modal de solo consulta

- **Tarjeta / CR:** PA-019 (consume el endpoint de historial de CR-007)
- **Herramienta:** Claude Opus 5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible

### Prompt
Síntesis: implementar en el frontend la visualización del historial de precios de un producto,
tomando como base la referencia funcional del backend (`GET /producto/:id/historial-precios`),
sin tocar el backend, trabajando solo en la rama `PA-019-Mostrar-historial-de-precios-frontend`
y preguntando ante cualquier duda. Criterios: consultar el historial por producto; mostrar precio
anterior, nuevo, fecha y motivo; contemplar los estados vacío, carga y error; mostrar como
confirmados solo los cambios persistidos por el backend; testear el flujo principal.

### Respuesta / propuesta de la IA
Relevó el frontend y encontró un esqueleto sin terminar: estado `mostrarHistorialPrecios`, un
handler que pedía el producto sin manejar errores, el ícono `History` importado sin botón y unas
interfaces de plantilla que no coincidían con el backend. Confirmó el contrato leyendo el backend
sin modificarlo. Propuso un botón "Historial de precios" en las acciones del producto que abre un
modal de solo consulta, paginado con el componente `Paginacion`, y consultó cuatro dudas:
alcance, permisos, forma de verificar y cierre.

### Decisión tomada
El equipo eligió: botón + modal de solo consulta; visible solo para Administrador; verificar
también contra el backend local levantado; dejar los cambios sin commitear, con esta entrada.

- `HistorialPreciosModal` consulta al abrirse y al cambiar de página. Tiene estados de carga,
  vacío y error (con "Reintentar"), y una tabla con fecha y hora, precio anterior, precio nuevo y
  motivo.
- Solo muestra lo que devuelve la última consulta exitosa: no agrega filas por su cuenta; mientras
  carga o ante un error no deja datos anteriores a la vista; y descarta las respuestas de
  consultas viejas (bandera `vigente` en el efecto).
- `ProductoService.obtenerHistorialPrecios(id, skip, take)` y las interfaces del contrato real.
- Botón en `ProductoActions` (tabla de escritorio) y en `DatosCard` (vista de tarjetas), solo
  para Administrador (`puedeHacerAcciones`).
- El handler abre el modal con los datos de la fila, sin volver a pedir el producto, y al cerrarlo
  ya no borra los filtros de búsqueda.

### Qué se descartó y por qué
- **Sumar la acción "cambiar precio" (`POST /cambiar-precio`):** amplía el alcance de PA-019; el
  equipo pidió solo consulta.
- **Mostrar el historial dentro del formulario de edición:** mezcla consulta con edición; el
  precedente del proyecto (ajuste de stock) usa un modal por acción.
- **Habilitar el botón también para Root:** en los datos semilla el id 5, que el front llama
  `ROOT`, es el rol "Admin", al que el backend le respondería 403.
- **Conservar el handler del esqueleto, que pedía el producto antes de abrir:** sumaba una
  consulta sin manejo de errores y no aportaba nada que el modal necesite.
- **Mostrar el usuario que hizo el cambio:** el backend solo devuelve `usuarioId`; un id no le
  dice nada al usuario y no era criterio de aceptación.
- **Dejar visibles los datos de la página anterior mientras carga la siguiente:** podrían leerse
  como vigentes, contra el criterio de mostrar solo lo confirmado.

### Modificaciones sobre lo generado
Ninguna por ahora; pendiente de revisión del equipo.

### Impacto
- Nuevos: `src/componentes/gestion-producto/producto/modales/historial-precios-modal.tsx` y los
  tests `modales/historial-precios-modal.test.tsx`, `modales/producto-modales.test.tsx` y
  `componentes/producto-action.test.tsx`.
- Modificados: `utils/consultar-producto.tsx`, `modales/producto-modales.tsx`,
  `componentes/producto-action.tsx`, `componentes/datos-tabla.tsx`, `componentes/datos-card.tsx`,
  `services/producto-service.tsx` y
  `src/interfaces/gestion-producto/historial-precios/interfaces-historial-precios.tsx`, donde se
  reemplazaron las interfaces de plantilla, que no se usaban.
- Backend: sin cambios.

### Verificación
- `vitest run`: 8 archivos y 19 tests en verde (antes 5 y 11).
- `tsc --noEmit -p tsconfig.app.json`: 127 errores antes y después; ninguno nuevo, todos
  preexistentes.
- ESLint sin errores en los archivos nuevos. En `producto-service.tsx` sigue un `no-useless-catch`
  preexistente en `obtenerMobile`.
- Prueba manual de punta a punta contra el backend local (`develop` @ `2ffe47d`, con sus
  migraciones aplicadas en la base local) usando un producto de prueba con 3 cambios de precio
  cargados por SQL: el modal mostró los 3 cambios, del más reciente al más antiguo, con fecha,
  precios y motivo correctos. `GET /producto/1/historial-precios?skip=0&take=10` respondió 200.
- En desarrollo cada apertura dispara dos requests por el `StrictMode` de React; la primera se
  descarta.
- **Sin verificar a mano:** la vista de escritorio (la prueba se hizo en la vista de tarjetas por
  el ancho del panel; el botón de la tabla está cubierto por el test de `ProductoActions`), y el
  estado de error y la paginación contra el backend real (cubiertos por tests con el servicio
  mockeado).

## [2026-09-21] PA-028 — SuperLínea en frontend: CRUD, selector obligatorio en Línea y filtro por SuperLínea

- **Tarjeta / CR:** PA-028 (CR-003)
- **Herramienta:** Claude Opus 5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: implementar en el frontend la incorporación de SuperLínea según US-03 / CR-003, tomando como base el handoff de PA-027. Criterios: la UI permite seleccionar y visualizar la SuperLínea de una Línea; cada Línea muestra una única SuperLínea; no se permite guardar una Línea sin SuperLínea; la UI no ofrece asociaciones múltiples; los formularios consumen el contrato backend real y contemplan carga, vacío y error; tests cubren el flujo principal. Mantener Clean Architecture y DDD. Entrega por etapas, archivos completos, sin documento .md.

### Respuesta / propuesta de la IA

Propuesta por etapas:
1. Tipos y servicios HTTP (interfaces `Superlinea` y `Linea` alineadas al contrato flat del backend; `superlinea-service.tsx`).
2. Módulo CRUD completo de SuperLínea (schema yup, hook de modal, filtros, tabla, cards, headers, form, modal, pantalla).
3. Selector obligatorio de SuperLínea en el form de Línea + columna/campo en las vistas de Línea.
4. Filtro por SuperLínea en el listado de Líneas.
5. Ruta y menú (`App.tsx`, `menuItems-definicion.ts`).
6. Tests (form de SuperLínea y DatosCards).

La IA propuso además no reimplementar en el frontend las invariantes del backend (existencia de SuperLínea, unicidad de denominación, reasignación al eliminar), sino consumir 400/404/409 con el contrato de PA-012.

### Decisión tomada

Se implementaron las 6 etapas. Puntos clave:

- `Linea` en el frontend refleja el contrato flat del backend: `superlineaId: number` y `superlineaDenominacion?: string`. Se mantiene `superlinea?: SelectSuperlinea` como opcional por compatibilidad.
- El selector `SuperlineasSelector` es **single** y obligatorio (`yup.required()`). Refleja la regla de negocio en la UI, no la reemplaza: el backend rechaza con 400 si falta.
- "Sin clasificar" se muestra con un `<Badge variant="secondary">Sistema</Badge>` y se deshabilitan editar/eliminar por `sistema === 1`. El form de SuperLínea también envuelve todo en `<fieldset disabled={sistema === 1}>`.
- El mensaje de eliminación avisa que las Líneas se reasignan a "Sin clasificar". La reasignación la hace el backend; la UI solo la comunica.
- El filtro por SuperLínea en el listado de Líneas usa el endpoint existente `/linea/search-by?superlineaId=`.
- Se usa `applyApiErrorToForm` (de PA-013) en el form de SuperLínea. En el form de Línea se mantiene `parseApiError` para no romper el patrón existente.

### Qué se descartó y por qué

- **Modelar el selector como multi-select:** contradice la regla "una Línea pertenece a una única SuperLínea" y el AC "La UI no ofrece ni aparenta asociaciones múltiples".
- **Mantener `superlinea: SelectSuperlinea` nested como única forma:** el backend devuelve flat; el nested obligaría a una segunda request o a una transformación frágil. Se mantiene como opcional por compatibilidad, no como fuente de verdad.
- **Reimplementar unicidad de denominación o existencia de SuperLínea en el frontend:** son invariantes del backend; se consumen con 409 y 404.
- **Reutilizar `crudFactory` completo:** los métodos de impresión apuntan a endpoints que el backend no expone. La pantalla de SuperLínea no ofrece imprimir. Si se quiere, se agrega después con su endpoint.
- **Vista agrupada (`/linea/agrupadas-por-superlinea`):** el endpoint existe, pero mostrarla es un rediseño del listado. Queda como deuda técnica explícita para PA-030 o una iteración aparte.
- **Test de `DatosTabla`:** usa AG Grid y requiere setup de `ResizeObserver`/`matchMedia`. Se cubre la misma lógica con `DatosCards`, que renderiza JSX puro.
- **Excluir "Sin clasificar" del selector de Línea:** se decidió mostrarla, porque el backend la asigna a las Líneas existentes y el usuario necesita verla y poder asignarla si corrige una clasificación.

### Modificaciones sobre lo generado

- **Schema de SuperLínea como función**: el schema original como objeto plano rompía el resolver de `@hookform/resolvers/yup` v4 con el error `TypeError: o[...] is not a function`. Se cambió a `export const schema = () => yup.object().shape({...})` y `yupResolver(schema())`, siguiendo el patrón de Linea. Fue el único cambio de fondo sobre la propuesta inicial.
- **`disabled={row.sistema}` → `disabled={row.sistema === 1}`** en `datos-tabla.tsx` y `datos-card.tsx` de Línea. Era un error de tipos preexistente (`sistema: number` vs `disabled: boolean`) que el build de PA-028 puso en evidencia.

### Impacto

Frontend:
- Nuevos: `src/interfaces/gestion-producto/superlinea/` (interfaces), `src/componentes/gestion-producto/superlinea/` (services, interfaces, hooks, componentes, modales, utils) y los tests `.../componentes/datos-card.test.tsx` y `.../utils/registrar-actualizar-superlinea.test.tsx`.
- Modificados: `interfaces-linea.tsx`, `interfaces-superlinea.tsx`, `registrar-actualizar-linea.tsx`, `interfaces-validaciones-linea.tsx`, `datos-tabla.tsx` y `datos-card.tsx` de Línea, `filtros-linea.tsx`, `consultar-linea.tsx`, `App.tsx`, `menuItems-definicion.ts`.

Backend: sin cambios en esta tarjeta.
