# Checklist de Testing - Circuito Mínimo (Gestión de Stock)

> Objetivo: verificar que el sistema funciona end-to-end tras cambios en front y back.
> Alcance: gestión de inventario — no incluye ventas, compras, cobros ni movimientos bancarios (no forman parte del sistema).
> Marcar cada ítem con ✅ OK | ❌ Error | ⚠️ Parcial

---

## 1. Autenticación

- [✅ ] Login con usuario y contraseña válidos → redirige a `/admin`
- [✅] Login con credenciales inválidas → muestra error
- [ ] Acceso directo a `/admin` sin sesión → redirige a login
- [✅ ] Logout → limpia sesión y redirige
- [ ] Acceso a una pantalla con un rol sin permiso → 403, no crashea

---

## 2. ABM Base (datos maestros)

- [ ] **Productos** → listar, crear, editar, eliminar (soft delete)
  - [ ] Verificar precios con formato `1.234,56`
  - [ ] Filtro por Marca funciona
  - [ ] Filtro por Línea funciona
  - [ ] Filtro por Proveedor funciona (bug ya corregido — confirmar que sigue andando)
  - [ ] Búsqueda por código / código de proveedor
- [ ] **Marcas** → listar, crear, editar
- [ ] **Líneas** → listar, crear, editar
- [ ] **Superlíneas** → listar, crear, editar
- [ ] **Proveedores** → listar, crear, editar, eliminar
  - [ ] Búsqueda por denominación (`search-by`) funciona con y sin `empresaId`
  - [ ] Autocomplete de proveedores en el filtro de Productos funciona (bug ya corregido)
- [ ] **Clientes** → listar, crear, editar
- [ ] **Personal** → listar, crear
- [ ] **Empresa** → listar, editar datos

---

## 3. Gestión de Stock

- [ ] **Movimiento de stock** → registrar ajuste positivo y negativo
- [ ] Stock no queda negativo tras un ajuste inválido (invariante del agregado `Producto`)
- [ ] Stock mínimo / `utilizaStockMinimo` se respeta en la validación

---

## 4. Cambio Masivo de Precios (CR-006)

- [ ] Filtrar por Línea → aplicar Porcentaje → preview muestra precio anterior tachado + nuevo
- [ ] Filtrar por Línea → aplicar Monto Fijo → ídem
- [ ] Sin filtro (alcance Global) → aplicar Porcentaje → afecta todos los productos activos
- [ ] Sin filtro (alcance Global) → aplicar Monto Fijo → ídem
- [ ] Un ajuste que deja algún producto con precio ≤ 0 → preview lo marca inválido, y al guardar se **rechaza toda la operación** (sin éxito parcial)
- [ ] Tras guardar con éxito, la tabla se refresca con los precios reales persistidos
- [ ] Se crea el registro en `cambio_precios_masivo_historial` con tipo, valor, alcance, usuario y fecha correctos
- [ ] Usuario con rol Vendedor/Empleado no puede acceder (solo Root/Administrador)
- [ ] Input de porcentaje no permite más de 100 (positivo o negativo)

---

## 5. Configuración del Sistema

- [ ] **Usuarios** → listar, crear con rol
- [ ] **Roles** → listar, verificar permisos por pantalla
- [ ] **Localidades** → listar
- [ ] **Provincias** → listar
- [ ] **Condición IVA** → listar
- [ ] **Alícuota IVA** → listar
- [ ] **Configuración del sistema** (ej. `caracteresParaBusqueda`) → se aplica correctamente en los filtros de búsqueda

---

## 6. Auditoría

- [ ] Ver auditoría de un Producto → refleja cambios (creación, edición, eliminación)
- [ ] Ver auditoría de un Proveedor → ídem

---

## Notas de regresión

- [ ] En toda tabla que muestre importes, el formato es `1.234,56` (no `1,234.56`)
- [ ] Las llamadas al back no devuelven 401/403 inesperados (token JWT vigente)
- [ ] Las llamadas al back no devuelven 500 por endpoints con contrato desalineado entre front y back (el patrón de bug que venimos encontrando: frontend pegándole a una ruta que no existe)
- [ ] El dashboard/pantalla principal carga sin errores de consola
- [ ] Ningún filtro "deja pasar todo" silenciosamente cuando debería restringir (patrón del bug SYS-008)