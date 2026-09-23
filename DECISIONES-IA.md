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

## [2026-09-23] PA-020 — Filtro "Exacto" de producto: booleanos de query, búsqueda rápida solo por código y filtro lateral acumulable

- **Tarjeta / CR:** PA-020 (rama `Pa-020-Testing`); hallazgos 6 y 7 del informe de testing del equipo
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: analizar a fondo el checkbox "Exacto" de la pantalla de productos, presente en el
buscador rápido del header y en el filtro lateral. Síntomas reportados: al clickear el "Exacto"
del header la aplicación "explota"; en el filtro lateral la búsqueda exacta anda, pero al
destildarlo y buscar "DEMO" no trae nada. El informe de un colega señalaba además que la búsqueda
no exacta del header también buscaba por denominación. Después del análisis, el equipo decidió:
la búsqueda rápida es **únicamente por código**; el filtro lateral es **acumulable (AND)**; dejar
las decisiones documentadas en este archivo (y crear uno equivalente en el back).

### Respuesta / propuesta de la IA

Reprodujo los dos síntomas contra el backend local y encontró una **única causa raíz en el back**,
no en la generalización del filtro lateral:

- `main.ts` usa `ValidationPipe` con `enableImplicitConversion: true`. Con `class-transformer`
  0.5.1 esa conversión corre **antes** del `@Transform` del DTO y hace `Boolean("false") === true`.
  El `@Transform` nunca recibe el string original.
- Header (`GET /producto/search-by-rapido`): el `@Transform` de `exacto` solo aceptaba los strings
  `'true'`/`'false'`, recibía un booleano y devolvía `undefined`, así que el endpoint respondía
  **400 siempre**, con `exacto` en `true` o en `false`. En el front, `handleBuscarProductosRapido`
  no tenía `try/catch`: `setLoading(false)` nunca se ejecutaba y la pantalla quedaba en
  "Cargando productos..." con el header desmontado. Eso era el "explota".
- Filtro lateral (`GET /producto/search-by`): `codProveedorExacto=false` llegaba como `true`, por lo
  que **siempre buscaba exacto** (`= 'DEMO'` en vez de `LIKE '%DEMO%'`). `conStock` tenía el mismo
  `@Transform` que `exacto`, así que "Solo con stock" nunca se aplicaba.
- Además, el filtro lateral unía denominación, código y código de referencia con `OR`, y la
  búsqueda rápida no exacta incluía `denominacion`.

Propuso un decorador compartido `@ToBoolean()` que lee el valor crudo (`obj[key]`), corregir la
semántica de ambas queries y agregar manejo de errores en el front. Dejó al equipo las decisiones
de semántica.

### Decisión tomada

- **Búsqueda rápida (header): solo por código.** Exacto → `codigoProveedor = :codigo OR
  codigoReferencia = :codigo`. No exacto → `LIKE '%codigo%'` sobre esos mismos dos campos. Se quitó
  `denominacion`: para eso está el filtro de denominación.
- **Filtro lateral: acumulable.** Cada criterio cargado se agrega con `AND` (denominación, código
  de proveedor, código de referencia, línea, marca, proveedor, con stock).
- **Booleanos de query:** nuevo `@ToBoolean()` en el back, aplicado a `exacto`,
  `codProveedorExacto`, `codReferenciaExacto` y `conStock`.
- **Front:** `handleBuscarProductos` y `handleBuscarProductosRapido` ahora usan
  `try/catch/finally`. Ante un error vacían la tabla, muestran una alerta con el mensaje del backend
  y siempre apagan el `loading`.

### Qué se descartó y por qué

- **Arreglarlo en el front (mandar `1`/`0` o no mandar el flag):** esconde el bug. Cualquier otro
  cliente, o Swagger, seguiría recibiendo `false` como `true`.
- **Sacar `enableImplicitConversion` de `main.ts`:** es global, y otros DTOs dependen de él para
  convertir números de la query sin `@Type`. El riesgo de romper otros endpoints era alto para este
  alcance.
- **Mantener `denominacion` en la búsqueda rápida:** el input dice "Código..." y el equipo definió
  que es solo por código.
- **Mantener el `OR` en el filtro lateral:** con varios criterios cargados devolvía la unión y no
  la intersección, contra lo que espera un filtro combinado.
- **Culpar a la generalización del filtro lateral:** la decisión de abandonarlo sigue en pie, pero
  el bug estaba en el DTO del back. Sacar solo el sidebar habría dejado el header tirando 400.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

Frontend:
- `src/componentes/gestion-producto/producto/utils/consultar-producto.tsx`: manejo de errores en las
  dos búsquedas (`notificarErrorBusqueda`).

Backend (detalle en `DECISIONES-IA.md` del back):
- Nuevo `src/modules/common/decorators/to-boolean.decorator.ts`.
- `producto/dto/search-producto-rapido.dto.ts` y `search-producto-pagination-with.dto.ts`: usan
  `@ToBoolean()`.
- `producto/infraestructure/repositories/producto.persistence-adapters.ts`: `findBy` con `AND`;
  `findByRapido` sin `denominacion`.
- `producto/application/controllers/producto.http.spec.ts`: el `ValidationPipe` del test ahora
  replica el de `main.ts` (`enableImplicitConversion`), más 5 tests de regresión.

Contrato: los endpoints y DTOs no cambian de forma, pero sí de **resultado**. La búsqueda rápida ya
no matchea por denominación, y el filtro lateral con varios criterios devuelve la intersección.

### Verificación

- Back: `jest` con 49 suites y 185 tests en verde (antes 180). Los 5 tests nuevos se corrieron
  también **sin** el fix de los DTOs: 4 fallan, lo que confirma que detectan el bug.
- Back, en vivo contra el server local con el usuario `administrador@gmail.com`:
  `search-by-rapido` responde 200 con `exacto` en `true` y en `false`; `ACE` no exacto trae
  `ACE-001` y `aceite` ya no trae nada (no busca por denominación); en `search-by`,
  `codProveedorExacto=false` hace `LIKE` y `denominacion=ACEITE` + `codigoProveedor=HAR` devuelve 0
  (intersección).
- Front: `vitest run` con 11 archivos y 35 tests en verde. `tsc --noEmit -p tsconfig.app.json` da
  125 errores antes y después, ninguno nuevo. ESLint no marca nada nuevo; los 3 `no-empty` de
  `consultar-producto.tsx` son preexistentes (`finally {}` vacíos de `fetchLineas`, `fetchMarcas`
  y `fetchProveedores`).
- **Sin verificar:** la pantalla en el navegador (no hubo prueba manual de la UI en esta sesión) y
  el caso de `conStock=true` con productos sin stock (los datos semilla tienen stock en todos). No
  hay test de front para `consultar-producto.tsx`.

### Deuda técnica detectada y no resuelta

- `incluirEliminados` usa el mismo patrón roto (`value === 'true' || value === true`) en
  `pagination-with-denominacion.dto.ts`, `denominacion-empresa-operador.dto.ts` y
  `search-localidad.dto.ts`: mandar `false` equivale a `true`. Se arregla con `@ToBoolean()`, pero
  queda fuera del alcance de producto.
- `codReferenciaExacto` se recibe en `search-by` pero el controller lo ignora; la referencia
  siempre va con `LIKE`.
- **Paginación y foco en `consultar-producto.tsx`.** El equipo decidió no corregirlos en esta
  tarjeta y dejarlos como deuda técnica explícita:
  - `resetearPaginacion()` no afecta al request que sale en la misma llamada: usa el `skip`
    anterior, así que una búsqueda lanzada desde la página 3 pide el offset de la página 3.
  - El effect de paginación siempre llama a `handleBuscarProductos` (filtro lateral), nunca a la
    búsqueda rápida. Al paginar después de una búsqueda rápida se pierde ese filtro. Además,
    cuando `resetearPaginacion` cambia `paginaActual`, dispara una segunda búsqueda que pisa los
    resultados de la rápida.
  - Mientras `loading` es `true`, el spinner reemplaza todo el card, header incluido. El input de
    código se desmonta y pierde el foco en cada búsqueda con debounce.
- El buscador de productos reutilizable (`busqueda-producto.tsx`) llama a endpoints
  `search-productos-by-rapido` de otros módulos que el back actual no expone.
