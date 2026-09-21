# Instrucciones para agentes de IA en este repositorio

Este proyecto es un trabajo práctico de Ingeniería y Calidad de Software (UTN). La consigna
exige **trazabilidad del uso de IA**: no alcanza con que el código funcione, hay que poder
explicar qué se le pidió a la herramienta, qué devolvió, qué se aceptó, qué se descartó y por
qué. Esa evidencia forma parte de la nota.

## Regla obligatoria: registrar las decisiones significativas

Cuando trabajes en este repo respondiendo a un **prompt significativo** (definición abajo),
antes de terminar el turno **agregá una entrada en [`DECISIONES-IA.md`](DECISIONES-IA.md)**
siguiendo la plantilla que está en ese archivo.

La entrada es parte del entregable, igual que el código. Un cambio significativo sin su
entrada se considera incompleto.

### Qué es un prompt significativo

Registrá si se cumple **al menos una** de estas condiciones:

- Cambia el **modelo de dominio**: entidades, value objects, agregados, invariantes, eventos.
- Cambia el **esquema de base de datos** o agrega/modifica una migración.
- Cambia el **contrato** entre front y back: endpoints, DTOs, forma de la respuesta.
- Implementa o modifica una **regla de negocio** (precio, margen, stock mínimo, validaciones).
- Corresponde a una **tarjeta del tablero** (PA-xxx, SYS-xxx) o a un **CR** (CR-001..CR-007).
- Toma una **decisión de arquitectura o de diseño** entre alternativas: dónde ubicar una
  regla, qué patrón usar, qué refactor hacer.
- Reconoce, paga o asume **deuda técnica**.
- Define o cambia una **convención** del proyecto (naming, estructura de carpetas, testing).
- Elige una **estrategia de testing** o justifica un nivel de cobertura.

### Qué NO registrar

No ensucies el registro con ruido. **No** hace falta entrada para:

- Typos, formato, imports, renombres locales sin impacto.
- Preguntas de exploración que no derivaron en ningún cambio.
- Comandos de consulta (`git status`, correr los tests, levantar el server).
- Repetir con otras palabras una decisión ya registrada: en ese caso **editá la entrada
  existente** en vez de crear una nueva.

### Cómo escribirla

- **Una entrada por decisión**, no una por mensaje.
- Escribí **qué se descartó y por qué**. Eso es lo que demuestra criterio; una entrada que
  sólo dice lo que se hizo no sirve para la rúbrica.
- Sé honesto: si algo quedó sin verificar, si un test falla, si asumiste algo sin confirmarlo,
  **decilo en la entrada**.
- Citá archivos y líneas concretas cuando ayuden a encontrar el cambio.
- Si el agente propuso algo y el equipo lo **modificó o rechazó**, eso también va registrado.

## Nota específica del front

Las reglas de negocio (precio, margen, stock mínimo) **no viven acá**: viven en el dominio del
backend. Si un prompt te lleva a calcular una regla en un componente de React, eso es un
antipatrón anémico según el Análisis de Dominio: registralo en `DECISIONES-IA.md` como deuda
técnica y proponé moverla al back, en vez de dejarla escondida en la UI.
