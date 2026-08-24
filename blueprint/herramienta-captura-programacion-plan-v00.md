# Plan de implementación v00 — Herramienta de captura de programación de rutas

> Sub-herramienta independiente (HTML/JS estático, sin backend) que replica el flujo actual en Excel para que cada entidad capture su programación de una jornada de distribución. Es un precursor del módulo "Programación de distribución" del proyecto principal (ver `blueprint-v00.md`).

## 0. Decisiones confirmadas con el usuario

| Tema | Decisión |
|---|---|
| CLUES no encontrado en catálogo | Autocompletar cuando exista match; si no, permitir captura manual de nombre/tipo de unidad (no bloquea). |
| Salida de la herramienta | Descargar un `.xlsx` que replica el formato original (título, textos fijos, tabla). |
| Dónde vive | Archivo estático dentro del repo (no Artifact por ahora), listo para portarse a React después. |
| Persistencia de avance | Borrador automático en `localStorage` del navegador (sin backend). |

## 1. Hallazgo crítico sobre los datos fuente `[IMPORTANTE — leer antes de construir]`

Se inspeccionaron ambos archivos con Python/openpyxl:

- **`pantalla captura/09 _ BC _ 6ta_Distr_1er_N_RUTAS_CLUES_PIEZAS.xlsx`** (hoja `Reporte`): 528 filas de datos reales para Baja California, con CLUES como `BCIMB005010`, `BCIMB004766`, `BCIMB000332`.
- **`data/raw/CLUES_IMB.xlsx`** (hojas `BD_IMB` y `BD_IMS_Final`): catálogo maestro de unidades IMSS-Bienestar, 10,573 filas totales, 179 para Baja California — pero el CLUES más alto para BC en este catálogo es `BCIMB001796`. **Ninguno de los CLUES del Excel de ejemplo existe en este catálogo.**

Conclusión: `CLUES_IMB.xlsx` es un catálogo real (probablemente el oficial/DGIS o un snapshot distinto), pero **no es la fuente que genera los CLUES usados en la programación real de distribución**. Por decisión del usuario, esto no bloquea el desarrollo: se construye el autocompletado sobre este catálogo tal cual, con fallback manual. Queda como pendiente de fondo (sección 9) conseguir el catálogo correcto más adelante — cuando se resuelva, solo hay que regenerar el JSON (sección 4.3), no rehacer la herramienta.

## 2. Estructura exacta a replicar (del Excel de ejemplo)

**Bloque de encabezado fijo (por nosotros, igual para todas las entidades/jornada):**
- Título grande (celda combinada `D2:J4`): *"PROGRAMACIÓN DE RUTAS DE LA SALUD PARA ABASTECER PIEZAS DE MEDICAMENTOS Y MATERIAL DE CURACIÓN A UNIDADES DE PRIMER NIVEL DE ATENCIÓN"* + *"17 DE AGOSTO AL 03 DE SEPTIEMBRE 2026"*.
- Etiqueta de jornada (celda combinada `A4:C4`): *"sexta distribución"*.

**Bloque de encabezado por entidad (lo llena la entidad, pero se puede pre-sugerir):**
- `ENTIDAD:` (texto)
- `COORDINADOR:` (texto — en el catálogo `Hoja1` del Excel de ejemplo existe la lista oficial de 23 entidades IMSS-Bienestar con su titular; se puede usar para auto-sugerir el nombre del coordinador al elegir entidad, editable).
- `NÚMERO DE UNIDADES DE 1er NIVEL:` (numérico — en el archivo original es manual, pero como nuestra tabla ya tiene una fila por unidad, **se calculará automáticamente** contando filas capturadas, en vez de pedirlo a mano).

**Tabla de captura (columnas A–K, en este orden):**

| # | Columna | Origen del dato |
|---|---|---|
| A | FECHA DE DISTRIBUCIÓN PROGRAMADA | Captura manual (date picker) |
| B | RUTAS | Captura manual (numérico) |
| C | CLUES | Selector, filtrado por entidad elegida |
| D | NOMBRE DE LA UNIDAD | Autocompletado desde catálogo al elegir CLUES (editable) |
| E | CLAVES A DESPLAZAR | Captura manual (numérico — cantidad de claves, no lista) |
| F | PIEZAS DE MEDICAMENTO | Captura manual (numérico) |
| G | PIEZAS DE MATERIAL DE CURACIÓN | Captura manual (numérico) |
| H | TIPO DE UNIDAD MÉDICA | Autocompletado desde catálogo al elegir CLUES (editable) — ver mapeo en 4.3 |
| I | ¿QUIÉN RECIBE EN UNIDAD? | Captura manual (texto) |
| J | TELÉFONO | Captura manual (texto/numérico) |
| K | CORREO | Captura manual (texto) |

## 3. Arquitectura

```
data/raw/CLUES_IMB.xlsx          (fuente, ya en el repo)
        │  script Python (una vez, o cuando se actualice el catálogo)
        ▼
data/clues_catalogo.json         (generado — lo consume el HTML)
        │
        ▼
tools/captura-programacion/
   ├─ index.html                 (formulario + tabla, un solo archivo)
   ├─ app.js                     (lógica: filtros, autofill, localStorage, export)
   ├─ clues_catalogo.json        (copia servida junto al HTML — mismo origen del build)
   ├─ assets/logo_rutas.png      (logo IMSS-Bienestar / Rutas de la salud)
   ├─ assets/logo_maza.png       (logo Margarita Maza 2026)
   └─ vendor/exceljs.min.js      (ExcelJS vendorizado localmente, sin CDN)
scripts/
   └─ generar_catalogo_clues.py  (xlsx -> json, reproducible)
```

**Por qué archivo estático (no framework):** es una herramienta previa al React app; debe poder abrirse con doble clic o servirse desde cualquier hosting simple, sin build step. Toda la lógica en `app.js` está escrita de forma que sea fácil de portar a un componente React más adelante (estado y funciones puras separadas del DOM en lo posible).

**Por qué vendorizar ExcelJS en vez de CDN:** al vivir como archivo estático en el repo (no Artifact), no hay restricción técnica de CDN, pero vendorizar evita que la herramienta deje de funcionar sin internet (útil para captura en unidades con conectividad limitada) y evita depender de la disponibilidad de un CDN externo para una tarea de gobierno.

## 4. Detalle de componentes

### 4.1 `scripts/generar_catalogo_clues.py`

- Lee `data/raw/CLUES_IMB.xlsx`, hoja `BD_IMB`.
- Filtra `NIVEL ATENCION == "PRIMER NIVEL"` y `ESTATUS DE OPERACION == "EN OPERACION"` (justificación: el programa es explícitamente "unidades de primer nivel de atención"; incluir de baja/en construcción no aporta).
- Por cada fila conserva: `clues`, `entidad`, `nombre_unidad`, `nombre_tipologia` (crudo), `tipo_unidad_medica` (derivado, ver mapeo abajo), `municipio`, `estatus_operacion`.
- Agrupa por entidad y escribe `data/clues_catalogo.json` con esta forma:

```json
{
  "generado_en": "2026-08-24T00:00:00",
  "fuente": "data/raw/CLUES_IMB.xlsx (hoja BD_IMB)",
  "entidades": {
    "BAJA CALIFORNIA": {
      "coordinador_sugerido": "DR. FELIPE ARREOLA TORRES",
      "unidades": [
        {"clues": "BCIMB000051", "nombre_unidad": "COLONIA LOMA LINDA", "tipo_unidad_medica": "1-2 NUCLEOS", "tipologia_original": "URBANO DE 02 NÚCLEOS BÁSICOS"}
      ]
    }
  }
}
```

- `coordinador_sugerido` sale de la hoja `Hoja1` del Excel de ejemplo (catálogo de titulares) — ese archivo también se coloca en `data/raw/` como fuente versionada.
- **Mapeo tipología → "tipo de unidad médica"** (inferido comparando ambos archivos; validar con el área antes de confiar en él para reportes formales):
  - `RURAL/URBANO DE 01 o 02 NÚCLEOS` → `"1-2 NUCLEOS"`
  - `RURAL/URBANO DE 03, 04 o 05 NÚCLEOS` → `"3-5 NUCLEOS"`
  - `RURAL/URBANO DE 06 a 12+ NÚCLEOS` → `"6-12 NUCLEOS"`
  - `UNIDAD DE ESPECIALIDADES MÉDICAS (UNEMES)` → `"UNEME"`
  - `UNIDAD MÓVIL` → `"UNIDAD MOVIL"`
  - Cualquier otra tipología (p. ej. `CENTRO DE SALUD CON HOSPITALIZACIÓN`, `CLÍNICA DE ESPECIALIDADES`) → se deja el nombre de tipología original tal cual, porque no apareció en la muestra y no se puede inferir su bucket con certeza.
- Se ejecuta manualmente (`python scripts/generar_catalogo_clues.py`) cada vez que se actualice `CLUES_IMB.xlsx`; no es parte de un pipeline automático en v00.

### 4.2 `index.html` + `app.js`

**Encabezado (fijo, hardcodeado):**
- Constantes al inicio de `app.js`: `TITULO_JORNADA`, `SUBTITULO_FECHAS`, `ETIQUETA_DISTRIBUCION` ("sexta distribución") — cambiarlas ahí es lo único que hay que tocar para reutilizar la herramienta en la próxima jornada.

**Selector de entidad:**
- `<select>` poblado desde las llaves de `clues_catalogo.json.entidades`.
- Al cambiar: (a) sugiere `COORDINADOR` (editable), (b) filtra el selector de CLUES a las unidades de esa entidad, (c) limpia/advierte si ya había filas capturadas de otra entidad.

**Tabla dinámica:**
- Botón "Agregar fila" añade un renglón con los 11 campos de la sección 2.
- Columna CLUES es un `<select>` (o input con autocompletado tipo datalist) con las unidades de la entidad elegida; opción explícita **"Unidad no está en catálogo — capturar manual"** al final de la lista, que habilita `NOMBRE DE LA UNIDAD` y `TIPO DE UNIDAD MÉDICA` como campos libres editables en vez de autocompletados.
- Al elegir un CLUES del catálogo, autocompleta `NOMBRE DE LA UNIDAD` y `TIPO DE UNIDAD MÉDICA`, pero **ambos quedan editables** (por si el dato del catálogo está desactualizado).
- Botón eliminar por fila.
- `NÚMERO DE UNIDADES DE 1er NIVEL` en el encabezado se recalcula en vivo = número de filas.

**Validaciones mínimas (cliente, no bloqueantes salvo lo esencial):**
- CLUES y fecha son obligatorios para exportar.
- Piezas/medicamento/material y claves a desplazar deben ser numéricos ≥ 0.
- Correo con formato básico (advertencia, no bloqueo — hay unidades sin correo formal en el Excel real).

**Persistencia (`localStorage`):**
- Guarda automáticamente (debounce ~1s tras cada cambio) bajo una llave por entidad, p. ej. `captura_programacion:BAJA CALIFORNIA:sexta_distribucion`.
- Al cargar la página, si hay borrador guardado para la entidad elegida, se ofrece restaurarlo.
- Botón "Limpiar captura" para borrar el borrador local explícitamente.
- Try/catch alrededor de todo acceso a `localStorage` (modo incógnito o almacenamiento bloqueado no debe romper la app).

**Exportación a `.xlsx`:**
- Con **ExcelJS** (`vendor/exceljs.min.js` — se cambió de SheetJS a ExcelJS porque este sí soporta escribir estilos: colores, negritas, bordes) se construye un libro con la misma estructura que el original: título en `D2:J4` combinado, `"sexta distribución"` en `A4:C4`, bloque `ENTIDAD/COORDINADOR/NÚMERO DE UNIDADES` en fila 6, encabezados de columna en fila 7, datos desde fila 8. Se replican anchos de columna, alturas de fila, colores (`#406E67` teal de encabezado, `#DDC9A3` tan de columnas, `#00594C` texto de valores), bordes y los logos institucionales (`assets/logo_rutas.png` en A2:C3, `assets/logo_maza.png` en K2:K4) — todo extraído directamente del Excel real (`data/raw/ejemplo_6ta_distribucion_BC.xlsx`, incluyendo su XML de dibujo para la posición exacta de los logos).
- Nombre de archivo sugerido: `{clave_entidad}_{entidad}_6ta_Distr_1er_N_RUTAS_CLUES_PIEZAS.xlsx` (mismo patrón que el archivo de ejemplo).

## 5. Fuera de alcance de v00 (explícito)

- No hay backend ni base de datos: nada se envía a un servidor, todo vive en el navegador hasta la descarga del `.xlsx`.
- No se valida contra un tope de piezas/presupuesto.
- No se resuelve la incompatibilidad de fondo del catálogo CLUES (solo se mitiga con captura manual).
- No hay login/roles todavía — cualquiera que abra el archivo puede elegir cualquier entidad (aceptable para una herramienta de captura local previa al sistema real).
- No se sube evidencia de entrega aquí — esta herramienta es solo la fase de *programación*, no la de evidencia/comparativo.

## 6. Plan de trabajo (pasos)

1. Copiar `pantalla captura/09 _ BC _ 6ta_Distr_1er_N_RUTAS_CLUES_PIEZAS.xlsx` a `data/raw/` como referencia de formato (ya está fuera de ese folder; moverlo o mantenerlo referenciado, a decidir).
2. Escribir `scripts/generar_catalogo_clues.py` y generar `data/clues_catalogo.json`; revisar a ojo 2-3 entidades para validar el mapeo de tipo de unidad médica.
3. Construir `tools/captura-programacion/index.html` con el encabezado fijo y el selector de entidad.
4. Implementar la tabla dinámica con agregar/eliminar fila y el selector de CLUES con autocompletado + fallback manual.
5. Implementar `localStorage` (guardar/restaurar/limpiar).
6. Implementar exportación a `.xlsx` replicando formato; comparar visualmente contra el original.
7. Prueba manual completa: capturar ~10 filas de una entidad real, exportar, abrir el `.xlsx` resultante y verificar que se vea igual al de ejemplo.
8. Documentar en un README corto dentro de `tools/captura-programacion/` cómo actualizar los textos fijos para la siguiente jornada y cómo regenerar el catálogo.

## 7. Riesgos y pendientes abiertos

- **[Alto]** El catálogo de CLUES no corresponde a los códigos reales de programación — impacto: el autocompletado servirá para una fracción desconocida de las unidades hasta que se consiga el catálogo correcto. Acción sugerida: pedir al área requirente el catálogo/fuente de la que salen los CLUES del Excel real (¿otro sistema, otra versión del maestro?).
- **[Medio]** El mapeo de tipología → "tipo de unidad médica" está inferido de una sola muestra (528 filas de una entidad); otras entidades podrían usar categorías distintas (UNEME, unidad móvil ya cubiertas; otras tipologías no vistas quedan sin bucket).
- ~~El logo institucional estaba vacío en el archivo original~~ — **Resuelto:** el usuario proporcionó `docs/logos/logo_rutas.png` y `docs/logos/logo_maza.png`. El export ahora replica colores (`#406E67` teal, `#DDC9A3` tan, `#00594C` texto de valores), fuentes, bordes y la posición exacta de ambos logos (extraída del XML de `drawing1.xml` del Excel real: logo izquierdo en A2:C3, logo derecho en K2:K4).
