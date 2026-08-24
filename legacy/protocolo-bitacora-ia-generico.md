# Protocolo genérico — Bitácora de avance entre asistentes IA

> Versión: 1.0
> Fecha: 2026-08-21
> Aplicable a: cualquier proyecto con más de una persona donde al menos
> alguien use un asistente IA (Claude Code u otro) para trabajar, y que ya
> siga la convención de `.context/` descrita en `protocolo_multiagentes.md`.

_Origen: generalizado a partir de `docs/propuesta-bitacora-ia.md` en el
proyecto "Contrataciones" (IMSS Bienestar) — ese documento sigue siendo la
instancia concreta y con ejemplos reales; este es el molde para replicarlo
en cualquier otro proyecto._

## Cómo usar este archivo en un proyecto nuevo

1. Cópialo a `docs/` del proyecto nuevo (o la carpeta equivalente que ahí
   sea visible/committeada para el equipo — ver más abajo por qué no puede
   ser `.context/`).
2. Reemplaza los placeholders `<integrante>` por los nombres reales de
   quienes trabajan en ese proyecto.
3. Ajusta el ejemplo de la sección "Formato de cada entrada" con un caso
   real de ese proyecto — un ejemplo concreto se entiende mejor que uno
   abstracto, y esta versión genérica deliberadamente no trae uno prestado
   de Contrataciones porque no aplicaría ahí.
4. Bórrale este bloque de instrucciones una vez adaptado — es para el
   momento de instanciarlo, no para quedarse en el documento final.

## El problema que intenta resolver

En casi cualquier equipo, uno se entera del avance de los demás por
`git fetch` + revisar commits/PRs manualmente, cada cierto tiempo. Eso
sirve para saber **qué** se construyó, pero no siempre **por qué** algo se
retrasó — por ejemplo, si alguien se atoró esperando algo de otra persona,
o si repriorizó algo a último momento sin que el resto se enterara. Ese
tipo de contexto (bloqueadores, dependencias entre el trabajo de cada
quien, cambios de prioridad) se pierde cuando la comunicación
persona-a-persona no alcanza a darse antes de que el trabajo avance —
especialmente en equipos distribuidos o asíncronos.

La idea: que cada quien (con ayuda de su asistente IA, si lo usa) deje una
nota corta y estructurada justo antes de subir cambios que el resto va a
descargar — no un diario de todo lo que se hizo, sino específicamente lo
que le sirve a otra persona para entender el contexto detrás de sus commits.

## Por qué no usar `.context/`

`.context/` (ver `protocolo_multiagentes.md`) es memoria de trabajo
**personal** de cada quien, gitignored a propósito — no está pensada para
que otros la lean, y cada integrante puede tener la suya con su propio
criterio de qué guardar. Esta bitácora necesita ser **versionada y visible
para todo el equipo**, así que va aparte, en una carpeta committeada
(típicamente dentro de `docs/`, si ese proyecto ya usa esa convención para
contenido visible al equipo — si no, cualquier carpeta trackeada por git
sirve).

## Propuesta de estructura

```
docs/bitacora/
  <integrante-1>.md
  <integrante-2>.md
  <integrante-N>.md   (uno por persona que decida sumarse; si alguien no
                        participa, simplemente su archivo no existe)
```

**Un archivo por persona, no uno compartido.** Si todos escriben en el
mismo archivo desde ramas distintas, cada merge choca ahí — con un archivo
por persona, nadie más lo toca, cero conflictos de git por diseño. Esta es
la decisión estructural más importante de todo el protocolo; casi
cualquier otra variante (formato de campos, cadencia, nombre de carpeta) se
puede ajustar después sin rehacer nada, pero el archivo-por-persona hay que
decidirlo bien desde el principio.

## Formato de cada entrada

Entradas más recientes arriba. Campos fijos para que sea escaneable rápido
entre personas (y barato de leer para una IA que agregue varias
bitácoras) — no está pensado para leerse de principio a fin como prosa
libre:

```markdown
## AAAA-MM-DD — rama `<nombre-de-la-rama>`

**Resumen:** Qué se hizo, 1-3 líneas.
**Bloqueadores activos:** Si algo te detuvo y por qué (o "ninguno").
**Depende de / afecta a:** Si tu trabajo espera algo de alguien más, o si
alguien más debería saber que tocaste algo suyo.
**Próximo:** Qué sigue — para que si alguien más iba a tocar lo mismo, lo
sepa antes de chocar.
```

_Reemplaza esto con un ejemplo real de tu proyecto al adaptar el archivo —
un caso concreto (con nombres de archivo, endpoints o decisiones reales de
ESE proyecto) se entiende mejor que la plantilla sola._

## Cuándo se actualiza

**Antes de cada push a una rama que el resto vaya a descargar**
(típicamente antes de abrir/actualizar un PR contra la rama principal) —
no por cada sesión de trabajo, para no generar entradas de cosas que
todavía ni siquiera se subieron. (Si el equipo prefiere otra cadencia —
diaria, al cierre de sesión — es un parámetro a decidir junto con el
resto, no algo fijo de este protocolo.)

## Protocolo — cómo debe comportarse cualquier IA (propia o de alguien nuevo)

Esta sección es la que resuelve el problema de fondo: que la instrucción no
viva solo en la cabeza de quien la escribió, sino en un archivo committeado
que cualquier IA del equipo (la propia, la de un compañero, la de alguien
que se sume después) pueda leer y seguir sin que nadie se lo explique en un
chat.

1. **Al iniciar sesión de trabajo en este repo**, la IA lee las entradas
   más recientes de `docs/bitacora/*.md` (no hace falta leer el historial
   completo de cada archivo — solo la entrada más reciente de cada persona
   basta para tener contexto del estado actual).
2. **Antes de un push** a una rama que el resto vaya a descargar, la IA
   ayuda a redactar (o redacta directamente, si la persona lo pide) una
   entrada nueva en el archivo de esa persona, siguiendo el formato de 4
   campos — entradas nuevas van arriba del archivo.
3. **Si el archivo de la persona todavía no existe** (alguien nuevo se
   suma), la IA lo crea con este mismo formato — no hace falta pedir
   permiso para el formato en sí, ya está definido aquí.
4. **La IA nunca edita el archivo de otra persona** — cada quien es dueño
   exclusivo del suyo, igual que cada quien es dueño de su propia rama.

## Lectura agregada periódica (síntesis entre bitácoras)

Además de que cada quien lea las entradas de los demás una por una, hay más
valor en pedirle a una IA que lea **todos los archivos de `docs/bitacora/`
juntos** y busque patrones que ninguna entrada individual muestra por sí
sola:

- Bloqueadores que llevan varias entradas repitiéndose sin resolverse.
- Dependencias cruzadas que nadie mencionó explícitamente pero que se
  infieren de leer varios lados a la vez (ej. alguien dice "voy a tocar X",
  otra persona ya lo había tocado antes sin avisar).
- Cambios de prioridad que, vistos en conjunto, explican por qué algo se
  retrasó — el tipo exacto de causa que este protocolo intenta capturar y
  que de otra forma se pierde.

**Cuándo se dispara**: por default, **a demanda**, cuando alguien del
equipo lo pida explícitamente — no automatizado desde el inicio (evita
meter infraestructura antes de saber si el ejercicio aporta). Encaja bien
justo antes de una sesión de planeación o como insumo de una
retrospectiva, si el equipo practica alguna metodología ágil. Si el equipo
crece o la cadencia a demanda no alcanza, ahí sí vale considerar una
cadencia fija (ej. semanal) o incluso automatizarla — pero no como punto de
partida.

**Qué produce**: un resumen corto (no un archivo nuevo permanente por
default) que se comparte directo en la conversación — si con el tiempo
resulta útil conservarlo, se podría empezar a guardar en algo tipo
`docs/bitacora/_sintesis-AAAA-MM-DD.md`, pero no de entrada, para no crear
otro artefacto más a mantener antes de saber si el ejercicio realmente
aporta.

## Lo que esto NO es

- No reemplaza hablar directamente cuando algo es urgente — es un
  complemento de bajo esfuerzo para lo que se pierde entre revisiones de
  rama, no un sustituto de la comunicación humana.
- No es obligatorio usar IA para escribir la entrada propia — el formato
  es texto plano, cualquiera lo puede llenar a mano en un par de minutos
  aunque no use ningún asistente (relevante en equipos donde la adopción
  de IA es pareja).
- No es un tracker de tareas ni un reemplazo de Issues/PRs — es
  específicamente para el contexto de "por qué", no el "qué" (eso ya lo
  cuentan los commits).

## Preguntas abiertas para decidir con el equipo al adoptarlo

1. ¿El formato de 4 campos sirve tal cual, o el equipo prefiere algo más
   libre / más estructurado?
2. ¿La cadencia "antes de cada push" funciona, o prefieren otra?
3. ¿Todos los integrantes se suman de entrada, o empieza con quienes ya
   usan IA y se invita al resto después? (El formato en texto plano no
   depende de tener un asistente.)
4. ¿`docs/bitacora/` es un nombre de carpeta claro para ese proyecto, o
   conviene otro (`docs/avances/`, `docs/standup/`)?
5. ¿Quién dispara la lectura agregada y cuándo — a demanda de cualquiera,
   o con una cadencia fija?
6. ¿Vale la pena guardar el resultado de esa síntesis en algún lado, o con
   compartirlo en el momento (chat/PR) es suficiente por ahora?
