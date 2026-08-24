# Captura de programación de rutas (v00)

Herramienta HTML/JS estática (sin backend) para que cada entidad capture su programación de distribución de una jornada, con autocompletado de unidades desde el catálogo CLUES y exportación a un `.xlsx` con el mismo formato que se usa hoy.

Ver el diseño completo en [`blueprint/herramienta-captura-programacion-plan-v00.md`](../../blueprint/herramienta-captura-programacion-plan-v00.md).

## Cómo probarla localmente

Es HTML estático que carga `clues_catalogo.json` con `fetch`, así que **no se puede abrir con doble clic** (los navegadores bloquean `fetch` sobre `file://`). Sirve la carpeta con cualquier servidor HTTP simple:

```bash
cd tools/captura-programacion
python -m http.server 8123
```

Y abre `http://localhost:8123/index.html`.

## Actualizar los textos fijos de la jornada

Editar el objeto `CONFIG` al inicio de [`app.js`](app.js):

```js
const CONFIG = {
  titulo: "...",
  subtituloFechas: "...",
  etiquetaDistribucion: "septima distribución",
  claveJornada: "septima_distribucion", // cambia también el localStorage y el nombre del archivo exportado
};
```

## Regenerar el catálogo de CLUES

Cuando se actualice `data/raw/CLUES_IMB.xlsx` (el área dijo que se actualiza mensualmente):

```bash
python scripts/generar_catalogo_clues.py
```

Esto reescribe `data/clues_catalogo.json` **y** `tools/captura-programacion/clues_catalogo.json` (la copia que sirve la herramienta).

## Despliegue en Railway

El repo es un monorepo (blueprint, docs, esta herramienta, y a futuro el sistema Django+React), así que el servicio de Railway necesita apuntar a esta subcarpeta, no a la raíz del repo:

- **Root Directory** del servicio: `tools/captura-programacion`
- Railpack detecta automáticamente el `index.html` y sirve el sitio con Caddy — no requiere `Staticfile` ni configuración adicional.
- Sin este ajuste, Railpack falla con `"could not determine how to build the app"` porque en la raíz del repo no hay nada reconocible como aplicación.

URL actual (dominio generado por Railway): `https://rutas01-production.up.railway.app`

## Limitación conocida

El catálogo `CLUES_IMB.xlsx` no contiene todos los CLUES usados en la programación real (ver hallazgo en el plan, sección 1). Cuando un CLUES no está en el catálogo, la fila permite captura manual de nombre y tipo de unidad — no bloquea la captura.
