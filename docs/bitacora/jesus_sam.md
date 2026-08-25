# Bitácora — jesus_sam

> Formato y protocolo completo en `docs/protocolo-bitacora.md`. Entradas más recientes arriba.

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
