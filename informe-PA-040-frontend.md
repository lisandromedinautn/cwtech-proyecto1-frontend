# PA-040 — Verificar historial Git y trazabilidad de PRs (Frontend)

## 1. Metadatos

| Campo | Valor |
|---|---|
| Repositorio | `git@github.com:lisandromedinautn/cwtech-proyecto1-frontend.git` |
| Owner | `lisandromedinautn` |
| Rama principal | `main` — HEAD `a315d9e` (*Release 22/09/2026*) |
| Rama de integración | `develop` |
| Responsable | _`Lisandro Medina`_ |
| Fecha de recolección | 2026-09-24 |
| Última sincronización | `git fetch --all --prune` |
| Estado PA-040 | **Cumple con excepciones** |

## 2. Evidencia recolectada

Archivos en `evidencias/PA-040/frontend/`:

| Archivo | Comando origen |
|---|---|
| `git-log-graph.txt` | `git log --graph --oneline --decorate --all` |
| `git-log-plano.txt` | `git log --pretty=format:'%h \| %ad \| %an \| %s' --date=short --all` |
| `git-merges.txt` | `git log --merges --oneline --decorate --all` |
| `git-commits-pa.txt` | `git log --all --grep='PA-' --oneline` |
| `git-commits-cr.txt` | `git log --all --grep='CR-' --oneline` |
| `git-refactors.txt` | `git log --all --grep='refactor' -i` |
| `git-breaking.txt` | `git log --all --pretty=format:'%h %s' \| grep -E '!:'` |
| `git-branches.txt` | `git branch -a` |
| `git-ramas-no-mergeadas-main.txt` | `git branch -a --no-merged origin/main` |
| `prs-desde-git.txt` | `git log --all --merges ... \| grep -Eo 'Merge pull request #...'` |

## 3. Commits descriptivos y comprensibles

### 3.1 Convención observada

Formato **Conventional Commits** en algunos commits:

```text
feat(superlinea): incorporar SuperLínea en frontend
fix(productos): restauro el import de textoPresentacion en el listado
fix(auth): restauro el import de useConfirmation en PrivateRoute
docs(ia): registro la decisión de PA-053
hotfix(logo): logo CWTECH para todo el front
test: configuro baseline de tests frontend
fix(validaciones): acotar CUIT de Cliente/Proveedor a 11 digitos
```

### 3.2 Commits que NO siguen la convención

| Commit | Mensaje | Problema |
|---|---|---|
| `02d36a5` | `inicial` | Typo, sin tipo, sin scope |
| `e909f05` | `Update README.md` | Sin tipo, en inglés |
| `6c0684f` | `cambios en la tabla` | Sin tipo, vago |
| `46cf6bd` | `Actualizo duración de la notificacion` | Sin tipo, sin scope, typo ("notificacion") |
| `0427ce2` | `feat/PA-051-implementacion-bajoMinimo` | Usa `/` en vez de `:` |
| `fdb5d06`, `455a4ec` | `Pa-020-Testing` | Dos commits idénticos, sin tipo, capitalización inconsistente |
| `1519448` | `test: configuro baseline de tests frontend  develop` | Texto residual ("develop") |
| `a35d1be` | `PA-020 — Corregir filtro exacto de productos` | Sin tipo (usa PA como prefijo) |
| `5b1397f` | `PA-049: corrijo el fondo del select de SuperLínea` | Sin tipo |
| `7adfaff` | `PA-050: añado columna SuperLínea en admin de líneas` | Sin tipo |
| `94c5504` | `PA-028 — Incorporar SuperLínea en frontend (CR-003)` | Sin tipo |
| `222ee12` | `PA-021 — Revisar configuración y filtros frontend` | Sin tipo |
| `d1e365c` | `PA-048 —  Refactor UI más intuitiva actualización masiva precios` | Sin tipo, doble espacio |
| `5cbda1a` | `PA-013 — Alinear validaciones y errores en frontend` | Sin tipo |
| `e728f9c` | `PA-047 —  Frontend para dirigirse a la actualización masiva de precios` | Sin tipo, doble espacio |
| `ab7e975` | `PA-007 — Implementar flujo de ajuste de stock en frontend` | Sin tipo |
| `cd7e7a7` | `PA-015 — Corregir filtro por proveedor` | Sin tipo |
| `9966397` | `PA-011 — Definir matriz común de validaciones` | Sin tipo |
| `bc47d7d` | `PA-003: Adaptar frontend a la política de precio` | Sin tipo |
| `5f5d55a`, `94aad66` | `PA-020 — Corregir PrivateRoute y sesión frontend` | Sin tipo, duplicado |
| `00875b7`, `60637c7`, `a315d9e`, `f0e1ef6` | `Release <fecha>` | Sin tipo conventional |
| `f93cc8a` | `docs(ia): registro la unificación de testing, PA-053 y PA-055` | OK conventional, pero "ia" scope confuso |

**Conclusión:** conviven dos estilos (con y sin Conventional Commits). No es grave pero resta consistencia.

---

## 4. Trazabilidad PR ↔ tarjeta PA-XXX / CR

### 4.1 PRs con merge commit explícito (trazabilidad fuerte)

| PR | Rama | Tarjeta(s) | CR | Commit merge | Fecha | Estado |
|---|---|---|---|---|---|---|
| #10 | `PA-016-implementar-actualizacion-masiva-de-precios-backend` | PA-016 | — | `3b4d2e9` | 2026-09-16 | Mergeado |
| #11 | `PA-016-implementar-actualizacion-masiva-de-precios-backend` | PA-016 | — | `bc5805d` | 2026-09-17 | Mergeado |
| #13 | `PA-019-Mostrar-historial-de-precios-frontend` | PA-019 | — | `b4e08d2` | 2026-09-18 | Mergeado |
| #23 | `PA-025-Incorporar-Presentacion-en-frontend-CR-002` | PA-025 | CR-002 | `9e263f1` | 2026-09-22 | Mergeado |
| #25 | `PA-051-Implementar-bajoMinimo` | PA-051 | — | `b0c058d` | 2026-09-23 | Mergeado a `develop` |
| #26 | `unificacion-testing-PA-053-PA-055` | PA-053 + PA-055 | — | `97690e8` | 2026-09-24 | Mergeado a `develop` |

### 4.2 Tarjetas sin PR identificable (excepción)

| Tarjeta | Commit(s) | Rama asociada | Observación |
|---|---|---|---|
| PA-003 | `bc47d7d` | — | Sin PR |
| PA-007 | `ab7e975` | — | Sin PR |
| PA-011 | `9966397` | — | Sin PR |
| PA-013 | `5cbda1a` | — | Sin PR |
| PA-015 | `cd7e7a7` | — | Sin PR |
| PA-019 | `b4e08d2` | ✅ vía #13 | OK |
| PA-020 | `fdb5d06`, `455a4ec`, `5f5d55a`, `94aad66`, `a35d1be` | `Pa-020-Testing` | 5 commits, sin PR |
| PA-021 | `222ee12` | `PA-021-—-Revisar-configuración-y-filtros-frontend` | Sin PR; rama con em-dash |
| PA-025 | `9e263f1` | ✅ vía #23 | Vinculado a CR-002 |
| PA-028 | `94c5504`, `9ec792f` | — | Vinculado a CR-003 en el mensaje, sin PR |
| PA-047 | `e728f9c` | — | Sin PR |
| PA-048 | `d1e365c` | — | Sin PR |
| PA-049 | `5b1397f`, `737a373` | `bugfix/PA-049-...` | Sin PR |
| PA-050 | `7adfaff` | — | Sin PR |

### 4.3 Ramas abiertas sin merge a `main`

| Rama | Tarjeta | Estado |
|---|---|---|
| `develop` | — | Rama de integración |
| `PA-021-—-Revisar-configuración-y-filtros-frontend` | PA-021 | Sin merge a `main` |
| `PA-051-Implementar-bajoMinimo` | PA-051 | Mergeado a `develop` (#25), no a `main` |
| `Pa-020-Testing` | PA-020 | Sin PR |
| `unificacion-testing-PA-053-PA-055` | PA-053, PA-055 | Mergeado a `develop` (#26), no a `main` |

## 5. Merges y refactors principales

### 5.1 Merges relevantes

| Tipo | Commit | Descripción |
|---|---|---|
| PR merge | `97690e8` | PR #26 — unificación testing PA-053/PA-055 |
| PR merge | `b0c058d` | PR #25 — PA-051 |
| PR merge | `9e263f1` | PR #23 — PA-025 + CR-002 |
| PR merge | `b4e08d2` | PR #13 — PA-019 |
| PR merge | `bc5805d` | PR #11 — PA-016 |
| PR merge | `3b4d2e9` | PR #10 — PA-016 |
| Release | `a315d9e` | Release 22/09/2026 |
| Release | `60637c7` | Release 21/09/2026 |
| Release | `00875b7` | Release 12/09/2026 |
| Release | `f0e1ef6` | Release 12/09/2026 (otro) |
| Sync develop | `01d7b2b` | `Merge branch 'main' into develop` |
| Sync testing | `f808078` | `Merge branch 'develop' into Pa-020-Testing` |

### 5.2 Refactors identificados

| Commit | Descripción |
|---|---|
| `d1e365c` | `PA-048 — Refactor UI más intuitiva actualización masiva precios` |
| `033c260` | `feat(precios): exijo previsualización antes de guardar` |
| `d1f902b` | Merge con remote mal nombrado (`cwtech-proyecto0-frontend`) |

### 5.3 Breaking changes

Sin `!:` detectados en el frontend. No aplica.

## 6. Excepciones documentadas

| # | Excepción | Ubicación | Motivo | Impacto | Mitigación |
|---|---|---|---|---|---|
| E1 | PR #10 y #11 con la misma tarjeta PA-016 y misma rama | `3b4d2e9`, `bc5805d` | Re-apertura o duplicación del PR | Medio | Verificar en GitHub si #10 fue cerrado y #11 lo reemplazó |
| E2 | Rama con sufijo `-backend` en repo frontend | PR #10, #11 | Copy/paste del nombre del backend | Bajo | Renombrar en próximas iteraciones |
| E3 | Rama con em-dash `—` en el nombre | `PA-021-—-Revisar-configuración-y-filtros-frontend` | Carácter no ASCII | Medio (rompe scripts) | Renombrar a `PA-021-revisar-configuracion-filtros-frontend` |
| E4 | Duplicación de commits idénticos | `fdb5d06`, `455a4ec` (`Pa-020-Testing`), `5f5d55a`/`94aad66` (PA-020), `d1f902b` | Rebase/merge mal resuelto | Bajo | Documentar |
| E5 | Mezcla de convenciones (con/sin Conventional Commits) | Ver §3.2 | Flujo mixto del equipo | Bajo | Adoptar Conventional Commits obligatorio |
| E6 | Referencia a repo incorrecto | `d1f902b`: `github.com:.../cwtech-proyecto0-frontend` | Typo (proyecto**0**) | Bajo | Verificar remotos locales |
| E7 | Tarjetas PA-003/007/011/013/015/020/021/028/047/048/049/050 sin PR | Ver §4.2 | Commits directos o push a `develop` sin PR | **Alto** | Exigir PR desde PA-040 en adelante |
| E8 | PRs #25 y #26 mergeados a `develop` pero no a `main` | `b0c058d`, `97690e8` | Pendiente de release | Medio | Promover a `main` en el próximo release |
| E9 | Commits `Release <fecha>` sin tipo conventional | 4 releases | Flujo de release manual | Bajo | Usar `chore(release): ...` |
| E10 | Commit `test: configuro baseline de tests frontend  develop` | `1519448` | Texto residual pegado | Bajo | Documentar |

## 7. Cumplimiento de criterios de aceptación

| Criterio | Estado | Evidencia |
|---|---|---|
| Commits descriptivos y comprensibles | ⚠️ Parcial | §3 — conviven dos estilos |
| PRs relevantes vinculadas a PA-XXX/CR | ⚠️ Parcial | §4 — solo 6 PRs; 12 tarjetas sin PR |
| Merges/refactors principales identificados | ✅ | §5 |
| Excepciones documentadas | ✅ | §6 (E1–E10) |
| Informe con evidencia o enlaces suficientes | ✅ | §2 |

**Resultado frontend:** **Cumple con excepciones** — aceptable para cerrar PA-040 si se registran las excepciones y se acuerda flujo PR obligatorio.

## 8. Enlaces de evidencia

- Repo: `https://github.com/lisandromedinautn/cwtech-proyecto1-frontend`
- PRs: `#10`, `#11`, `#13`, `#23`, `#25`, `#26`
- Commits clave:
  - `a315d9e` — Release 22/09/2026 (HEAD main)
  - `97690e8` — PR #26 (PA-053 + PA-055)
  - `b0c058d` — PR #25 (PA-051)
  - `9e263f1` — PR #23 (PA-025 + CR-002)
  - `b4e08d2` — PR #13 (PA-019)
- Logs: `evidencias/PA-040/frontend/*.txt`

## 9. Recomendaciones

1. **Abrir PRs retroactivos** para PA-003, PA-007, PA-011, PA-013, PA-015, PA-020, PA-021, PA-028, PA-047, PA-048, PA-049, PA-050 (E7). Si ya están en `main`, se documentan como merge directo.
2. **Resolver PR #10 vs #11** (E1): confirmar cuál quedó mergeado.
3. **Renombrar** `PA-021-—-Revisar-configuración-y-filtros-frontend` → sin em-dash ni tildes (E3).
4. **Promover a `main`** los PRs #25 y #26 que están solo en `develop` (E8).
5. **Adoptar Conventional Commits obligatorio** y plantilla de PR con `Tarjeta: PA-XXX` / `CR: CR-XXX` (E5).
6. **Corregir remoto local** que apunta a `cwtech-proyecto0-frontend` (E6).

---

## 10. Observaciones críticas

- **Solo 6 PRs reales** para ~18 tarjetas mencionadas → la brecha principal es la trazabilidad PR ↔ tarjeta.
- **`Pa-020-Testing` genera 5 commits y decenas de merges cruzados** sin PR. Probablemente sea el mayor foco de desorden.
- **Rama con em-dash** (`PA-021-—-...`) es un problema real: rompe scripts y `git log --grep`.
- **Referencia a `cwtech-proyecto0-frontend`** en un merge sugiere que hubo un remoto mal configurado en algún momento.
- **Los commits con `PA-XXX` como prefijo** funcionan para grep pero no siguen Conventional Commits. Es decisión del equipo: o unifican a `feat(PA-XXX): ...` o aceptan `PA-XXX: ...` como convención propia.
