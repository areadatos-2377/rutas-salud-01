# Blueprint v00 — Sistema de Programación y Seguimiento de Distribución de Insumos para la Salud

> **Superado por `blueprint-v01.md`** (2026-08-24), que incorpora las respuestas del área requirente y simplifica el modelo de datos. Este documento se conserva como histórico — no editar, no usar como fuente de verdad vigente.

> Estado del documento: **borrador inicial (v00)**. Secciones marcadas como `[DEFINIDO]` son insumo de esta sesión; las marcadas `[PENDIENTE]` requieren validación con el área requirente (ver `preguntas-area-requirente.md`).

## 0. Control de versiones

| Versión | Fecha | Cambios |
|---|---|---|
| v00 | 2026-08-21 | Borrador inicial: contexto, glosario, roles, módulos, modelo de datos preliminar y stack. |

---

## 1. Contexto y objetivo `[DEFINIDO]`

Las entidades (estados) programan la distribución de insumos para la salud hacia unidades médicas, organizada en **jornadas de distribución** de varios días. Antes de cada jornada, cada entidad define su plan de distribución: **rutas** que agrupan las unidades médicas a visitar, y para cada ruta/unidad, qué insumos y en qué cantidad se llevarán.

Durante o después de la distribución, la entidad sube **evidencia** de la entrega (fotografías, video, PDF, documentos, imágenes) por unidad médica.

**Objetivo del sistema:** permitir capturar lo *programado* y lo *entregado*, y comparar ambos para detectar desviaciones (unidades no visitadas, insumos no entregados o entregados en cantidad distinta a la programada, evidencia faltante, etc.).

## 2. Alcance `[DEFINIDO / a refinar]`

**Dentro de alcance (v00):**
- Captura de programación de distribución por entidad, jornada, ruta, unidad médica e insumo.
- Captura de evidencia de entrega (archivos + datos de lo realmente entregado).
- Comparativo programado vs. entregado.
- Gestión de catálogos (unidades médicas, insumos, entidades).
- Gestión de usuarios y roles jerárquicos.
- Histórico de movimientos.

**Fuera de alcance / por confirmar:** ver sección 9 y documento de preguntas (logística de vehículos/choferes, inventario/almacén, firma digital de recepción, notificaciones automáticas, app móvil nativa, integración con otros sistemas).

## 3. Glosario de dominio `[DEFINIDO — validar terminología exacta con el área]`

| Término | Definición de trabajo |
|---|---|
| **Entidad** | Estado / unidad administrativa que programa y ejecuta la distribución. |
| **Jornada de distribución** | Periodo (varios días) durante el cual se ejecuta un plan de distribución de insumos. |
| **Ruta** | Agrupación ordenada de unidades médicas que serán visitadas como parte de una jornada, dentro de una entidad. |
| **Unidad médica** | Punto de entrega final (clínica, hospital, centro de salud) identificado por clave (p. ej. CLUES). |
| **Insumo** | Producto de salud a distribuir, identificado por clave/catálogo. |
| **Programación** | Lo planeado antes de la jornada: qué insumo, cuánta cantidad, a qué unidad, en qué ruta. |
| **Entrega / Evidencia** | Lo efectivamente entregado, respaldado por archivos multimedia y datos de cantidad real. |
| **Comparativo** | Programado vs. entregado, a nivel unidad/insumo/ruta/jornada/entidad. |

## 4. Actores y roles `[DEFINIDO — jerarquía; permisos exactos PENDIENTES]`

Jerarquía de 4 niveles (de mayor a menor alcance):

1. **Super Administrador** — nacional. Administra catálogos maestros, cuentas de usuario, configuración del sistema. Funciones exclusivas.
2. **Administrador nacional** — visualiza información consolidada a nivel nacional (todas las entidades). Presumiblemente solo lectura / reportes.
3. **Usuario de entidad — Programación** — captura la programación de distribución (rutas, unidades, insumos, cantidades) de su entidad.
4. **Usuario de entidad — Evidencia** — captura/sube la evidencia de lo entregado durante la jornada.

```
Super Administrador
   └─ Administrador nacional (lectura nacional)
        └─ Usuario de entidad (alcance: su propia entidad)
             ├─ Rol: Programación (crea/edita plan)
             └─ Rol: Evidencia (sube entregas)
```

**Preguntas abiertas sobre roles:** ¿programación y evidencia son el mismo usuario en algunas entidades o siempre roles separados? ¿existe un nivel intermedio (p. ej. regional/jurisdicción) entre entidad y nacional? ¿el administrador nacional solo lee o también puede editar/aprobar? — ver documento de preguntas.

## 5. Módulos funcionales `[DEFINIDO — alto nivel]`

1. **Gestión de catálogos** (super admin): entidades, unidades médicas, claves de insumos, jornadas.
2. **Gestión de usuarios y roles** (super admin): alta/baja, asignación de rol y entidad.
3. **Programación de distribución** (usuario entidad – programación): crear jornada de su entidad, definir rutas, asignar unidades e insumos/cantidades por ruta.
4. **Captura de evidencia de entrega** (usuario entidad – evidencia): por unidad/insumo, registrar cantidad entregada + adjuntar archivos (foto/video/PDF/doc).
5. **Comparativo programado vs. entregado** (todos los roles, con alcance según jerarquía): dashboards y reportes con filtros por jornada, entidad, ruta, unidad, insumo.
6. **Histórico de movimientos**: bitácora de cambios/auditoría sobre programación y entregas.

## 6. Modelo de datos preliminar `[BORRADOR — nombres y campos sujetos a cambio]`

Entidades principales identificadas hasta ahora:

- **Entidad** — estado.
- **UnidadMedica** — clave (CLUES u homólogo), nombre, entidad a la que pertenece, ubicación.
- **Insumo** — clave, descripción, unidad de medida, categoría.
- **Usuario** — datos de cuenta, rol, entidad asociada (si aplica).
- **Jornada** — nombre/periodo, fecha inicio, fecha fin, entidad(es) participantes.
- **Ruta** — jornada, entidad, nombre/número de ruta, listado ordenado de unidades médicas.
- **ProgramacionDistribucion** — ruta, unidad médica, insumo, cantidad programada.
- **Entrega** (tabla "entregado") — unidad médica, insumo, cantidad entregada, fecha/hora, usuario que capturó, referencia a programación relacionada.
- **EvidenciaArchivo** — entrega asociada, tipo de archivo (foto/video/pdf/doc/imagen), archivo, metadatos (fecha de carga, usuario).
- **HistoricoMovimientos** — bitácora genérica de cambios (tabla, registro afectado, usuario, acción, timestamp, valores antes/después).

> Este modelo es un punto de partida para discusión — cardinalidades, campos obligatorios y catálogos adicionales (p. ej. jurisdicción, tipo de unidad, estatus de entrega) se definen en la etapa de levantamiento con el área.

## 7. Arquitectura técnica `[DEFINIDO]`

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| API | Django REST Framework |
| Backend | Django 5 (Python 3.12) |
| Base de datos | PostgreSQL 16 |

**Estrategia:** reemplazo total por etapas (no es una migración incremental de un sistema legacy en convivencia permanente, sino sustitución completa dividida en fases).

**Consideraciones técnicas a resolver más adelante** (no bloquean v00, pero deben quedar en el radar):
- Almacenamiento de archivos de evidencia (foto/video/PDF) — object storage (S3-compatible / Railway buckets) vs. filesystem, límites de tamaño, compresión de video.
- Autenticación (JWT vs sesión, SSO institucional si existe).
- Estrategia de despliegue/ambientes (dev/staging/prod) e infraestructura (Railway u otro proveedor).
- Offline/baja conectividad para captura de evidencia en campo (unidades médicas rurales).

## 8. Roadmap por etapas `[BORRADOR — a validar]`

*(Esqueleto sugerido; se debe ajustar con el área requirente y con la estrategia de "reemplazo total por etapas" que ya mencionaron.)*

- **Etapa 0:** Blueprint, levantamiento de requisitos, diseño de modelo de datos definitivo.
- **Etapa 1:** Catálogos base + gestión de usuarios/roles + autenticación.
- **Etapa 2:** Programación de distribución (jornadas, rutas, asignación de insumos/unidades).
- **Etapa 3:** Captura de evidencia de entrega (con carga de archivos).
- **Etapa 4:** Comparativo programado vs. entregado + reportes/dashboards.
- **Etapa 5:** Histórico de movimientos / auditoría, refinamiento de permisos, endurecimiento (seguridad, performance).
- **Etapa 6:** Corte de reemplazo total del sistema anterior (si existe uno en operación hoy).

## 9. Supuestos iniciales `[A VALIDAR]`

- Cada unidad médica pertenece a una sola entidad.
- Una ruta pertenece a una sola jornada y a una sola entidad.
- La "cantidad entregada" se captura a nivel unidad médica + insumo (no por caja/lote individual), salvo que se indique lo contrario.
- Los archivos de evidencia se asocian a un registro de entrega (unidad + insumo + jornada), no sueltos.
- No existe todavía manejo de inventario/almacén (el sistema programa y da seguimiento a distribución, no controla existencias).

## 10. Próximos pasos

1. Validar el listado de preguntas (`preguntas-area-requirente.md`) con el área requirente.
2. Ajustar glosario, roles y modelo de datos según respuestas.
3. Congelar modelo de datos v01 y diseñar diagrama ER.
4. Definir wireframes/flujos por rol (programación, evidencia, comparativo).
5. Detallar roadmap por etapas con fechas.
