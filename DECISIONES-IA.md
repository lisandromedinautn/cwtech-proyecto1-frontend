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

## [2026-09-17] UI-001 — Orden del flujo de cambio masivo de precios

- **Tarjeta / CR:** ninguna
- **Herramienta:** OpenAI GPT-5.6 Terra vía OpenCode
- **Autor/a que condujo la sesión:** no informado
- **Link a la conversación:** no disponible (CLI)

### Prompt
Reordenar la UI de `admin/cambio-precios-masivo`: título Productos arriba; luego búsqueda con input, select, Buscar y Borrar; después el tipo y valor del ajuste, Seleccionar todo, Aplicar y Guardar cambios. Ubicar y ampliar el texto de alcance de manera intuitiva. Luego, reemplazar el alcance derivado de la línea por un selector explícito: Global debe cargar todos los productos paginados y Línea debe habilitar la búsqueda de línea. No realizar commit todavía.

### Respuesta / propuesta de la IA
Se propuso separar el encabezado en tres bloques verticales: título, filtros de búsqueda y acciones del ajuste. Se reemplazó la indicación de alcance por un selector explícito, que controla tanto el filtro enviado como la disponibilidad de los campos de línea. Se propuso llamar `Previsualizar cambios` a la acción que calcula el resultado sin persistirlo.

### Decisión tomada
Se implementó el orden solicitado y el título `Actualización masiva de precios`. El selector de alcance comienza sin una opción seleccionada y, al elegir Global, obtiene todos los productos con la paginación existente sin enviar `lineaId`. Al seleccionar Línea, se habilitan la denominación y el selector de línea, se limpia la tabla y se exige seleccionar una línea antes de buscar. Se eliminó el texto redundante de alcance. Los botones incluyen texto además de sus íconos y la acción de cálculo se denomina `Previsualizar cambios`.

### Qué se descartó y por qué
Se descartó conservar el alcance como texto pequeño entre el valor del ajuste y la selección, porque no permitía elegir ni expresaba con claridad qué conjunto se vería afectado. También se descartó inferir el alcance a partir de `lineaId`, porque el usuario no podía distinguir el alcance global de una línea antes de operar. Se descartó agrupar título, filtros y acciones en una sola fila adaptable, ya que en pantallas pequeñas alteraba el orden operativo solicitado.

### Modificaciones sobre lo generado
Se mantuvieron los endpoints, DTOs y cálculos del backend. Se agregó estado de UI para el alcance y se ajustaron los handlers de búsqueda y paginación para enviar `lineaId` sólo para Línea. No se trasladaron cálculos ni reglas de precios al frontend.

### Impacto
Se modificaron `src/componentes/gestion-producto/precios/cambio-precios-masivo/componentes/filtros-cambio-precios.tsx`, `src/componentes/gestion-producto/precios/cambio-precios-masivo/util/cambio-precios-masivo.tsx`, `src/componentes/ui/Button.tsx` y este registro. No se modificaron endpoints, DTOs, reglas de negocio ni tests.

### Verificación
`npm run build` finalizó correctamente después del cambio de alcance. `npm run lint` continúa fallando por 23 errores preexistentes en otros archivos, incluidos plugins de `.opencode` y componentes no relacionados; no reportó errores en los archivos modificados. La verificación visual manual en `localhost:5173` quedó pendiente.
