# Rutas_01 — instrucciones para Claude Code

Sistema de programación y seguimiento de distribución de insumos de salud para IMSS-Bienestar. Ver `.context/projectBrief.md` para el resumen completo y `blueprint/blueprint-v01.md` para reglas de negocio, roles y modelo de datos.

Repo de trabajo de dos personas: **jesus_sam** y **jorge**, cada quien puede usar su propio asistente IA. Este archivo aplica sin importar quién esté trabajando ni qué asistente use — síguelo siempre, no solo cuando alguien lo mencione explícitamente.

## Al iniciar cualquier sesión de trabajo en este repo

1. Lee `.context/activeContext.md` y `.context/progress.md` para saber en qué se quedó y qué sigue pendiente.
   - Si `.context/` no existe todavía en este checkout (es personal y está en `.gitignore` — no se sincroniza por git), créalo: los 5 archivos que describe `legacy/protocolo_multiagentes.md` sección 2 (`projectBrief.md`, `productContext.md`, `techContext.md`, `activeContext.md`, `progress.md`). Arranca su contenido leyendo `blueprint/blueprint-v01.md`, `docs/bitacora/*.md` y el estado actual del repo — no copies el `.context/` de otra persona, cada quien mantiene el suyo.
2. Lee la entrada más reciente de **ambos** archivos en `docs/bitacora/` (`jesus_sam.md` y `jorge.md`) — basta la más reciente de cada uno, no hace falta el historial completo. Esto te da el contexto de qué hizo la otra persona recientemente, bloqueadores activos y si algo que vas a tocar depende de o afecta su trabajo.

## Antes de hacer push a una rama que la otra persona vaya a descargar

Ayuda a redactar (o redacta directamente si te lo piden) una entrada nueva en el archivo de bitácora de **quien está trabajando en esta sesión** — determina de quién es la sesión por el nombre configurado en `git config user.name`/`user.email`, o pregúntalo si no es claro. Formato de 4 campos en `docs/protocolo-bitacora.md`. Entradas nuevas van arriba del archivo.

**Nunca edites el archivo de bitácora de la otra persona** — cada quien es dueño exclusivo del suyo.

## Al cerrar una sesión significativa (>30 min o cambios importantes)

Actualiza `.context/activeContext.md` y `.context/progress.md` con lo avanzado y las decisiones tomadas (regla de `legacy/protocolo_multiagentes.md` sección 2).

## Uso de subagentes

Sigue `legacy/protocolo_multiagentes.md` para cuándo y cómo lanzar subagentes (`Explore`, `Plan`, `general-purpose`, `simplify`) — tipos, prompts autocontenidos, y cuándo NO usarlos (tareas triviales, cambios pequeños, resultados secuenciales dependientes).

## Documentos clave

- `blueprint/blueprint-v01.md` — blueprint vigente (el v00 se conserva como histórico, no lo edites).
- `blueprint/preguntas-area-requirente.md` — preguntas/respuestas del área requirente.
- `docs/protocolo-bitacora.md` — protocolo completo de la bitácora compartida.
- `tools/captura-programacion/` — sub-herramienta ya construida y desplegada (ver su `README.md` para correrla localmente y su configuración de despliegue en Railway).

## Convenciones

- No commitear nunca `.env` (contiene credenciales) — ya está en `.gitignore`, verifícalo si algo se ve raro en `git status` antes de un `git add` amplio.
- Este proyecto es de reemplazo total por etapas de un proceso hoy manejado en Excel — cuando el requisito no sea claro, el Excel real (`pantalla captura/09 _ BC _ 6ta_Distr_1er_N_RUTAS_CLUES_PIEZAS.xlsx`) y `data/raw/CLUES_IMB.xlsx` son referencia más confiable que el modelo teórico del blueprint v00.
