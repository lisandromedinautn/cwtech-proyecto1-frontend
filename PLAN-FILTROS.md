# Documentación y plan de consolidación del sistema de filtros

> Objetivo de la tarjeta:
> - Corregir inconsistencias de configuración/filtros **sólo donde afecten búsquedas o cambios futuros**.
> - Identificar si la configuración remota es reemplazada por defaults.
> - Eliminar duplicación relevante **sólo si genera comportamiento inconsistente**.
> - Documentar qué se corrige y qué se deja como deuda.

Estado: **PLAN** (sin código modificado todavía). Fecha: 2026-09-16.

---

## 1. Estado actual (documentación del sistema)

### 1.1 Mecanismos de filtrado

Coexisten tres mecanismos independientes:

| # | Mecanismo | Dónde vive | Qué es |
|---|---|---|---|
| A | **Sidebar global** | `src/context/filtros-contesxt.tsx`, `src/componentes/sidebarFiltros.tsx` | UI tipo accordion de ~30 secciones. Se encienden/apagan por módulo vía `setFiltrosNecesarios`. Los valores viven en `valoresFiltros`. El botón "Buscar" incrementa `buscar.cont`; cada pantalla escucha `buscar.componente === su-nombre`. |
| B | **Componentes embebidos genéricos** | `src/componentes/herramientas/reutilizables/filtros-simple.tsx`, `.../filtros-entidad.tsx` | Estado local por pantalla (denominación, "incluir eliminados", "con saldo", select opcional). Los "específicos" por área son **re-exports o configuraciones** del genérico, no componentes propios. |
| C | **Segundo contexto de filtros** | `src/context/filtros-componentes-context.tsx` | Duplicación de `ValoresFiltros` y catálogos. Sólo se usa en la búsqueda de producto embebida en documentos (facturas/pedidos/presupuestos). |

Además hay `src/context/catalogos-context.tsx`, que alimenta los dropdowns de la sidebar (A) y de los consumidores de precios/importaciones.

### 1.2 Qué módulo usa qué

| Pantalla | Sidebar (A) | Embebidos (B) | Nota |
|---|---|---|---|
| Producto | Sí (`consultar-producto`) | — | El más completo; lee `valoresFiltros`. |
| Usuario | Sí | — | Lee `valoresFiltros`. |
| Marca | Registra `denominacion:true` | Sí (`FiltrosSimple`) | **La búsqueda lee estado local, la sidebar se ignora.** |
| Línea | Registra `denominacion:true` | Sí (`FiltrosSimple`) | **Ídem marca.** |
| Personal | Registra `denominacion:true` | Sí (`FiltrosSimple`) | **Ídem marca.** |
| Localidad | Registra `denominacion:true, provincia:true` | Sí | **Fuente mezclada**: `denominacion` del local, `provinciaId` de `valoresFiltros`. La denominación de la sidebar se ignora. |
| Cliente | No | Sí (`FiltrosEntidad`) | Hook `use-clientes-filtros` es stub vacío. |
| Proveedor | No | Sí (`FiltrosEntidad`) | Ídem cliente. |
| Condición IVA | No | Estado propio | |
| Precios (cambio masivo / lista) | Parcial | Componentes **a medida** duplicados (`filtros-cambio-precios.tsx` x2) | |
| Importaciones | Sí | — | Lee `valoresFiltros`. |
| Búsqueda de producto en documentos | No | Contexto C (modal propio) | |

### 1.3 Cómo se arma la query

Patrón repetido a mano en cada pantalla:

1. Se arma `filtrosConPaginacion = { ...camposDeFiltro, skip, take }`.
2. `Servicio.obtener(filtros)` → `crudFactory` (`src/utils/crudFactory.ts:18-20`) → `GET /{endpoint}/search-by`.
3. `apiService.get(url, params)` enruta el objeto como **query string** (`src/utils/apiService.ts:14-25`).

Disparo de búsqueda desde la sidebar: `sidebarFiltros.tsx:142-151` sube `buscar.cont`; cada pantalla escucha con `useEffect([buscar])` (p. ej. `consultar-marca.tsx:69-73`).

---

## 2. Inconsistencias detectadas (impacto y clasificación)

### 2.1 CONFIGURACIÓN REMOTA REEMPLAZADA POR DEFAULTS — impacto real

`src/componentes/sistema/ConfiguracionSistemaContext.tsx`:

- Línea 37: el estado arranca en `CONFIGURACION_DEFAULT` hardcodeado (líneas 9-31).
- Líneas 54-57: `setConfiguracionEnContext(config)` **guarda la config remota en `sessionStorage` pero vuelve a setear `CONFIGURACION_DEFAULT`**, no `config`.
- Líneas 41-52: el `useEffect` que restauraba la config almacenada está **comentado**.

**Efecto:** cualquier parámetro remoto (`caracteresParaBusqueda`, `take`, `estadisticasProducto`, `visibleIva21`, etc.) se descarta tras el login. Impacto directo en búsquedas: autocompletado por cantidad de caracteres (`?? 4`/usos de `caracteresParaBusqueda` en `consultar-producto.tsx:153,174,196`, `consultar-localidad.tsx:79`, `lista-precios.tsx:145,168`, `cambio-precios-masivo.tsx:93`) y paginación por defecto (`take`).

**Contradice la entrada IA-001 de `DECISIONES-IA.md`**, que declaraba este fix como aplicado.

### 2.2 SIDEBAR DESCONECTADA EN marca / línea / personal — impacto real

Registran el filtro `denominacion` en la sidebar (`use-marcas-filtros.ts:12`, etc.) pero la búsqueda lee el **estado local** del componente embebido (`consultar-marca.tsx:136-141`). Lo que el usuario tipea en la sidebar **se ignora silenciosamente** al buscar. Es una trampa para cambios futuros: quien agregue un filtro nuevo en la sidebar creerá que aplica.

Localidad mezcla **dos fuentes** (`consultar-localidad.tsx:154-160`): `denominacion` del local + `provinciaId` de `valoresFiltros`.

### 2.3 DOBLE `FiltrosProvider` ANIDADO — tamaño, no bug visible

`main.tsx:14-20` monta `ConfiguracionSistemaProvider > FiltrosProvider > CatalogosProvider`, y `administracion-page.tsx:38` monta **otro** `FiltrosProvider` más interno. Verificado por grep: todos los `useFiltrosContext()` y `useCatalogosContext()` de `src/` viven dentro del layout admin, así que el provider de `main.tsx` no tiene consumidores reales. No rompe nada hoy pero agrega estado duplicado y ruido de inicialización.

**Riesgo de tocar:** si alguna ruta fuera de `/admin` consumiera esos contextos se rompería. Requiere auditoría previa de `App.tsx` (paso del plan).

### 2.4 DUPLICACIÓN SIN COMPORTAMIENTO INCONSISTENTE — se documenta como deuda

- `ValoresFiltros` duplicado en `filtros-contesxt.tsx:5-50` y `filtros-componentes-context.tsx:11-37`.
- Catálogos duplicados en `catalogos-context.tsx` y `filtros-componentes-context.tsx`.
- Armado de `filtrosConPaginacion` repetido ~10 veces (candidato a helper).
- `filtros-cambio-precios.tsx` duplicado en `cambio-precios-masivo/componentes/` y `lista_precios/componentes/`.
- `consultar-linea.tsx` duplicado como pantalla completa (`linea/consultar-linea.tsx` vs `linea/utils/consultar-linea.tsx`).
- `FiltrosAplicados` es un tercer render de badges desconectado de los embebidos.

---

## 3. Plan de implementación progresiva

Criterios del plan: cada fase es **pequeña, reversible y verificable**; se toca comportamiento **sólo** donde hay inconsistencia; el resto queda documentado como deuda. Verificación común en todas las fases: `npm run lint`, `npm run build`, `npm test`.

### Fase 1 — Configuración remota no reemplazada por defaults (bug real)

**Riesgo: bajo.** Cambio unitario en un archivo + verificación de regresión.

Pasos:
1. En `ConfiguracionSistemaContext.tsx`:
   - `setConfiguracionEnContext(config)` → persistir en `sessionStorage` **y** `setConfiguracionState(config)` (quitar el reset a `CONFIGURACION_DEFAULT`).
   - Re-activar el `useEffect` de montado que restaura desde `sessionStorage`, con `try/catch` sobre `JSON.parse` y **merge defensivo** `{ ...CONFIGURACION_DEFAULT, ...parsed }` para tolerar campos que falten en la config vieja.
   - Quitar el `console.log` (línea 39).
2. Verificar que el **logout** limpie `sessionStorage["ConfiguracionSistema"]` (si no hay logout que lo limpie, agregarlo) para que al cambiar de empresa no herede la config del usuario anterior.
3. Verificación manual: login normal y con Google; config retocada en back (p. ej. `take: 25`, `caracteresParaBusqueda: 4`); recarga de página (`F5`) → la config se mantiene y las búsquedas usan esos valores.
4. Rollback: revertir el único diff del archivo.

**Impacto en búsquedas:** `caracteresParaBusqueda` y `take` dejan de ser pisados por defaults.

### Fase 2 — Una sola fuente por pantalla (marca / línea / personal / localidad)

**Riesgo: bajo-medio.** También corrige una trampa para cambios futuros.

Decisión: **no se unifica el mundo en `valoresFiltros`** (eso es deuda, ver Fase 4). Se hace lo mínimo que elimina el comportamiento inconsistente:

1. **Marca, línea, personal:** quitar el registro del filtro muerto en la sidebar (dejar de llamar `setFiltrosNecesarios({ denominacion:true })`). La sidebar deja de mostrar un input que no hace nada; el filtro embebido sigue siendo la fuente única y funcional.
   - Archivos: `use-marcas-filtros.ts`, `use-lineas-filtros.ts` (el usado por el router), `use-personal-filtros.ts`, y el `useEffect` equivalente dentro de cada `consultar-*.tsx` (marca: `consultar-marca.tsx:62-67`).
2. **Localidad:** registrar en la sidebar **sólo** `provincia: true` (la denominación de localidad se filtra por el embebido). Al quedar el fetch de provincias disparado por `valoresFiltros.denominacionProvincia` (`consultar-localidad.tsx:76-92`), el flujo existente no cambia.
3. Antes de tocar línea, confirmar con grep en `App.tsx` cuál de los dos `consultar-linea.tsx` está ruteado (sólo se modifica el vivo; el otro queda como deuda).
4. Verificación manual: en cada pantalla, escribir denominación en el filtro embebido → filtra; abrir la sidebar → ya no hay input de denominación muerto (localidad muestra sólo provincia, que sigue filtrando).
5. Rollback: revertir los `useEffect` de inicialización tocados.

**Criterio de aceptación cumplido:** "eliminar duplicación relevante sólo si genera comportamiento inconsistente" → aquí la duplicación SÍ genera inconsistencias (filtrar por sidebar no filtra).

### Fase 3 — Un solo `FiltrosProvider` (y revisar `CatalogosProvider`)

**Riesgo: medio.** Requiere auditoría previa; si falla la auditoría se saltea y queda como deuda.

Pasos:
1. Auditoría: enumerar **todas** las rutas de `App.tsx` que están fuera del layout `AdministracionPage` y confirmar con grep que ninguna consume `useFiltrosContext()` ni `useCatalogosContext()` (resultado esperado según 2.3: ninguna).
2. Sacar `FiltrosProvider` (y, si la auditoría lo confirma, `CatalogosProvider`) de `main.tsx`, dejándolos sólo en `administracion-page.tsx`. Mantener `ConfiguracionSistemaProvider` en `main.tsx` (lo consume el login, fuera de `/admin`).
3. Verificación: build + humo de login y de una pantalla con sidebar (producto) y una con catálogos (lista de precios).
4. Rollback: restaurar `main.tsx`.

### Fase 4 — Deuda documentada, NO se toca este turno

Quedan explicitados como deuda para un futuro (no generan búsqueda incorrecta hoy; tocarlas tiene riesgo > beneficio en este turno):

| Deuda | Por qué se deja | Ref. |
|---|---|---|
| Unificar `ValoresFiltros` y catálogos de `filtros-componentes-context` con `filtros-contesxt` + `catalogos-context` | Ámbitos distintos; no probado que duplique búsquedas. Reforzado por IA-001. | `DECISIONES-IA.md` |
| Migrar marca/línea/personal/localidad a `valoresFiltros` (una única política de filtros) | Cambio estructural mayor; requiere prueba e2e de todas las pantallas. | Fase 2 de este plan |
| Extraer helper `armarFiltrosConPaginacion` (se repite ~10 veces) | Refactor amplio sin bug visible. | — |
| Unificar `filtros-cambio-precios.tsx` (x2) | Duplicados casi idénticos pero sin inconsistencia observada. | — |
| Eliminar `consultar-linea.tsx` muerto y limpiar comentarios/`console.log` del sistema de filtros | Cosmético / impacto nulo. | — |

---

## 4. Ejemplo concreto (marca)

**Bug actual:** en `ConsultarMarcas` la sidebar muestra "Buscar por denominación".

1. El usuario escribe `Acme` **en la sidebar**. Eso va a `valoresFiltros.denominacion = "Acme"` y el botón "Buscar" sube `buscar.cont`.
2. `consultar-marca.tsx:69-73` detecta `buscar.cont > 0 && componente === "consultar-marca"` y llama `handleBuscarMarcas(true)`.
3. `handleBuscarMarcas` arma la query (líneas 136-141) leyendo **otra variable**:
   ```ts
   denominacion: filtrosMarca.denominacion,   // estado LOCAL del embebido → queda ""
   ```
   `filtrosMarca.denominacion` es el estado local del `FiltrosSimple` (que sigue vacío). El `"Acme"` de la sidebar **se descarta**.
4. Resultado: `GET /marcas/search-by?denominacion=` → devuelve **todas** las marcas. El usuario ve un filtro que no filtra.

**Qué hace la Fase 2:** al quitar `setFiltrosNecesarios({ denominacion: true })`, la sidebar deja de ofrecer ese input muerto. La única denominación que filtra es la del `FiltrosSimple` embebido (que sí actualiza `filtrosMarca` y dispara `handleBuscarMarcas(true)` vía `consultar-marca.tsx:160-164`). Queda una sola fuente, funcional.

**Ejemplo de configuración (Fase 1):** si el back devuelve `caracteresParaBusqueda: 4` y `take: 25`, hoy el login guarda eso en `sessionStorage` pero el estado React vuelve a `CONFIGURACION_DEFAULT` (3 y 10). Resultado: el autocompletado de líneas/marcas se dispara con 3 caracteres y la paginación muestra 10 filas, ignorando la empresa. Con la Fase 1 el estado queda en la config remota y, además, se restaura tras `F5`.

---

## 5. Checklist de verificación por fase

- [ ] **F0 — Baseline:** `npm run lint`, `npm run build`, `npm test` pasan antes de tocar nada.
- [ ] **F1:** build + login normal/Google + recarga mantienen una config remota distinta de defaults; logout limpia `sessionStorage`.
- [ ] **F2:** marca/línea/personal filtran por embebido; sidebar sin input muerto; localidad filtra por denominación (embebida) y por provincia (sidebar).
- [ ] **F3:** build + humo de login, producto (sidebar) y lista de precios (catálogos).
- [ ] Cualquier regresión detectada → revertir la fase (cada fase es un diff unitario).