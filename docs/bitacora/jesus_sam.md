# Bitácora — jesus_sam

> Formato y protocolo completo en `docs/protocolo-bitacora.md`. Entradas más recientes arriba.

## 2026-08-24 — rama `master`

**Resumen:** Construida, probada y desplegada la sub-herramienta de captura de programación (`tools/captura-programacion/`) en Railway (`https://rutas01-production.up.railway.app`) — formulario estático con autocompletado de CLUES y exportación a `.xlsx` replicando el formato institucional real (colores, bordes, logos). Blueprint actualizado a v01 con las respuestas del área requirente. Se instanció el protocolo `.context/` + esta bitácora.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** El modelo de datos del sistema principal cambió respecto al blueprint v00 — ya no hay catálogo de insumos como entidad relacional separada (la programación es agregada por unidad, no por clave). Si Jorge va a diseñar algo del backend o del modelo de datos, revisar `blueprint/blueprint-v01.md` sección 5 antes de empezar. También ojo con `data/raw/CLUES_IMB.xlsx`: tiene un desfase conocido con los CLUES reales de programación (ver `blueprint/herramienta-captura-programacion-plan-v00.md` sección 1) — no está resuelto de fondo.
**Próximo:** Diagrama ER definitivo del sistema principal y arranque del proyecto Django (backend aún no existe en código, solo la sub-herramienta estática).
