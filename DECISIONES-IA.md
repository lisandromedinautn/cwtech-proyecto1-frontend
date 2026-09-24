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

## [2026-09-21] PA-049 — Fondo del select de SuperLínea en admin

- **Tarjeta / CR:** PA-049
- **Herramienta:** OpenCode, openai/gpt-5.6-terra
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: en `/admin/linea`, al abrir el selector del filtro de SuperLíneas, las opciones deben
tener un fondo visible porque actualmente se muestran sin fondo.

### Respuesta / propuesta de la IA

Se identificó que el filtro usa `SelectContentUI`, cuyo color temático `bg-popover` no resultaba
visible en esta pantalla. Se propuso aplicar un fondo explícito solo a ese desplegable.

### Decisión tomada

Se agregaron las clases `bg-white dark:bg-slate-900` al `SelectContentUI` de
`SuperlineaFiltro`. Así se preserva un fondo opaco y consistente en los temas claro y oscuro.

### Qué se descartó y por qué

- **Modificar el componente base `SelectUI`:** afectaría todos los selects del sistema cuando el
  defecto visual solo fue reportado en el filtro de SuperLíneas.
- **Cambiar variables globales de tema:** amplía el alcance y puede modificar popovers ajenos al
  ticket.

### Modificaciones sobre lo generado

—

### Impacto

- Modificado: `src/componentes/gestion-producto/superlinea/componentes/superlinea-filtro.tsx`.
- Backend, migraciones y endpoints: sin cambios.

### Verificación

- `yarn build`: correcto.
- `git diff --check`: correcto.
- `yarn lint`: sigue fallando por 21 errores preexistentes fuera de este archivo.
- Sin verificación manual en navegador.

## [2026-09-22] PA-025 — Presentación del producto y ABM de envases en frontend

- **Tarjeta / CR:** PA-025 (CR-002 / US-02; consume el contrato de PA-024 del backend)
- **Herramienta:** Claude Opus 5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible

### Prompt
Síntesis: implementar en el frontend (1) el ABM de "Envase de presentación", como una opción
más de Gestión Productos > Configuración junto a Marca y Líneas, con la posibilidad de crear un
envase desde el formulario de producto; y (2) el campo Presentación (envase, valor y unidad de
medida) debajo de los selectores de marca y línea del formulario de producto. Criterios de
aceptación: alta y edición de producto con presentación; listados y detalle la muestran; la UI
respeta las validaciones del contrato del backend; tests del alta y la edición. Pedido posterior:
mostrar la presentación también en la tabla de "Cambio de precios masivo".

### Respuesta / propuesta de la IA
Relevó el front y encontró: el ABM de SuperLínea (el más reciente, con tests y sin botones de
impresión) como patrón; `EntidadSelectorBase` como selector con búsqueda y botón "+"; un
`presentacion-selector.tsx` y unas interfaces de presentación de la plantilla, sin uso; inputs
numéricos con coma decimal; y que los inputs existentes leen errores con `errors[name]`, que no
funciona con nombres anidados como `presentacion.cantidad`. Propuso copiar el patrón de
SuperLínea para el ABM y un componente propio para la presentación, y consultó el formato
decimal, la obligatoriedad en la edición, la presentación en el listado y el nombre de la rama.

### Decisión tomada
- **ABM de envases** (`componentes/gestion-producto/envase-presentacion/`): página, formulario
  reutilizable, modal, tabla, tarjetas, encabezados y filtros; menú Configuración > Envases y
  ruta `/admin/envase-presentacion` con la misma protección que Marca.
- **Componente `PresentacionProducto`**: selector de envase (`EntidadSelectorBase`, con "+" para
  crear un envase), valor y unidad. El valor se escribe con **punto decimal**, sin separador de
  miles y con hasta 2 decimales, como el texto "1.5 L" de PA-023. La unidad sale de una lista
  fija con los valores del contrato (`ml`, `L`, `g`, `kg`, `unidades`).
- **Obligatoriedad** (igual que el backend): obligatoria en el alta y en los productos que ya
  tienen presentación. En los productos anteriores es **opcional**, pero si se completa un campo
  hay que completar los tres. La presentación nunca se envía como `null` y los números viajan
  como `number`, porque el backend exige tipos estrictos.
- **Validaciones:** el front solo exige los tres campos y su formato. Las reglas del contenido
  (mayor a 0, decimales por unidad, máximos) las valida el backend. Sus errores
  `PRESENTACION_INVALIDA` y `PRESENTACION_REQUERIDA` se muestran junto a la presentación, y los
  errores de `VALIDACION_DTO` con `field: "presentacion.x"` van al campo correspondiente.
- **Listados:** columna "Presentación" en la tabla de productos y en la de cambio de precios
  masivo, y una línea en las tarjetas; "—" si el producto no tiene. En la edición, el formulario
  la precarga.

### Qué se descartó y por qué
- **Copiar el ABM de Marca:** tiene botones de impresión que llaman a endpoints que no existen en
  el backend y un manejo de errores más viejo. SuperLínea es el patrón vigente.
- **Coma decimal, como los demás inputs:** el texto que devuelve el backend usa punto ("1.5 L") y
  PA-023 rechaza el separador de miles; con coma, la carga y lo que se muestra no coincidirían.
- **Presentación obligatoria en toda edición:** obligaría a completar el catálogo antes de poder
  hacer cualquier cambio en un producto viejo; el backend tampoco lo exige.
- **Repetir en React las reglas R1 a R4:** según el `CLAUDE.md`, las reglas de negocio viven en el
  backend. Duplicarlas corre el riesgo de que las dos versiones diverjan.
- **Mostrar una vista previa del texto normalizado ("1000 ml" → "1 L"):** requería copiar en el
  front la normalización N2 del dominio.
- **Reutilizar `presentacion-selector.tsx`:** modelaba la presentación como una entidad con id,
  que es justo lo que PA-023 descartó; se reemplazó por `PresentacionProducto` y se borró junto
  con sus interfaces, que no usaba nadie más.

### Modificaciones sobre lo generado
- El test del 409 mostró que `utils/errores` traduce cualquier `CONFLICTO` a "El recurso fue
  modificado por otra operación.", que no explica una denominación repetida. En el formulario
  de envase se muestra el mensaje del backend ("Denominación ya en uso."). `utils/errores` no se
  tocó porque lo usan otras pantallas.
- `armarPayloadProducto` se movió del archivo del componente a
  `interfaces-validaciones-producto.tsx`: exportarlo desde el componente rompía el Fast Refresh.
- El `HeaderLg` de envases incluye el botón de alta, que el de SuperLínea no tiene; en celular es
  la única forma de crear un envase.
- A pedido del usuario, después de su prueba manual, se agregó la presentación a la tabla de
  cambio de precios masivo.

### Impacto
- Nuevos: `componentes/gestion-producto/envase-presentacion/` (servicio, esquema, hook, página,
  formulario y su test, modal, tabla, tarjetas, encabezados y filtros),
  `interfaces/gestion-producto/envase-presentacion/`,
  `producto/componentes/configuracion/presentacion-producto.tsx`,
  `producto/domain/presentacion-producto.ts`, `producto/componentes/datos-card.test.tsx` y
  `menu/menuItems-definicion.test.ts`.
- Modificados: `App.tsx`, `menuItems-definicion.ts`, `interfaces-producto.tsx`,
  `interfaces-validaciones-producto.tsx`, `registrar-actualizar-producto.tsx` y su test,
  `consultar-producto.tsx`, `producto/componentes/datos-card.tsx` y `cambio-precios-masivo.tsx`.
- Borrados: `producto/componentes/configuracion/presentacion-selector.tsx` e
  `interfaces/gestion-producto/presentacion/interfaces-presentacion.tsx`.
- Backend: sin cambios (usa `/api/envase-presentacion` y el campo `presentacion` de PA-024).
- **Contrato:** con esta tarjeta, el alta de productos desde la UI vuelve a funcionar; estaba
  rota desde PA-024, que hizo obligatoria la presentación.

### Verificación
- `vitest run`: 14 archivos y 51 tests en verde (antes 11 y 35). Los 2 tests de alta que ya
  existían se ajustaron porque ahora el alta exige presentación; los nuevos cubren el alta con y
  sin presentación, el formato del valor, los errores del backend, la edición con y sin
  presentación, el formulario de envase, la tarjeta del listado y el menú.
- `tsc --noEmit -p tsconfig.app.json`: 125 errores antes y después, todos previos.
- ESLint sobre los archivos tocados: sin errores. Quedan advertencias `exhaustive-deps` previas
  y las de la página de envases, iguales a las de SuperLínea. Los 3 `no-empty` de
  `consultar-producto.tsx` ya estaban.
- `vite build`: correcto.
- Prueba manual del usuario en su navegador, contra el backend de PA-024: alta, modificación y
  baja de envases; alta de producto con presentación creando el envase desde el "+"; edición de
  la presentación; edición de un producto anterior sin presentación; y presentación visible en
  tabla y tarjetas. Las 5 pruebas pasaron.
- **Sin verificar a mano:** la columna de presentación en cambio de precios masivo, agregada
  después de esa prueba. Quedó cubierta por `tsc` y el build, sin test propio.

## [2026-09-22] PA-025 — Auditoría de la implementación de Presentación

- **Tarjeta / CR:** PA-025, CR-002, US-02
- **Herramienta:** OpenCode, openai/gpt-5.6-terra
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt

Auditar el código generado en la rama para PA-025: verificar los criterios de aceptación,
la correspondencia con el contrato backend, la calidad de la implementación y cómo probarla
manualmente.

### Respuesta / propuesta de la IA

Se revisó el commit `3659052`, los flujos de alta, edición, listados y el ABM de envases,
las pruebas del frontend y el contrato real de PA-024/PA-023 en el backend. Se propuso
reportar los hallazgos sin modificar el comportamiento funcional durante una auditoría.

### Decisión tomada

Se acepta como cubierto el contrato estructural: el frontend envía
`presentacion: { envaseId, cantidad, unidad }`, precarga la respuesta canónica del backend,
muestra `texto` en listados y direcciona errores `PRESENTACION_INVALIDA`,
`PRESENTACION_REQUERIDA` y `VALIDACION_DTO` al formulario. Se deja abierto un defecto de
validación para corregir antes de considerar PA-025 plenamente aceptada.

### Qué se descartó y por qué

- **Dar la tarjeta por completamente aprobada:** se descartó porque `NumericFormat` trunca
  automáticamente más de dos decimales. Por ejemplo, el usuario puede ingresar `1.255 L` y
  la UI lo convierte a `1.25`, evitando el rechazo `PRESENTACION_INVALIDA` que el contrato
  exige informar claramente. No es una validación, sino una modificación silenciosa del dato.
- **Duplicar las reglas R1-R4 en React:** se descartó; el backend es la fuente de verdad para
  las reglas de dominio. La corrección debe conservar el valor ingresado o informarle al
  usuario el exceso de decimales, sin normalizarlo silenciosamente.
- **Corregir el código funcional durante la auditoría:** se descartó para mantener separadas
  la revisión y la implementación; el hallazgo queda listo para una corrección y un test de
  regresión específicos.

### Modificaciones sobre lo generado

- Se agregó únicamente esta evidencia de auditoría en `DECISIONES-IA.md`.

### Impacto

- Hallazgo: `src/componentes/gestion-producto/producto/componentes/configuracion/presentacion-producto.tsx:73`
  usa `decimalScale={2}`; el test actual en
  `src/componentes/gestion-producto/producto/utils/registrar-actualizar-producto.test.tsx:254`
  afirma el truncamiento.
- Sin cambios en backend, endpoints, DTOs ni migraciones.

### Verificación

- Contrato contrastado con
  `cwtech-proyecto1-backend/src/modules/gestion-productos/producto/dto/presentacion.dto.ts`
  y `domain/value-objects/medida.vo.ts`: `L` y `kg` admiten como máximo dos decimales;
  `ml`, `g` y `unidades` no admiten decimales.
- Pruebas focalizadas: 4 archivos, 18 tests en verde (`registrar-actualizar-producto`,
  `datos-card`, formulario de envase y menú).
- `yarn build`: correcto.
- `yarn test`: no queda completamente verde por 4 fallos preexistentes en
  `src/utils/PrivateRoute.test.tsx`; el entorno no inicializa `localStorage` y falla antes de
  ejecutar sus aserciones. Las 47 pruebas restantes pasan.
- Sin prueba manual nueva contra el backend en esta auditoría; se debe ejecutar el caso de
  más de dos decimales al corregir el defecto.

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

## [2026-09-24] Integración — `Pa-020-Testing` al día con `develop` y `main`; import perdido en `PrivateRoute`

- **Tarjeta / CR:** ninguna propia; preparación de PA-053 y PA-055. Integra PA-051, PA-025 y PA-049
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: traer a la rama de testing los últimos cambios de `develop` (PA-051 de Martina Pineda),
teniendo en cuenta que `develop` no contenía `main`; analizar el impacto, mergear y crear las ramas
de PA-053 y PA-055 desde `develop`, al día con `develop` y con testing.

### Respuesta / propuesta de la IA

- `main` contra `develop`: los 2 commits de `main` que faltaban son merges de release sin cambios
  de contenido.
- Único conflicto de texto: `DECISIONES-IA.md`. `consultar-producto.tsx` se mergeó solo y convive
  con el manejo de errores de PA-020 (las alertas de stock crítico de PA-051 se disparan desde un
  effect sobre `productos`).
- Después del merge fallaban los 4 tests de `PrivateRoute.test.tsx` con
  `ReferenceError: useConfirmation is not defined`. El archivo es idéntico en `origin/develop`: el
  merge `3b8dd1b` ("Merge branch 'develop' into PA-051-Implementar-bajoMinimo") conservó el uso de
  `useConfirmation()` pero perdió su import. En `develop`, toda ruta privada rompe en ejecución.

### Decisión tomada

- Merges con `--no-ff`: `develop` → `Pa-020-Testing` y `main` → `Pa-020-Testing`. En
  `DECISIONES-IA.md` se tomó el archivo de `develop` y la entrada de PA-020 quedó al final.
- Se restauró en `src/utils/PrivateRoute.tsx` el import de `TipoAlertaConfirmacion`,
  `TituloAlertaConfirmacion` y `useConfirmation` tal como estaba en `0427ce2`.
- Ramas `PA-053-Actualizar-datos-de-visualizacion-en-detalles-del-producto` y
  `PA-055-Comprobar-soft-delete-de-la-lista-de-productos` creadas desde `origin/develop`, con la
  rama de testing mergeada.

### Qué se descartó y por qué

- **Dejar el fix para un PR aparte sobre `develop`:** la rama de testing y las de PA quedaban con
  todas las rutas privadas rotas. Se arregló acá, y conviene llevarlo a `develop` cuanto antes.
- **Rebase sobre `develop`:** reescribe historia ya pusheada.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

- `src/utils/PrivateRoute.tsx` (import).
- Las ramas de PA-053 y PA-055 incluyen todo lo de la rama de testing: sus PRs contra `develop` lo
  van a arrastrar si no se mergeó antes.

### Verificación

- `vitest run`: 15 archivos y 54 tests en verde. Antes del fix del import, 4 fallidos.
- `tsc --noEmit -p tsconfig.app.json`: 126 errores. Antes del fix eran 129; el import resolvió 3.
- **Sin verificar:** la navegación en el navegador.

### Segundo import perdido: `textoPresentacion` (pantalla de productos en blanco)

- El mismo merge `3b8dd1b` perdió también el import de `textoPresentacion` en
  `consultar-producto.tsx`, aunque la columna de presentación lo sigue usando. La tabla tiraba
  `ReferenceError: textoPresentacion is not defined` al renderizar las celdas y la pantalla quedaba
  en blanco. Lo reportó el equipo con la traza del navegador. Se restauró el import de
  `9e263f1`, y `tsc` bajó de 126 a 125 errores.
- **Por qué no lo detectó ningún test:** ninguno monta `ConsultarProductos`. Un montaje de
  diagnóstico en jsdom tampoco lo reprodujo, porque AG Grid no llega a pintar las celdas sin
  tamaño real. `tsc` sí lo marca (TS2304), igual que el import de `PrivateRoute`. Correr
  `tsc --noEmit` antes de mergear habría evitado los dos.
- **Deuda vieja, no tocada:** `tsc` marca otros 8 identificadores sin definir (TS2304) en
  `sidebarFiltros.tsx` (`CondicionesCerrado`, `EstadoRecibo`, `EstadoPresupuestoN`,
  `EstadosPedidoVentaBusqueda`, `EstadoCarteraCheques`, `EstadoConfirmacionCarteraCheques`,
  `OrdenCarteraCheques`) y en `proveedor-modales.tsx` (`ConsultarMovimientosCuenta`). Vienen del
  commit inicial `02d36a5` y solo se ejecutan en filtros o modales de módulos que producto no usa.
  Si alguna pantalla los activa, va a romper igual.

## [2026-09-24] PA-053 — Detalles del producto: responsable en el historial de precios y auditoría que muestra solo lo que existe

- **Tarjeta / CR:** PA-053. Revierte parcialmente lo descartado en PA-019 (mostrar el usuario del cambio de precio)
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)
- **Repos:** back y front; la misma entrada está en el `DECISIONES-IA.md` de cada uno.

### Prompt

Síntesis: el botón de información (la "I") muestra el último cambio pero no qué se cambió, y el
historial de precios (el reloj) no muestra quién hizo cada cambio. Analizar qué guarda la
auditoría y si se puede rastrear qué campo cambió. El equipo decidió que PA-053 **se limita a
mostrar mejor lo que ya existe** y a que se vea como corresponde, sin agregar un registro de
cambios por campo.

### Respuesta / propuesta de la IA

- La auditoría de producto son columnas de la misma fila: `createdAt`, `updatedAt`, `deletedAt` y
  los usuarios de creación, última modificación y baja. Cada edición pisa a la anterior, así que
  no se puede saber qué campo cambió. El módulo `gestion-sistema/auditoria` es un esqueleto del
  CLI de Nest sin implementar. Los únicos rastros por campo son `historial_precio` y
  `movimiento_stock`.
- `historial_precio.usuario_id` ya se guardaba (en la base local, el cambio del producto 1 es de
  Jenifer Lopez), pero `findHistorialPrecios` no cargaba la relación y devolvía solo el id.
- En el modal de auditoría: `updatedAt` se completa ya al crear, así que el bloque "Actualizado"
  aparecía siempre, con "No especificado"; el ID para Root dependía de un `rolId` que el token no
  trae, y por eso hacía una request al backend en cada apertura; y `mapProductoToDto` respondía 500
  si el producto no tenía usuario creador.

### Decisión tomada

- Back: `findHistorialPrecios` carga `usuario` y devuelve `usuarioDenominacion` (null si no hay
  usuario), sin quitar `usuarioId`. `mapProductoToDto` tolera un producto sin creador.
- Front: columna "Responsable" en el historial de precios ("—" si no hay). En el modal de
  auditoría, el bloque pasa a llamarse "Última modificación" y solo aparece si hubo usuario de
  modificación o una fecha distinta a la de creación. El ID para Root se decide con
  `getRoles().includes(Rol.ROOT)`.

### Qué se descartó y por qué

- **Registrar los cambios por campo (tabla de bitácora con campo, valor anterior y nuevo):** lo
  descartó el equipo para esta tarjeta. Cambia el modelo y el esquema, y PA-053 es de
  visualización.
- **Mantener lo descartado en PA-019 (mostrar solo el id):** ese descarte se basaba en que el
  backend no devolvía el nombre. Ahora lo devuelve.
- **Resolver el nombre del usuario en el front con otra request:** una consulta extra por cada fila,
  cuando el backend ya tiene la relación.
- **Ocultar "Última modificación" comparando solo `usuarioUpdated`:** los registros viejos pueden
  tener fecha de modificación sin usuario. Por eso también se compara la fecha.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

- Back: `producto.service.ts` (`findHistorialPrecios`), `dto/historial-precio.dto.ts`,
  `gestion-sistema/auditoria/mappers/auditoria.mapper.ts`, `producto.service.spec.ts` y el nuevo
  `auditoria.mapper.spec.ts`.
- Front: `interfaces-historial-precios.tsx`, `modales/historial-precios-modal.tsx` y su test,
  `herramientas/reutilizables/informacion-auditoria.tsx` (modal genérico, lo usan también
  clientes, proveedores, etc.) y el nuevo `informacion-auditoria.test.tsx`.
- Contrato: `GET /producto/:id/historial-precios` suma `usuarioDenominacion`, y no se quita nada.

### Verificación

- Back: tests del service y del mapper en verde (39 en esos specs). El test del historial
  verifica que se pida la relación `usuario` y que la respuesta traiga el nombre, o `null`.
- Front: `vitest run` con 16 archivos y 57 tests en verde. `tsc` sin errores nuevos (125, igual que
  testing). El test "sin modificaciones" falla con el código anterior, porque el bloque aparecía
  siempre.
- **Sin verificar:** el modal en el navegador.

## [2026-09-24] PA-055 — Soft delete de productos: la baja se guarda y los eliminados se pueden consultar

- **Tarjeta / CR:** PA-055
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)
- **Repos:** back y front; la misma entrada está en el `DECISIONES-IA.md` de cada uno.

### Prompt

Síntesis: al eliminar un producto no pasa nada. Analizar qué guarda el soft delete y por qué no se
refleja en el front. Agregar un booleano al lado de filtrados/mostrados para ver los productos
eliminados, y que en la "I" de esos productos aparezca "Eliminado por" en rojo, con los mismos
datos que los otros bloques.

### Respuesta / propuesta de la IA

- **Back:** `ProductoService.remove` marcaba `deletedAt` y `usuarioDeleted` y después llamaba a
  `repository.remove()`. El adapter rechaza con 404 "Entidad ya eliminada." todo producto que ya
  trae `deletedAt`, así que la baja nunca se guardaba. Reproducido en vivo: `DELETE /producto/7`
  respondía 404 y la fila quedaba intacta. El bug está desde `a07ce54f` (11/09). En envase y en el
  resto de las entidades, el que marca la baja es el adapter.
- **Front:** la alerta del 404 sí aparecía, pero `handleDelete` relanzaba la búsqueda, el spinner
  desmontaba las alertas (estaban dentro de la rama "no está cargando") y desaparecía al instante.
- **Consulta de eliminados:** las dos búsquedas filtraban siempre `deletedAt IS NULL`. La
  auditoría (`findByIdConAuditoria`) no filtra, así que la "I" funciona para un eliminado.
- **El modal ya tenía** un bloque "Eliminado" en rojo que nunca se veía. Como la baja pisa
  `updatedAt`, el bloque de actualización mostraría la fecha de la baja con el editor anterior.

### Decisión tomada

- **Back:**
  - El adapter recibe el usuario y marca la baja (`remove(producto, usuario)`), igual que envase.
  - `incluirEliminados` (con `@ToBoolean(false)`) en `search-by` y `search-by-rapido`, como último
    parámetro con valor por defecto, para no romper la firma posicional.
  - `eliminado` en cada producto del listado.
- **Front:**
  - Toggle "Mostrar eliminados" junto a filtrados/mostrados, en los dos headers; al cambiarlo se
    relanza la búsqueda activa (rápida o filtrada).
  - Los eliminados se marcan con "Eliminado" en rojo y solo ofrecen "Ver información".
  - Las alertas quedan fuera del spinner, y la confirmación explica que es una baja lógica.
  - En el modal, para un registro eliminado se reemplaza "Actualizado" por "Eliminado por" en rojo.
- **Semántica del toggle:** *incluye* los eliminados junto a los activos, no muestra "solo
  eliminados". Es la misma convención que `incluirEliminados` en los DTOs comunes del back.

### Qué se descartó y por qué

- **Arreglarlo sacando el chequeo del adapter:** se perdía la protección contra dar de baja dos
  veces. Además, el resto de las entidades ya usa el patrón de que el adapter marque la baja.
- **Toggle de "solo eliminados":** duplica la búsqueda y rompe la convención de `incluirEliminados`.
  Se puede agregar después si el equipo lo pide.
- **Permitir editar, ajustar stock o ver el historial de un eliminado:** esos endpoints usan
  `findOne`, que filtra `deletedAt`, y responderían 404. Restaurar un producto queda fuera del
  alcance de PA-055.
- **Evitar que la baja pise `updatedAt`:** requiere una actualización a medida que saltee
  `@UpdateDateColumn`. Se resolvió en la vista, reemplazando el bloque.

### Modificaciones sobre lo generado

Ninguna por ahora; pendiente de revisión del equipo.

### Impacto

- **Back:**
  - `producto.service.ts` (`remove`, `findBy`, `findByRapido`), `producto.persistence-adapters.ts`,
    `producto.repository.ts` y `producto.repository-interface.ts`.
  - `producto.controller.ts`, los dos DTOs de búsqueda, `get-producto.dto.ts` y
    `producto.mapper.ts`.
  - Tests: `producto.service.spec.ts`, `producto.persistence-adapters.spec.ts`,
    `producto.http.spec.ts`, `producto.controller.spec.ts` y `producto.mapper.spec.ts`.
- **Front:**
  - `consultar-producto.tsx`, `header-producto.tsx`, `header-producto-lg.tsx`,
    `producto-action.tsx`, `datos-card.tsx` e `interfaces-producto.tsx`.
  - Nuevos `mostrar-eliminados-toggle.tsx` y `eliminado-badge.tsx`.
  - `informacion-auditoria.tsx` y 4 archivos de test.
- **Contrato:** `incluirEliminados` (opcional, `false` por defecto) en las dos búsquedas, y
  `eliminado` en la respuesta del listado.

### Verificación

- **Back:** 252 tests de producto en verde.
  - Mutación: con las dos líneas viejas del service repuestas, el test de regresión ("delega la
    baja en el repositorio con el usuario, sin marcarla antes") falla.
  - Los specs del adapter verifican que `deletedAt IS NULL` esté o no esté según
    `incluirEliminados`. Antes, quitar esa condición no rompía ningún test.
- **Front:** `vitest run` con 18 archivos y 62 tests en verde. `tsc` sin errores nuevos (125).
- **En vivo:** ver la verificación de la rama de unificación.
- **Sin verificar:** la UI en el navegador.

## [2026-09-24] PA-030 — Búsqueda por denominación, Línea y SuperLínea

- **Tarjeta / CR:** PA-030 / CR-004
- **Herramienta:** OpenCode (GPT-5.6 Luna) + Chrome DevTools MCP
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis fiel: adaptar la búsqueda de productos al contrato real de `/producto/search-by`, con
filtros textuales combinables, paginación, estados de UI y tests; luego replicar para SuperLínea el
flujo de Línea, donde Enter busca coincidencias y llena un `react-select`.

### Respuesta / propuesta de la IA

Se separó la búsqueda normal de la búsqueda rápida por código. La normal arma únicamente los
parámetros textuales del contrato, omite vacíos y protege contra respuestas obsoletas. Para
SuperLínea se replicó el patrón de Línea con un contador en el contexto, consulta a
`SuperlineaService` y catálogo independiente.

### Decisión tomada

Se implementó la búsqueda PA-030 con `denominacion`, `linea`, `superlinea`, `skip`, `take` y el
toggle existente de eliminados. Los valores se recortan antes de enviarse y Axios serializa la
query. El selector de SuperLínea conserva la denominación elegida, porque ese es el parámetro que
exige el backend.

### Qué se descartó y por qué

- **Enviar ids de Línea o SuperLínea:** se descartó porque el contrato exige coincidencias parciales
  por denominación.
- **Leer nombres de Línea o SuperLínea desde cada producto:** se descartó porque no forman parte del
  DTO de búsqueda.
- **Disparar la búsqueda rápida con código vacío:** se descartó para evitar que sobrescriba una
  búsqueda normal.

### Modificaciones sobre lo generado

Se preservaron los cambios de `develop` relacionados con soft delete, notificaciones y auditoría al
crear la rama de feature; los cambios de PA-030 se integraron sobre esa base.

### Impacto

Se modificaron `producto-service.tsx`, `consultar-producto.tsx`, `sidebarFiltros.tsx`,
`catalogos-context.tsx` y `filtros-contesxt.tsx`. Se agregó el test de armado de parámetros de
`producto-service`.

### Verificación

- `npm run build`: correcto.
- Tests focalizados de PA-030: 5 en verde.
- Chrome DevTools: `Choc` mostró `CHOCOLATES`; `Beb` mostró `BEBIDAS` y la selección dejó `BEBIDAS`
  en el input. Se verificó `/api/superlinea/search-by?denominacion=Beb&skip=0&take=10`.
- La suite completa mantiene 52 tests en verde y 4 fallos preexistentes de `PrivateRoute` por
  `localStorage` no disponible.

## [2026-09-24] Unificación — `unificacion-testing-PA-053-PA-055`, rama única para llevar a `develop`

- **Tarjeta / CR:** PA-053 y PA-055, más lo acumulado en testing (PA-020, arreglo de tests y la integración de PA-029)
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: en las ramas de testing commitear solo lo referido a testing y poner cada funcionalidad
en su PA; crear una rama que unifique todo para después mergearla a `develop`, esperando permiso
del equipo para ese merge.

### Decisión tomada

- La rama `unificacion-testing-PA-053-PA-055` sale de `origin/develop` y mergea, con `--no-ff` y en
  este orden, testing, PA-053 y PA-055.
- Conflictos resueltos:
  - `DECISIONES-IA.md`: quedan las entradas de las dos PA, en orden.
  - En el front, `informacion-auditoria.tsx`: la última modificación se muestra si la hubo
    (PA-053) y si el registro no está eliminado (PA-055).
- **El merge a `develop` queda pendiente de permiso.** En el back, `develop` está protegida y el
  merge tiene que entrar por PR.

### Qué se descartó y por qué

- **Squash de todo en un único commit:** se pierde la trazabilidad por PA que pide la consigna.
- **Mergear las PA directamente a `develop`:** el equipo pidió una rama única y revisar antes.

### Verificación

- Back: `tsc` sin errores; `jest` con 56 suites y 356 tests en verde.
- Front: `vitest run` con 19 archivos y 65 tests en verde; `tsc` con 125 errores, ninguno nuevo.
  Los únicos TS2304 son los 8 viejos registrados en la integración.
- En vivo, back de esta rama levantado en el puerto 3001 contra la base local:
  - historial del producto 1: `usuarioDenominacion` "Jenifer Lopez";
  - `DELETE /producto/7?usuarioId=4`: 200, `deletedAt` cargado y `usuario_deleted_id = 4`;
  - un segundo DELETE: 404;
  - `search-by`: 6 resultados sin `incluirEliminados` y 7 con `incluirEliminados=true`, con
    `MAR-001` marcado `eliminado`. Lo mismo en `search-by-rapido`;
  - `GET /producto/7/audit`: `usuarioDeleted` "Jenifer Lopez".

  Después de la prueba se restauró el producto 7 en la base local.
- **Sin verificar:** la UI en el navegador.

## [2026-09-24] Revisión de deudas técnicas del front

- **Tarjeta / CR:** ninguna propia; revisión de deuda técnica
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** Lisandro (PIPICBA)
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: revisar si las deudas documentadas siguen activas comprobándolas en el código, no en
este archivo, y registrar nuevas deudas.

### Estado de las deudas ya registradas (comprobado en el código de `develop`)

- **Activa:** paginación en `consultar-producto.tsx` tras una búsqueda rápida. Desde una página
  mayor a 1, `resetearPaginacion()` cambia `paginaActual` y el effect de paginación dispara
  `handleBuscarProductos()` (búsqueda normal). Esa búsqueda toma un `requestId` nuevo y descarta la
  respuesta de la rápida: se ven los resultados de la búsqueda normal. La rápida sigue mandando el
  `skip` anterior, paginar en modo rápido pierde el código y el spinner sigue desmontando el input.
- **Activa, y alcanzable:** los 8 TS2304 siguen (`tsc`: 125 errores). `ConsultarMovimientosCuenta`
  **sí se ejecuta**: el botón "Movimientos" de `proveedor-card.tsx` (vista mobile) abre ese modal y
  la pantalla tira `ReferenceError`. Los 7 de `sidebarFiltros.tsx` están detrás de filtros que
  ninguna pantalla activa.
- **Activa:** la vista agrupada por SuperLínea no existe en el front, aunque el endpoint está.
- **Código muerto:** `busqueda-producto.tsx` apunta a `search-productos-by-rapido` de módulos que el
  back no tiene, pero solo lo importan `seleccion-producto*.tsx`, que nadie importa.

### Deuda técnica detectada y no resuelta

- **Testing e2e.** No hay e2e (Playwright, Cypress o similar). Los bugs de imports perdidos de
  `PrivateRoute` y `textoPresentacion` y el de la paginación no los detecta ningún test, porque
  ninguno monta `ConsultarProductos` en un navegador real.
- **Recuperar un producto borrado.** La pantalla muestra los eliminados (`mostrarEliminados`), pero
  no ofrece restaurarlos. Depende de un endpoint que el back tampoco tiene.
- **Las notificaciones no se borran con "Limpiar".** Reportado por el equipo. `limpiarNotificaciones`
  vacía el estado del context, pero las alertas de stock crítico se vuelven a generar desde
  `consultar-producto.tsx` (`mostrarAlertasStockCritico`). Su guarda
  (`notificadosStockCriticoRef`) se reinicia cada vez que la pantalla se monta, y las
  notificaciones no se persisten. Causa probable, sin verificar en el navegador.
- **Desfasaje en la vista mobile.** Reportado por el equipo, sin detalle todavía: la vista mobile
  (cards, `lg:hidden`) no se comporta igual que la de escritorio (tabla). Ejemplo ya comprobado: el
  botón "Movimientos" de proveedor existe solo en mobile y rompe la pantalla. Falta relevar el resto
  de las diferencias.

## [2026-09-24] PA-032 — Denominación automática en el alta del producto

- **Tarjeta / CR:** PA-032 (CR-005 / US-05). Consume el contrato de PA-031 del backend (merge `bf75fff`).
- **Herramienta:** Claude Opus 5.5 vía Claude Code
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt

Síntesis: adaptar el frontend a la denominación automática de CR-005, respetando lo que espera
el backend (commit `bf75fff`). Criterios de aceptación: en el alta, por defecto, la UI muestra la
denominación generada con Marca + Línea + Presentación; el usuario puede editarla a mano; la UI no
duplica la regla como fuente de verdad y consume la semántica del backend; una vez creado el
producto, un cambio de marca, línea o presentación no la regenera; tests de la generación visible,
la edición manual y la ausencia de regeneración. Ejemplo: Coca-Cola + Gaseosas + BOTELLA 500 ml →
"Coca-Cola Gaseosas BOTELLA 500 ml"; si después la presentación pasa a LATA 500 ml, la
denominación se conserva.

### Respuesta / propuesta de la IA

Relevó el backend de PA-031: `CreateProductoDto` acepta `generarDenominacionAutomatica?: boolean`;
con `true`, el backend ignora la `denominacion` recibida y la arma con
`Producto.generarDenominacionAutomatica(marca, línea, presentacion.texto(envase))`, ya normalizada
("COCA-COLA GASEOSAS BOTELLA 500 ml", "1 L", "1 unidad"). Sin el flag, la denominación manual
sigue siendo obligatoria, y el `PUT` nunca la regenera. Señaló que el front no tiene el texto
normalizado antes de guardar (el alta responde solo un mensaje) y planteó tres dudas: cómo mostrar
el nombre antes de guardar, qué pasa al desbloquear el campo y cómo mostrar el 409 por
denominación repetida.

### Decisión tomada

- **La regla sigue en el backend.** En el alta, por defecto, el formulario manda
  `generarDenominacionAutomatica: true` **sin** `denominacion`, y el backend arma el nombre final.
- **Vista previa, no fuente de verdad.** El formulario muestra una vista previa con los datos
  cargados: marca, línea, envase, valor y unidad (`domain/denominacion-producto.ts`,
  `vistaPreviaDenominacion`). **No normaliza** el contenido, así que difiere del nombre guardado
  cuando el backend convierte ("1000 ml" → "1 L", "1 unidades" → "1 unidad"); la leyenda del
  campo lo aclara. Es el mismo criterio que el "Precio de venta estimado".
- **Modo manual.** Debajo del campo hay un check "Denominación automática", marcado por defecto
  en el alta. Al desmarcarlo, el campo se habilita con la vista previa ya escrita; desde ahí, los
  cambios de marca, línea o presentación no tocan el texto, y el payload lleva `denominacion` sin
  el flag. Al volver a marcarlo, se descarta lo escrito y se reactiva la generación.
- **Edición.** El campo es el de siempre, editable a mano, y el flag nunca viaja: un cambio de
  marca, línea o presentación no regenera la denominación.
- **409.** Se muestra el mensaje del backend al pie del formulario ("La denominación "X" ya está
  en uso."), en vez del genérico de `CONFLICTO`. Si estaba en automática, se agrega "Podés editar
  la denominación manualmente.". `utils/errores` no se tocó.
- **Esquema:** con la automática, `denominacion` no se valida en el front (la valida el backend).
- **Servicio:** `ProductoService` se tipa con `ProductoPayload` (lo que arma
  `armarPayloadProducto`) en lugar de `FormValues`, porque con la automática la denominación no
  viaja.

### Qué se descartó y por qué

- **Copiar en React la normalización del contenido** para que la vista previa sea exacta: repite
  la regla N2 del dominio (ya se descartó en PA-025) y va contra el criterio "la UI no duplica la
  regla".
- **Un endpoint de previsualización en el backend:** daría la vista previa exacta, pero toca el
  backend (otra tarjeta) y hace un request por cada cambio de marca, línea o presentación. Queda
  como deuda (abajo).
- **Componer el nombre en el front y mandarlo en `denominacion`:** el front sería la fuente de
  verdad, justo lo que el criterio de aceptación prohíbe.
- **Desbloquear sin poder volver a la automática, o con el campo vacío:** obliga a reescribir el
  nombre, o a cerrar el formulario, para recuperar la generación.
- **Mostrar el 409 debajo del campo Denominación:** para distinguirlo de otro 409 (por ejemplo, un
  código repetido) habría que buscar la palabra "denominación" en el mensaje, que es frágil.

### Deuda técnica asumida

- **Vista previa aproximada.** Mientras el backend no exponga la previsualización, la vista previa
  puede no coincidir con el nombre guardado en los casos que normaliza. Propuesta: un endpoint (por
  ejemplo `GET /api/producto/denominacion-automatica?marcaId&lineaId&envaseId&cantidad&unidad`)
  que use `Producto.generarDenominacionAutomatica`, y que el front lo consulte en lugar de armar el
  texto.
- **Largo máximo de la generada:** la valida solo el backend, con el límite de 200 caracteres del
  servicio (deuda previa: el DTO acepta 255). Si se pasa, el mensaje del backend aparece al pie.

### Modificaciones sobre lo generado

- La primera versión dejaba `ProductoService` tipado con `FormValues`, y `tsc` sumó 2 errores
  (127 contra 125). Se corrigió tipando el servicio con `ProductoPayload`.
- En la prueba manual, el mensaje del 409 seguía a la vista después de pasar a "Editar
  manualmente" o de volver a la automática. Ahora cambiar de modo limpia ese error, y el test del
  409 lo comprueba.
- A pedido del usuario, después de la prueba manual, los botones "Editar manualmente" / "Volver a
  automática" (grandes, estorbaban) se reemplazaron por un check "Denominación automática", con el
  mismo estilo que el de Stock Crítico. La prueba manual de más abajo se hizo con los botones; el
  check quedó cubierto por los tests.
- También a pedido del usuario, el subtítulo de la edición de producto pasó de "Sólo puede
  visualizarse, no modificarse." (obsoleto: el formulario sí permite modificar) a "Ingrese los
  datos". El formulario de Marca conserva el texto viejo.

### Impacto

- Nuevos: `producto/domain/denominacion-producto.ts` y su test.
- Modificados: `producto/utils/registrar-actualizar-producto.tsx` (vista previa, botones de modo,
  flag por defecto en el alta, 409 y registro de la marca y la línea elegidas),
  `producto/interfaces/interfaces-validaciones-producto.tsx` (`generarDenominacionAutomatica`,
  esquema condicional, `armarPayloadProducto` y `ProductoPayload`),
  `producto/services/producto-service.tsx` (tipo del payload) y
  `producto/utils/registrar-actualizar-producto.test.tsx`.
- **Contrato:** sin cambios en el backend; se usa el flag de PA-031.

### Verificación

- `vitest run`: 21 archivos y 87 tests en verde (antes 20 y 70). Se ajustaron 3 tests del
  formulario que escribían la denominación a mano: 2 ahora usan la automática y el de errores 400
  pasa a manual. Tests nuevos: 7 en el formulario (vista previa y flag en el alta, la vista previa
  sigue a la presentación, edición manual precargada, sin regeneración en modo manual, volver a
  automática, 409 con el mensaje del backend y sin regeneración en la edición) y 10 en
  `denominacion-producto.test.ts` (vista previa y payload).
- `tsc --noEmit -p tsconfig.app.json`: 125 errores antes y después, todos previos.
- ESLint sobre los archivos tocados: sin errores nuevos. Quedan las 4 advertencias
  `exhaustive-deps` del formulario y el `no-useless-catch` de `producto-service.tsx`, todos previos.
- `vite build`: correcto.
- Prueba manual en el navegador contra el backend local de `develop` (con PA-031). Para que el
  listado anduviera hubo que correr, con permiso del usuario, la migración pendiente
  `CreateSuperLinea` en la base de Docker.
  - Alta automática de CAROYENSE + ACEITES + BOTELLA 1000 ml: la vista previa mostró "CAROYENSE
    ACEITES BOTELLA 1000 ml" y el backend guardó "CAROYENSE ACEITES BOTELLA 1 L" (la diferencia
    esperada por la normalización).
  - Repetir la combinación con 1 L dio 409, con el mensaje del backend y la sugerencia.
  - "Editar manualmente" precargó el texto, y cambiar el envase a LATA no lo tocó. "Volver a
    automática" mostró "CAROYENSE ACEITES LATA 1 L" y el alta se guardó con ese nombre: botella y
    lata no chocan.
  - En la edición, cambiar el envase a FRASCO conservó "CAROYENSE ACEITES BOTELLA 1 L".
- Quedaron en la base local 2 productos de prueba: "CAROYENSE ACEITES BOTELLA 1 L" (ahora con
  FRASCO 1 L) y "CAROYENSE ACEITES LATA 1 L".
- **Sin verificar:** una denominación generada de más de 200 caracteres (la rechaza el backend y
  el mensaje debería aparecer al pie, sin prueba propia) y la vista mobile del formulario en un
  celular real; la prueba se hizo en el panel angosto del navegador.
