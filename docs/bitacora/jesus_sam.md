# Bitácora — jesus_sam

> Formato y protocolo completo en `docs/protocolo-bitacora.md`. Entradas más recientes arriba.

## 2026-08-24 — rama `jesus_sam` (11)

**Resumen:** Botón "Descargar Excel" en RutasPage (solo `usuario_entidad`) — exporta toda la programación de su entidad para la jornada seleccionada (todas sus rutas juntas), replicando el formato institucional real de `tools/captura-programacion/` pero con título y rango de fechas **dinámicos** (calculados de `Jornada.fecha_inicio/fecha_fin` en vez de hardcodeados). Backend: agregué filtro `?jornada=` a `/api/programacion-visitas/` y el campo `ruta_numero` de solo lectura (para la columna RUTAS, que combina varias rutas en un solo archivo). `exceljs` instalado como dependencia real de npm (no vendorizado a mano como en la sub-herramienta estática, porque aquí sí hay build step).
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** Nada nuevo estructuralmente. `frontend/public/logos/` tiene copias de los logos institucionales (mismos que `docs/logos/`).
**Próximo:** Pulido pendiente — paginación real en las listas del frontend, manejo de expiración de sesión.

## 2026-08-24 — rama `jesus_sam` (10)

**Resumen:** Catálogo de coordinadores estatales. Backend: acción `PATCH /api/entidades/<id>/coordinador/` con permiso nuevo `PuedeEditarCoordinador` (admin_nacional o super_admin) — separado del resto del catálogo de Entidad (crear/borrar sigue siendo exclusivo de super_admin vía `SoloLecturaOSuperAdmin`). Frontend: `CoordinadoresPage` (editar en línea) + link de nav visible para admin_nacional y super_admin, protegido con `RequireRole`.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** Nada nuevo, sigue el mismo patrón de permisos ya establecido.
**Próximo:** Exportar a `.xlsx` desde la vista de Programación (mismo formato que `tools/captura-programacion/`), luego pulido (paginación, expiración de sesión).

## 2026-08-24 — rama `jesus_sam` (9)

**Resumen:** Comando `manage.py cargar_clues` (con `--dry-run`) — carga/actualiza Entidad y UnidadMedica en la base de datos real desde `data/raw/CLUES_IMB.xlsx` (antes ese Excel solo alimentaba el JSON de la sub-herramienta estática, nunca la base de datos del backend). Reutiliza la misma lógica de mapeo que `scripts/generar_catalogo_clues.py`. Idempotente por diseño: usa `update_or_create` por CLUES, nunca toca ni borra unidades con `origen=manual`, no borra CLUES ausentes del nuevo Excel. Probado de verdad: dry-run no escribe nada (verificado contando filas antes/después), la carga real trajo 9,460 unidades y 23 entidades, y correrlo una segunda vez da 0 creadas / todo sin cambios (confirma que es seguro para la actualización mensual que pidió el usuario).
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** La base de datos de desarrollo ya tiene el catálogo real cargado — si Jorge corre `migrate` en su propia base, va a necesitar correr `python manage.py cargar_clues` también para tener los mismos datos.
**Próximo:** El usuario pidió varias cosas más en la misma sesión: (1) exportar a `.xlsx` desde la vista de Programación del frontend con el mismo formato que `tools/captura-programacion/`, (2) catálogo de "coordinadores estatales" editable por `admin_nacional` (no solo `super_admin`), (3) paginación real en el frontend, (4) manejo de expiración de sesión.

## 2026-08-24 — rama `jesus_sam` (8)

**Resumen:** Vistas de catálogos (Entidades, Unidades médicas) para `super_admin`, y edición de ProgramacionVisita existente (botón "Editar" → formulario precargado → PATCH; CLUES queda bloqueado al editar). Encontré y corregí un gap real de seguridad/UX con la prueba en navegador: las rutas `/catalogos/*` solo ocultaban el link del nav para `usuario_entidad`, pero no protegían la ruta — por el redirect "volver a donde estabas" tras un logout/login terminé aterrizando ahí con el usuario equivocado y sí podía **ver** la página (el backend ya bloqueaba escribir, pero ver tampoco debería). Agregué `RequireRole` en `App.jsx`.
**Bloqueadores activos:** Ninguno. **Con esto el módulo de programación (backend + frontend) queda funcionalmente completo.**
**Depende de / afecta a:** Si Jorge agrega una vista nueva restringida a un rol específico, que use `RequireRole` (ya en `App.jsx`) en vez de solo esconder el link del nav — ese patrón de "solo esconder, no proteger la ruta" es fácil de repetir por accidente.
**Próximo:** A elegir entre nosotros: pulir lo ya construido (paginación, manejo de expiración de sesión) o cerrar los pendientes de blueprint-v01 sección 9 para poder diseñar el módulo de evidencia.

## 2026-08-24 — rama `jesus_sam` (7)

**Resumen:** Vistas de Rutas y ProgramacionVisita en el frontend — la captura real (CLUES con autocompletado desde catálogo, igual que tools/captura-programacion/, pero contra el backend real). Encontré y corregí un bug real durante la prueba en navegador: `RutaSerializer.entidad` era requerido por DRF, pero el frontend de `usuario_entidad` nunca lo manda (se esperaba que `perform_create` lo inyectara) — la validación fallaba antes de llegar ahí. El smoke test de backend (paso 3) no lo detectó porque siempre incluía `entidad` en el payload de prueba, aunque fuera el incorrecto. Corregido con `required=False` + validación explícita para admin/super_admin. Agregué también `?jornada=` y `?ruta=` como filtros y campos `*_nombre` de solo lectura en los serializers para que el frontend no tenga que hacer joins manuales.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** Si Jorge toca `programacion/serializers.py` o `views.py`, ojo con el patrón "campo requerido en el modelo pero inyectado server-side" — cualquier campo así necesita `required=False` en el serializer + validación explícita en el branch donde no se inyecta, si no se repite este mismo bug.
**Próximo:** Vistas de catálogos (Entidades, Unidades médicas) para super_admin; edición inline de ProgramacionVisita (hoy solo crear/eliminar).

## 2026-08-24 — rama `jesus_sam` (6)

**Resumen:** Arrancado el frontend (`frontend/`, React 19 + Vite). Sistema de diseño calcado de `legacy/propuesta-01-modulo-ce.html` (paleta guinda/verde/dorado, Fraunces+Manrope+JetBrains Mono). Autenticación real contra el backend (sesión por cookie + CSRF), Shell con nav condicionado por rol, página de Jornadas (lista + creación, solo admin_nacional/super_admin crean). Probado con Playwright en Chromium real, no solo revisión de código: redirect sin sesión, credenciales inválidas, login correcto, UI oculta según rol, logout, sesión persiste tras recargar.
**Bloqueadores activos:** Ninguno. Nota operativa: en esta máquina el puerto 8000 ya lo usa otro proyecto tuyo ("backcontra"/Contrataciones) — el backend de Rutas_01 corre en el **8010** en desarrollo (`frontend/.env` ya apunta ahí). Si Jorge no tiene ese conflicto, puede usar 8000 normal, solo hay que ajustar `VITE_API_BASE_URL`.
**Depende de / afecta a:** Añadí `CORS_ALLOW_CREDENTIALS`, `CSRF_TRUSTED_ORIGINS` y el endpoint `/api/auth/csrf/` al backend (necesarios para que el frontend funcione con cookies cross-port) — si Jorge ya había tocado `config/settings.py` o `usuarios/views.py`, revisar que no choque.
**Próximo:** Vistas de Rutas y ProgramacionVisita (la captura real) — hoy son placeholders.

## 2026-08-24 — rama `jesus_sam` (5)

**Resumen:** API DRF de `programacion` completa: `/api/jornadas/`, `/api/rutas/`, `/api/programacion-visitas/`. Probado con 8 escenarios reales vía django.test.Client (no solo revisión de código): solo admin_nacional/super_admin abren jornadas; la entidad de una ruta se fuerza server-side al crear (un usuario_entidad no puede "colar" otra entidad aunque la mande en el payload); la regla de "unidad no repetida en la misma jornada" se aplica también vía API; un usuario_entidad no puede programar sobre la ruta de otra entidad (400); admin_nacional lee todo pero no puede escribir (403); el listado queda aislado por entidad (zacatecas no ve nada de colima). **El módulo de programación queda funcionalmente completo a nivel backend.**
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** Con esto ya hay API real para que el frontend React consuma. Si Jorge empieza el frontend, los endpoints son `/api/auth/{login,logout,me}/`, `/api/entidades/`, `/api/unidades-medicas/?entidad=`, `/api/jornadas/`, `/api/rutas/`, `/api/programacion-visitas/` — todos requieren sesión iniciada (cookie), no hay token/JWT todavía.
**Próximo:** A elegir: arrancar el frontend React, o cerrar los pendientes de negocio de blueprint-v01.md sección 9 antes de diseñar evidencia.

## 2026-08-24 — rama `jesus_sam` (4)

**Resumen:** API DRF de `catalogos`: `/api/entidades/` y `/api/unidades-medicas/` (con filtro `?entidad=<id>` para poblar selects como hace tools/captura-programacion/). Probado con django.test.Client: super_admin escribe, usuario_entidad solo lee (403 al intentar crear), el filtro por entidad devuelve exactamente lo esperado.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** Nada nuevo — sigue el mismo patrón de permisos del paso anterior.
**Próximo:** Serializers/viewsets de `programacion` (Jornada, Ruta, ProgramacionVisita) — esta es la parte que reintroduce la validación de "unidad no repetida en la misma jornada" y el escenario multi-entidad.

## 2026-08-24 — rama `jesus_sam` (3)

**Resumen:** Primer paso de la API DRF: `usuarios/permissions.py` (4 clases de permiso por rol, siguiendo blueprint-v01.md secciones 2-3) y endpoints de autenticación (`/api/auth/login/`, `/logout/`, `/me/`), session-based. Probado con `django.test.Client`: login, me, logout y bloqueo post-logout (403) funcionan.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** El resto de la API (catalogos, programacion) va a importar `usuarios/permissions.py` — si Jorge también va a escribir viewsets, que reutilice esas clases en vez de reinventar la lógica de roles.
**Próximo:** Serializers/viewsets de `catalogos`, luego `programacion`.

## 2026-08-24 — rama `jesus_sam` (2)

**Resumen:** Arrancado el backend Django (`backend/`): 5 apps (usuarios, catalogos, programacion, entregas, historico) con los modelos del diagrama ER, admin registrado, migraciones generadas y validadas contra SQLite (incluye prueba real de la regla "unidad no repetida en la misma jornada" y del histórico genérico vía ContentType). Decisiones aplicadas: CLUES como PK de UnidadMedica (con soporte de alta manual), sin usuario_id en ProgramacionVisita.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** Si Jorge va a tocar el backend, que revise `backend/README.md` (pendientes conocidos) antes: falta la API DRF (solo hay modelos+admin), falta decidir autenticación de la API, y quedan 2 notas de diseño abiertas en `blueprint/diagrama-er-v01.md` (granularidad de bloqueo, almacenamiento de evidencia) que no bloquean programación pero sí evidencia.
**Próximo:** Serializers/viewsets DRF para exponer el módulo de programación.

## 2026-08-24 — rama `jesus_sam`

**Resumen:** Creado el diagrama ER definitivo del modelo de datos (`blueprint/diagrama-er-v01.md`, Mermaid) a partir de blueprint v01 sección 5. Se creó la rama personal `jesus_sam` (larga duración, se fusiona a `master` periódicamente). Nota de proceso: primero publiqué el diagrama solo como Artifact de Claude, pero eso no es visible para Jorge ni su IA (privado, requiere mi sesión de claude.ai) — se corrigió comitteándolo como `.md` con un bloque ```mermaid, que GitHub renderiza solo y que cualquier IA puede leer como texto plano vía git.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** El diagrama deja 4 notas de diseño sin resolver (ver el propio archivo): riesgo del desfase de CLUES como PK, si ProgramacionVisita necesita usuario_id propio, granularidad del bloqueo de edición, y dónde vive EvidenciaArchivo. Si Jorge empieza el backend antes de que se resuelvan, que las trate como TODO explícitos, no como decisiones cerradas.
**Próximo:** Arrancar el proyecto Django con los modelos base del diagrama.

## 2026-08-24 — rama `master`

**Resumen:** Construida, probada y desplegada la sub-herramienta de captura de programación (`tools/captura-programacion/`) en Railway (`https://rutas01-production.up.railway.app`) — formulario estático con autocompletado de CLUES y exportación a `.xlsx` replicando el formato institucional real (colores, bordes, logos). Blueprint actualizado a v01 con las respuestas del área requirente. Se instanció el protocolo `.context/` + esta bitácora.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** El modelo de datos del sistema principal cambió respecto al blueprint v00 — ya no hay catálogo de insumos como entidad relacional separada (la programación es agregada por unidad, no por clave). Si Jorge va a diseñar algo del backend o del modelo de datos, revisar `blueprint/blueprint-v01.md` sección 5 antes de empezar. También ojo con `data/raw/CLUES_IMB.xlsx`: tiene un desfase conocido con los CLUES reales de programación (ver `blueprint/herramienta-captura-programacion-plan-v00.md` sección 1) — no está resuelto de fondo.
**Próximo:** Diagrama ER definitivo del sistema principal y arranque del proyecto Django (backend aún no existe en código, solo la sub-herramienta estática).
