// Captura de programación de rutas — herramienta independiente (sin backend).
// Ver blueprint/herramienta-captura-programacion-plan-v00.md para el diseño completo.

(function () {
  "use strict";

  // ---- Config fija de la jornada: editar aquí para reutilizar en la siguiente ----
  const CONFIG = {
    titulo:
      "PROGRAMACIÓN DE RUTAS DE LA SALUD PARA ABASTECER PIEZAS DE MEDICAMENTOS\nY MATERIAL DE CURACIÓN A UNIDADES DE PRIMER NIVEL DE ATENCIÓN",
    subtituloFechas: "17 DE AGOSTO AL 03 DE SEPTIEMBRE 2026",
    etiquetaDistribucion: "sexta distribución",
    claveJornada: "sexta_distribucion",
  };

  const COLUMNAS = [
    { key: "fecha", label: "FECHA DE DISTRIBUCIÓN PROGRAMADA", type: "date", width: 31.14, align: "center" },
    { key: "rutas", label: "RUTAS", type: "number", width: 16.29, align: "center" },
    { key: "clues", label: "CLUES", type: "clues", width: 19.0, align: "center" },
    { key: "nombre_unidad", label: "NOMBRE DE LA UNIDAD", type: "text", width: 49.0, align: "left" },
    { key: "claves_desplazar", label: "CLAVES A DESPLAZAR", type: "number", width: 23.29, align: "center" },
    { key: "piezas_medicamento", label: "PIEZAS DE MEDICAMENTO", type: "number", width: 23.57, align: "center" },
    { key: "piezas_material_curacion", label: "PIEZAS DE MATERIAL DE CURACIÓN", type: "number", width: 28.57, align: "center" },
    { key: "tipo_unidad_medica", label: "TIPO DE UNIDAD MÉDICA", type: "text", width: 24.71, align: "center" },
    { key: "quien_recibe", label: "¿QUIÉN RECIBE EN UNIDAD?", type: "text", width: 42.0, align: "left" },
    { key: "telefono", label: "TELÉFONO", type: "text", width: 28.86, align: "center" },
    { key: "correo", label: "CORREO", type: "text", width: 34.57, align: "left" },
  ];

  // Estilo institucional extraido del Excel real (data/raw/ejemplo_6ta_distribucion_BC.xlsx)
  const ESTILO = {
    tealBg: "FF406E67",
    tealText: "FFFFFFFF",
    tanBg: "FFDDC9A3",
    valorText: "FF00594C",
    bordeThin: { style: "thin" },
  };

  // ---- Estado ----
  let catalogo = null; // JSON cargado de clues_catalogo.json
  let unidadesPorClues = {}; // { clues: unidad } de la entidad actual
  let state = {
    entidad: "",
    coordinador: "",
    filas: [], // { id, fecha, rutas, clues, nombre_unidad, claves_desplazar, piezas_medicamento, piezas_material_curacion, tipo_unidad_medica, quien_recibe, telefono, correo }
  };
  let nextRowId = 1;
  let saveTimer = null;

  // ---- Referencias DOM ----
  const el = {
    titulo: document.getElementById("titulo-jornada"),
    subtitulo: document.getElementById("subtitulo-fechas"),
    etiqueta: document.getElementById("etiqueta-distribucion"),
    selEntidad: document.getElementById("sel-entidad"),
    inputCoordinador: document.getElementById("input-coordinador"),
    conteoUnidades: document.getElementById("conteo-unidades"),
    catalogoStatus: document.getElementById("catalogo-status"),
    tbody: document.getElementById("tbody-captura"),
    datalistClues: document.getElementById("datalist-clues"),
    btnAgregarFila: document.getElementById("btn-agregar-fila"),
    btnLimpiar: document.getElementById("btn-limpiar"),
    btnExportar: document.getElementById("btn-exportar"),
    draftStatus: document.getElementById("draft-status"),
  };

  function init() {
    el.titulo.textContent = CONFIG.titulo;
    el.subtitulo.textContent = CONFIG.subtituloFechas;
    el.etiqueta.textContent = CONFIG.etiquetaDistribucion;

    el.btnAgregarFila.addEventListener("click", () => {
      agregarFila();
      programarGuardado();
    });
    el.btnLimpiar.addEventListener("click", onLimpiarCaptura);
    el.btnExportar.addEventListener("click", onExportar);
    el.selEntidad.addEventListener("change", onEntidadChange);
    el.inputCoordinador.addEventListener("input", () => {
      state.coordinador = el.inputCoordinador.value;
      programarGuardado();
    });

    cargarCatalogo();
  }

  function cargarCatalogo() {
    fetch("clues_catalogo.json")
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        catalogo = data;
        poblarSelectEntidades();
        el.catalogoStatus.textContent =
          "Catálogo cargado (" +
          Object.keys(catalogo.entidades).length +
          " entidades). Generado: " +
          (catalogo.generado_en || "?");
      })
      .catch((err) => {
        el.catalogoStatus.textContent =
          "No se pudo cargar clues_catalogo.json (" +
          err.message +
          "). Puedes seguir capturando y llenar CLUES/nombre/tipo a mano.";
      });
  }

  function poblarSelectEntidades() {
    const entidades = Object.keys(catalogo.entidades);
    el.selEntidad.innerHTML = '<option value="">Selecciona una entidad…</option>';
    entidades.forEach((entidad) => {
      const opt = document.createElement("option");
      opt.value = entidad;
      opt.textContent = entidad;
      el.selEntidad.appendChild(opt);
    });
  }

  function onEntidadChange() {
    const nuevaEntidad = el.selEntidad.value;

    // Guarda el borrador de la entidad anterior antes de cambiar.
    if (state.entidad) {
      guardarBorrador();
    }

    state.entidad = nuevaEntidad;
    state.filas = [];
    unidadesPorClues = {};

    if (!nuevaEntidad) {
      state.coordinador = "";
      el.inputCoordinador.value = "";
      renderTabla();
      actualizarDatalist();
      actualizarConteo();
      return;
    }

    const infoEntidad = catalogo.entidades[nuevaEntidad];
    (infoEntidad.unidades || []).forEach((u) => {
      unidadesPorClues[u.clues] = u;
    });
    actualizarDatalist();

    const borrador = leerBorrador(nuevaEntidad);
    if (borrador && borrador.filas && borrador.filas.length) {
      const usar = confirm(
        "Hay una captura guardada en este navegador para " +
          nuevaEntidad +
          " (" +
          borrador.filas.length +
          " filas). ¿Quieres restaurarla?"
      );
      if (usar) {
        state.coordinador = borrador.coordinador || infoEntidad.coordinador_sugerido || "";
        state.filas = borrador.filas;
        nextRowId = Math.max(0, ...state.filas.map((f) => f.id)) + 1;
      } else {
        state.coordinador = infoEntidad.coordinador_sugerido || "";
      }
    } else {
      state.coordinador = infoEntidad.coordinador_sugerido || "";
    }

    el.inputCoordinador.value = state.coordinador;
    if (state.filas.length === 0) agregarFila();
    renderTabla();
    actualizarConteo();
  }

  function actualizarDatalist() {
    el.datalistClues.innerHTML = "";
    Object.values(unidadesPorClues)
      .sort((a, b) => a.nombre_unidad.localeCompare(b.nombre_unidad))
      .forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.clues + " · " + u.nombre_unidad;
        el.datalistClues.appendChild(opt);
      });
  }

  function nuevaFilaVacia() {
    return {
      id: nextRowId++,
      fecha: "",
      rutas: "",
      clues: "",
      nombre_unidad: "",
      claves_desplazar: "",
      piezas_medicamento: "",
      piezas_material_curacion: "",
      tipo_unidad_medica: "",
      quien_recibe: "",
      telefono: "",
      correo: "",
    };
  }

  function agregarFila() {
    state.filas.push(nuevaFilaVacia());
    renderTabla();
    actualizarConteo();
  }

  function eliminarFila(id) {
    state.filas = state.filas.filter((f) => f.id !== id);
    renderTabla();
    actualizarConteo();
    programarGuardado();
  }

  function renderTabla() {
    el.tbody.innerHTML = "";
    state.filas.forEach((fila) => {
      el.tbody.appendChild(renderFila(fila));
    });
  }

  function renderFila(fila) {
    const tr = document.createElement("tr");
    tr.dataset.id = fila.id;

    COLUMNAS.forEach((col) => {
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.value = fila[col.key] || "";
      input.dataset.key = col.key;

      if (col.type === "date") {
        input.type = "date";
      } else if (col.type === "number") {
        input.type = "number";
        input.min = "0";
      } else if (col.type === "clues") {
        input.type = "text";
        input.setAttribute("list", "datalist-clues");
        input.placeholder = "Busca por CLUES o nombre…";
      } else {
        input.type = "text";
      }

      if (col.key === "nombre_unidad" || col.key === "tipo_unidad_medica") {
        if (fila._autofilled) input.classList.add("autofilled");
      }

      input.addEventListener("input", () => onCampoInput(fila.id, col.key, input));
      input.addEventListener("change", () => onCampoChange(fila.id, col.key, input));

      td.appendChild(input);
      tr.appendChild(td);
    });

    const tdBtn = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-eliminar-fila";
    btn.title = "Eliminar fila";
    btn.textContent = "✕";
    btn.addEventListener("click", () => eliminarFila(fila.id));
    tdBtn.appendChild(btn);
    tr.appendChild(tdBtn);

    return tr;
  }

  function onCampoInput(id, key, input) {
    const fila = state.filas.find((f) => f.id === id);
    if (!fila) return;
    fila[key] = input.value;
    if (key === "nombre_unidad" || key === "tipo_unidad_medica") {
      fila._autofilled = false;
      input.classList.remove("autofilled");
    }
    programarGuardado();
  }

  function onCampoChange(id, key, input) {
    if (key !== "clues") return;
    const fila = state.filas.find((f) => f.id === id);
    if (!fila) return;

    const raw = input.value.trim();
    const cluesToken = raw.includes(" · ") ? raw.split(" · ")[0].trim() : raw;
    fila.clues = cluesToken;
    input.value = cluesToken;

    const unidad = unidadesPorClues[cluesToken];
    if (unidad) {
      fila.nombre_unidad = unidad.nombre_unidad;
      fila.tipo_unidad_medica = unidad.tipo_unidad_medica;
      fila._autofilled = true;
    } else {
      fila._autofilled = false;
    }
    renderTabla();
    programarGuardado();
  }

  function actualizarConteo() {
    el.conteoUnidades.textContent = String(state.filas.length);
  }

  // ---- Borrador en localStorage ----
  function claveStorage(entidad) {
    return "captura_programacion:" + entidad + ":" + CONFIG.claveJornada;
  }

  function guardarBorrador() {
    if (!state.entidad) return;
    try {
      localStorage.setItem(
        claveStorage(state.entidad),
        JSON.stringify({ coordinador: state.coordinador, filas: state.filas })
      );
      el.draftStatus.textContent = "Borrador guardado " + new Date().toLocaleTimeString();
      el.draftStatus.classList.add("draft-status--saved");
    } catch (e) {
      el.draftStatus.textContent = "No se pudo guardar el borrador localmente (" + e.message + ")";
      el.draftStatus.classList.remove("draft-status--saved");
    }
  }

  function leerBorrador(entidad) {
    try {
      const raw = localStorage.getItem(claveStorage(entidad));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function programarGuardado() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(guardarBorrador, 1000);
  }

  function onLimpiarCaptura() {
    if (!state.entidad) {
      alert("Primero elige una entidad.");
      return;
    }
    const ok = confirm(
      "Esto borra la captura actual y el borrador guardado para " + state.entidad + ". ¿Continuar?"
    );
    if (!ok) return;
    try {
      localStorage.removeItem(claveStorage(state.entidad));
    } catch (e) {
      /* almacenamiento no disponible, no es crítico */
    }
    state.filas = [];
    agregarFila();
    el.draftStatus.textContent = "Borrador local eliminado.";
    el.draftStatus.classList.remove("draft-status--saved");
  }

  // ---- Exportar a Excel (ExcelJS) ----
  function aplicarBordeCompleto(cell) {
    cell.border = {
      top: ESTILO.bordeThin,
      bottom: ESTILO.bordeThin,
      left: ESTILO.bordeThin,
      right: ESTILO.bordeThin,
    };
  }

  async function cargarImagenComoBase64(ruta) {
    const resp = await fetch(ruta);
    const buffer = await resp.arrayBuffer();
    let binario = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binario += String.fromCharCode(bytes[i]);
    return btoa(binario);
  }

  async function onExportar() {
    const errores = validarParaExportar();
    if (errores.length) {
      alert("Antes de exportar corrige:\n\n- " + errores.join("\n- "));
      return;
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Reporte", {
      views: [{ showGridLines: false }],
    });

    ws.columns = COLUMNAS.map((col) => ({ width: col.width }));
    ws.getRow(2).height = 30;
    ws.getRow(3).height = 30;
    ws.getRow(4).height = 30;
    ws.getRow(6).height = 32.45;
    ws.getRow(7).height = 45.6;

    // ---- Bloque de titulo (fijo, igual para todas las entidades) ----
    ws.mergeCells("D2:J4");
    const tituloCell = ws.getCell("D2");
    tituloCell.value = CONFIG.titulo + "\n" + CONFIG.subtituloFechas;
    tituloCell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
    tituloCell.font = { bold: true, size: 16, name: "Noto Sans", color: { argb: ESTILO.tealText } };
    tituloCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ESTILO.tealBg } };

    ws.mergeCells("A4:C4");
    const etiquetaCell = ws.getCell("A4");
    etiquetaCell.value = CONFIG.etiquetaDistribucion;
    etiquetaCell.font = { size: 24, name: "Aptos Narrow" };
    etiquetaCell.alignment = { vertical: "middle", horizontal: "center" };
    etiquetaCell.border = { bottom: ESTILO.bordeThin, left: ESTILO.bordeThin, right: ESTILO.bordeThin };

    ws.mergeCells("K2:K4"); // hueco reservado para el logo derecho (Margarita Maza)

    // ---- Bloque ENTIDAD / COORDINADOR / NÚMERO DE UNIDADES ----
    const etiquetaHeader = (coord, texto, align) => {
      const cell = ws.getCell(coord);
      cell.value = texto;
      cell.font = { bold: true, name: "Noto Sans", color: { argb: ESTILO.tealText } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ESTILO.tealBg } };
      cell.alignment = { vertical: "middle", horizontal: align || "center", wrapText: true };
      aplicarBordeCompleto(cell);
    };
    const valorHeader = (coord, texto) => {
      const cell = ws.getCell(coord);
      cell.value = texto;
      cell.font = { bold: true, size: 12, name: "Noto Sans", color: { argb: ESTILO.valorText } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      aplicarBordeCompleto(cell);
    };

    etiquetaHeader("A6", "ENTIDAD: ");
    ws.mergeCells("B6:C6");
    valorHeader("B6", state.entidad);
    aplicarBordeCompleto(ws.getCell("C6"));

    etiquetaHeader("E6", "COORDINADOR: ", "left");
    ws.mergeCells("F6:G6");
    valorHeader("F6", state.coordinador);
    aplicarBordeCompleto(ws.getCell("G6"));

    etiquetaHeader("I6", "NÚMERO DE UNIDADES DE 1er NIVEL:", "left");
    valorHeader("J6", state.filas.length);
    aplicarBordeCompleto(ws.getCell("K6"));

    // ---- Encabezados de columna ----
    const headerRow = ws.getRow(7);
    COLUMNAS.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.label;
      cell.font = { bold: true, size: 10, name: "Noto Sans" };
      cell.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ESTILO.tanBg } };
      aplicarBordeCompleto(cell);
    });
    headerRow.commit();

    // ---- Filas de datos ----
    state.filas.forEach((fila, idx) => {
      const row = ws.getRow(8 + idx);
      COLUMNAS.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        let value = fila[col.key];
        if (col.type === "date" && value) {
          const [y, m, d] = value.split("-").map(Number);
          value = new Date(Date.UTC(y, m - 1, d));
          cell.numFmt = "dd/mm/yyyy";
        } else if (col.type === "number" && value !== "") {
          value = Number(value);
        }
        cell.value = value === "" ? null : value;
        cell.font = { name: "Aptos Narrow", size: 11 };
        cell.alignment = { horizontal: col.align, vertical: "middle", wrapText: true };
        aplicarBordeCompleto(cell);
      });
      row.commit();
    });

    // ---- Logos institucionales ----
    try {
      const logoRutasB64 = await cargarImagenComoBase64("assets/logo_rutas.png");
      const idRutas = wb.addImage({ base64: "data:image/png;base64," + logoRutasB64, extension: "png" });
      ws.addImage(idRutas, { tl: { col: 0, row: 1 }, br: { col: 3, row: 3 } });

      const logoMazaB64 = await cargarImagenComoBase64("assets/logo_maza.png");
      const idMaza = wb.addImage({ base64: "data:image/png;base64," + logoMazaB64, extension: "png" });
      ws.addImage(idMaza, { tl: { col: 10, row: 1 }, br: { col: 11, row: 4 } });
    } catch (e) {
      console.warn("No se pudieron insertar los logos en el Excel:", e);
    }

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const nombreArchivo =
      (state.entidad || "entidad").replace(/\s+/g, "_") +
      "_" +
      CONFIG.claveJornada +
      "_RUTAS_CLUES_PIEZAS.xlsx";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    guardarBorrador();
  }

  function validarParaExportar() {
    const errores = [];
    if (!state.entidad) errores.push("Selecciona una entidad.");
    if (state.filas.length === 0) errores.push("Agrega al menos una fila.");
    state.filas.forEach((f, i) => {
      if (!f.fecha) errores.push("Fila " + (i + 1) + ": falta la fecha de distribución.");
      if (!f.clues) errores.push("Fila " + (i + 1) + ": falta el CLUES.");
    });
    return errores;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
