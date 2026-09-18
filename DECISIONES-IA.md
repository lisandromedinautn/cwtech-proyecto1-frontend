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

_Nota 2026-09-16: el archivo en el working tree fue revertido por el entorno y perdió su historial de entradas (ninguna había sido commiteada). Se restauran las entradas IA-001 e IA-002 a partir de lo registrado en la sesión._

## [2026-09-16] IA-001 — Preservar configuración remota usada por filtros

- **Tarjeta / CR:** ninguna
- **Herramienta:** GitHub Copilot
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (VS Code)

### Prompt
Se pidió explicar el funcionamiento de los filtros, identificar dónde se aplican y si cada área tiene filtros personalizados o usa siempre el filtro genérico. El objetivo fue corregir inconsistencias de configuración/filtros sólo cuando afecten búsquedas o cambios futuros.

### Respuesta / propuesta de la IA
Se rastreó el flujo desde `ConfiguracionSistemaContext`, `FiltrosProvider`, la sidebar global y los componentes reutilizables `FiltrosSimple`/`FiltrosEntidad`. Se detectó que la configuración recibida del backend se guardaba en `sessionStorage`, pero el estado React se restablecía inmediatamente a `CONFIGURACION_DEFAULT`.

### Decisión tomada
Mantener los defaults como respaldo por campo, restaurar la configuración almacenada al crear el provider y actualizar el estado con la configuración recibida por login, tanto normal como con Google. La sidebar global y sus filtros se mantienen sin unificación con los filtros locales.

### Qué se descartó y por qué
No se unificaron `FiltrosProvider` y `FiltrosComponentesProvider`, ni se reemplazaron los filtros locales por la sidebar genérica: se usan en ámbitos diferentes y no se encontró evidencia de que la duplicación, por sí sola, produzca una búsqueda incorrecta. Queda como deuda revisar y consolidar ambos modelos si se busca una única política de filtros.

### Modificaciones sobre lo generado
La propuesta se limitó a corregir el reemplazo de configuración, cubrir la carga omitida en el login con Google y hacer tolerante la lectura de `sessionStorage` ante JSON inválido. No se modificaron endpoints ni reglas de negocio.

### Impacto
Se modificaron `src/componentes/sistema/ConfiguracionSistemaContext.tsx` y `src/componentes/gestion-usuario/auth-form.tsx`. La configuración `caracteresParaBusqueda` y demás parámetros quedan disponibles para búsquedas que consultan `useConfiguracionSistema`, independientemente del método de login.

### Verificación
El diagnóstico del editor no informa errores en el contexto modificado. El build completo no se ejecutó porque la herramienta de terminal fue omitida. Queda pendiente verificar manualmente una configuración remota distinta de los defaults después de ambos métodos de login y de una recarga.

## [2026-09-16] IA-002 — Plan de consolidación de filtros (documentación + plan progresivo)

- **Tarjeta / CR:** ninguna
- **Herramienta:** opencode (opencode/big-pickle, CLI)
- **Autor/a que condujo la sesión:** —
- **Link a la conversación:** no disponible (CLI)

### Prompt
Documentar el sistema de filtros (dónde se aplica, si existe filtro personalizado por área o si siempre se usa el genérico) y generar un plan de implementación progresiva que no rompa nada, con un ejemplo. Objetivo de la tarjeta: corregir inconsistencias de configuración/filtros sólo donde afecten búsquedas o cambios futuros.

### Respuesta / propuesta de la IA
Se documentó el estado actual en `PLAN-FILTROS.md` (tres mecanismos de filtrado: sidebar global, embebidos `FiltrosSimple`/`FiltrosEntidad` y el segundo contexto `FiltrosComponentesProvider`). Se priorizaron las inconsistencias con impacto real y se diseñó un plan en fases.

### Decisión tomada
Se creó `PLAN-FILTROS.md` con 4 fases:
1. Fase 1: no reemplazar la config remota por defaults en `ConfiguracionSistemaContext` (reaplicar el fix declarado en IA-001 que hoy está comentado) y limpiar `sessionStorage` en logout.
2. Fase 2: eliminar el filtro muerto de la sidebar en marca/línea/personal y dejar el embebido como única fuente; en localidad registrar sólo `provincia` en la sidebar.
3. Fase 3: quitar el `FiltrosProvider` duplicado de `main.tsx` si la auditoría de `App.tsx` confirma que todos los consumidores viven en `/admin`.
4. Fase 4: deuda documentada, sin tocar (duplicación de `ValoresFiltros`/catálogos, helper de `filtrosConPaginacion`, dos `filtros-cambio-precios`, `consultar-linea` muerto).

### Qué se descartó y por qué
- **Unificar todas las pantallas en `valoresFiltros`** (una única política de filtros): es un cambio estructural mayor que supera el alcance y el riesgo de este turno; ya está reconocido como deuda en IA-001. Se dejó como deuda de Fase 4.
- **Tocar la duplicación de catálogos/`ValoresFiltros` entre contextos**: no se encontró evidencia de que produzca búsqueda incorrecta; riesgo > beneficio.
- **Refactor del armado de `filtrosConPaginacion`** (repetido ~10 veces): refactor amplio sin bug visible.

### Modificaciones sobre lo generado
No se reescribió nada de la propuesta; la documentación recoge además el hallazgo de que IA-001 figura como aplicada pero su fix sigue comentado en el código.

### Impacto
Sólo documentación: se creó `PLAN-FILTROS.md` y se actualizó `DECISIONES-IA.md`. No se modificó código en este turno.

### Verificación
La documentación refleja el código leído al día de hoy. La Fase 1 de `ConfiguracionSistemaContext` no está aplicada todavía; queda pendiente ejecutar el plan (no realizado en este turno).
