# Protocolo — Bitácora de avance entre asistentes IA (Rutas_01)

> Versión: 1.0 (instanciado para este proyecto)
> Fecha: 2026-08-24
> Adaptado de `legacy/protocolo-bitacora-ia-generico.md` para el equipo de Rutas_01: **jesus_sam** y **jorge**.

## El problema que intenta resolver

En un equipo de dos, uno se entera del avance del otro por `git fetch` + revisar commits, cada cierto tiempo. Eso sirve para saber **qué** se construyó, pero no siempre **por qué** algo se retrasó — por ejemplo, si alguien se atoró esperando algo del otro, o si repriorizó algo a último momento. Ese contexto (bloqueadores, dependencias entre el trabajo de cada quien, cambios de prioridad) se pierde entre revisiones de rama.

La idea: cada quien (con ayuda de su asistente IA) deja una nota corta y estructurada justo antes de subir cambios que el otro va a descargar.

## Por qué no usar `.context/`

`.context/` (ver `legacy/protocolo_multiagentes.md`) es memoria de trabajo **personal** de cada quien, gitignored a propósito — no está pensada para que el otro la lea. Esta bitácora necesita ser **versionada y visible para ambos**, así que va en `docs/`, committeada.

## Estructura

```
docs/bitacora/
  jesus_sam.md
  jorge.md
```

**Un archivo por persona, no uno compartido.** Si ambos escribieran en el mismo archivo desde ramas distintas, cada merge chocaría ahí — con un archivo por persona, nadie más lo toca, cero conflictos de git por diseño.

## Formato de cada entrada

Entradas más recientes arriba. Campos fijos para que sea escaneable rápido (y barato de leer para una IA que agregue ambas bitácoras) — no está pensado para leerse de principio a fin como prosa libre:

```markdown
## AAAA-MM-DD — rama `<nombre-de-la-rama>`

**Resumen:** Qué se hizo, 1-3 líneas.
**Bloqueadores activos:** Si algo te detuvo y por qué (o "ninguno").
**Depende de / afecta a:** Si tu trabajo espera algo de la otra persona, o si
ella debería saber que tocaste algo suyo.
**Próximo:** Qué sigue — para que si la otra persona iba a tocar lo mismo,
lo sepa antes de chocar.
```

Ejemplo real (primera entrada de este proyecto, ver `docs/bitacora/jesus_sam.md`):

```markdown
## 2026-08-24 — rama `master`

**Resumen:** Construida y desplegada la sub-herramienta de captura de
programación (tools/captura-programacion/) en Railway. Blueprint
actualizado a v01 con las respuestas del área requirente.
**Bloqueadores activos:** Ninguno.
**Depende de / afecta a:** El modelo de datos del sistema principal
cambió (ya no hay catálogo de insumos como entidad separada) — si Jorge
va a diseñar algo del backend, revisar blueprint-v01.md sección 5 antes.
**Próximo:** Diagrama ER definitivo y arranque del proyecto Django.
```

## Cuándo se actualiza

**Antes de cada push a `master`** (o a una rama que el otro vaya a descargar) — no por cada sesión de trabajo, para no generar entradas de cosas que todavía ni siquiera se subieron.

## Protocolo — cómo debe comportarse cualquier IA (propia o del compañero)

1. **Al iniciar sesión de trabajo en este repo**, la IA lee las entradas más recientes de `docs/bitacora/jesus_sam.md` y `docs/bitacora/jorge.md` (basta la entrada más reciente de cada archivo para tener contexto del estado actual — no hace falta leer todo el historial).
2. **Antes de un push** a una rama que el otro vaya a descargar, la IA ayuda a redactar (o redacta directamente, si la persona lo pide) una entrada nueva en el archivo de **esa persona**, siguiendo el formato de 4 campos — entradas nuevas van arriba del archivo.
3. **La IA nunca edita el archivo de la otra persona** — cada quien es dueño exclusivo del suyo.
4. Si por alguna razón el archivo de una de las dos personas no existe todavía en el checkout local, la IA lo crea con este mismo formato antes de escribir en él.

## Lectura agregada periódica (síntesis entre bitácoras)

A demanda — cuando Jesus o Jorge lo pidan explícitamente, no automatizado. Útil justo antes de una sesión de planeación. Una IA lee `docs/bitacora/jesus_sam.md` y `docs/bitacora/jorge.md` juntos y busca:

- Bloqueadores que llevan varias entradas repitiéndose sin resolverse.
- Dependencias cruzadas que ninguna entrada individual menciona explícitamente pero que se infieren de leer ambos lados a la vez.
- Cambios de prioridad que, vistos en conjunto, explican por qué algo se retrasó.

**Qué produce:** un resumen corto compartido directo en la conversación — no se guarda como archivo permanente por default.

## Decisiones tomadas para este proyecto (2026-08-24)

Resolviendo las "preguntas abiertas" del protocolo genérico:

1. Formato de 4 campos: se usa tal cual.
2. Cadencia: antes de cada push a `master`.
3. Integrantes: jesus_sam y jorge se suman desde el inicio.
4. Nombre de carpeta: `docs/bitacora/` (sin cambios).
5. Síntesis agregada: a demanda de cualquiera de los dos.
6. Guardar la síntesis: no por default — solo se comparte en el momento.

## Lo que esto NO es

- No reemplaza hablar directamente cuando algo es urgente.
- No es obligatorio usar IA para escribir la entrada propia — es texto plano.
- No es un tracker de tareas ni reemplazo de Issues/PRs — es específicamente para el "por qué", no el "qué" (eso ya lo cuentan los commits).
