import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth, ROLES } from '../auth/AuthContext';
import { NIVELES_POR_CATEGORIA, CATEGORIA_LABEL } from '../utils/categoriaNiveles';
import '../styles/table.css';
import './JornadaDetallePage.css';

const TIPO_LABEL = { ordinaria: 'Ordinaria', extraordinaria: 'Extraordinaria', emergencia: 'Emergencia' };

const CAMPOS_VACIOS_UNIDAD = {
  clues: '',
  unidad_medica_nombre: '',
  tipo_unidad_medica: '',
  fecha_distribucion_programada: '',
  claves_a_desplazar: '',
  piezas_medicamento: '',
  piezas_material_curacion: '',
  quien_recibe: '',
  telefono: '',
  correo: '',
};

function agruparPorEntidad(rutas, visitas) {
  const visitasPorRuta = new Map();
  for (const v of visitas) {
    if (!visitasPorRuta.has(v.ruta)) visitasPorRuta.set(v.ruta, []);
    visitasPorRuta.get(v.ruta).push(v);
  }

  const porEntidad = new Map();
  for (const r of rutas) {
    if (!porEntidad.has(r.entidad_nombre)) porEntidad.set(r.entidad_nombre, []);
    porEntidad.get(r.entidad_nombre).push({ ...r, visitas: visitasPorRuta.get(r.id) || [] });
  }

  return [...porEntidad.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([entidad, rutasDeEntidad]) => ({
      entidad,
      rutas: rutasDeEntidad.sort((a, b) => a.numero_o_nombre.localeCompare(b.numero_o_nombre)),
      totalUnidades: rutasDeEntidad.reduce((acc, r) => acc + r.visitas.length, 0),
    }));
}

export default function JornadaDetallePage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  // usuario_entidad de por si solo ve su propia entidad (el backend ya la
  // filtra) -- el selector solo tiene sentido para roles que ven varias.
  const puedeFiltrarEntidad = usuario?.rol !== ROLES.USUARIO_ENTIDAD;
  // admin_nacional ve todo pero es de solo lectura (PuedeGestionarProgramacion).
  const puedeEscribir = usuario?.rol === ROLES.USUARIO_ENTIDAD || usuario?.rol === ROLES.SUPER_ADMIN;

  const [jornada, setJornada] = useState(null);
  const [grupos, setGrupos] = useState(null);
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [error, setError] = useState(null);

  // ---- Agregar ruta (formulario global, una sola ruta en construcción a la vez) ----
  const [entidades, setEntidades] = useState([]);
  const [mostrarFormRuta, setMostrarFormRuta] = useState(false);
  const [formRuta, setFormRuta] = useState({ entidad: '', numero: '' });
  const [guardandoRuta, setGuardandoRuta] = useState(false);
  const [errorRuta, setErrorRuta] = useState(null);

  // ---- Agregar unidad a una ruta (una a la vez, catálogo de CLUES cacheado por entidad) ----
  const [catalogoUnidadesPorEntidad, setCatalogoUnidadesPorEntidad] = useState({});
  const [rutaAgregandoUnidadId, setRutaAgregandoUnidadId] = useState(null);
  const [formUnidad, setFormUnidad] = useState(CAMPOS_VACIOS_UNIDAD);
  const [autocompletadoUnidad, setAutocompletadoUnidad] = useState(false);
  const [guardandoUnidad, setGuardandoUnidad] = useState(false);
  const [errorUnidad, setErrorUnidad] = useState(null);

  async function cargarDetalle() {
    try {
      const [j, rutas, visitas] = await Promise.all([
        api.get(`/api/jornadas/${id}/`),
        api.getAll(`/api/rutas/?jornada=${id}`),
        api.getAll(`/api/programacion-visitas/?jornada=${id}`),
      ]);
      setJornada(j);
      setGrupos(agruparPorEntidad(rutas, visitas));
    } catch {
      setError('No se pudo cargar el detalle de la jornada.');
    }
  }

  useEffect(() => {
    cargarDetalle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (usuario?.rol === ROLES.SUPER_ADMIN) {
      api.getAll('/api/entidades/').then(setEntidades);
    }
  }, [usuario]);

  function onAbrirFormRuta() {
    const entidadPrefiltrada = entidades.find((e) => e.nombre === filtroEntidad);
    setFormRuta({ entidad: entidadPrefiltrada ? String(entidadPrefiltrada.id) : '', numero: '' });
    setErrorRuta(null);
    setMostrarFormRuta(true);
  }

  function onCancelarFormRuta() {
    setMostrarFormRuta(false);
    setFormRuta({ entidad: '', numero: '' });
    setErrorRuta(null);
  }

  async function onCrearRuta(e) {
    e.preventDefault();
    setGuardandoRuta(true);
    setErrorRuta(null);
    try {
      const cuerpo = { jornada: Number(id), numero_o_nombre: formRuta.numero };
      if (usuario.rol === ROLES.SUPER_ADMIN) cuerpo.entidad = Number(formRuta.entidad);
      await api.post('/api/rutas/', cuerpo);
      setMostrarFormRuta(false);
      setFormRuta({ entidad: '', numero: '' });
      await cargarDetalle();
    } catch {
      setErrorRuta('No se pudo crear la ruta.');
    } finally {
      setGuardandoRuta(false);
    }
  }

  async function onEliminarRuta(ruta) {
    const advertencia = ruta.visitas.length
      ? `Esto elimina la ruta ${ruta.numero_o_nombre} y sus ${ruta.visitas.length} unidad(es) programada(s). ¿Continuar?`
      : `¿Eliminar la ruta ${ruta.numero_o_nombre}?`;
    if (!confirm(advertencia)) return;
    await api.del(`/api/rutas/${ruta.id}/`);
    await cargarDetalle();
  }

  async function onAbrirFormUnidad(ruta) {
    setRutaAgregandoUnidadId(ruta.id);
    setFormUnidad(CAMPOS_VACIOS_UNIDAD);
    setAutocompletadoUnidad(false);
    setErrorUnidad(null);
    if (!catalogoUnidadesPorEntidad[ruta.entidad]) {
      const nivelesPermitidos = NIVELES_POR_CATEGORIA[ruta.jornada_categoria] || 'PRIMER NIVEL';
      const params = new URLSearchParams({ entidad: ruta.entidad, nivel_atencion: nivelesPermitidos });
      const lista = await api.getAll(`/api/unidades-medicas/?${params}`);
      setCatalogoUnidadesPorEntidad((prev) => ({ ...prev, [ruta.entidad]: lista }));
    }
  }

  function onCancelarFormUnidad() {
    setRutaAgregandoUnidadId(null);
    setFormUnidad(CAMPOS_VACIOS_UNIDAD);
    setAutocompletadoUnidad(false);
    setErrorUnidad(null);
  }

  function onCluesChangeUnidad(ruta, valorInput) {
    const clues = valorInput.includes(' · ') ? valorInput.split(' · ')[0].trim() : valorInput.trim();
    const unidades = catalogoUnidadesPorEntidad[ruta.entidad] || [];
    const unidad = unidades.find((u) => u.clues === clues);
    if (unidad) {
      setFormUnidad((f) => ({
        ...f,
        clues,
        unidad_medica_nombre: unidad.nombre,
        tipo_unidad_medica: unidad.tipo_unidad_medica || '',
      }));
      setAutocompletadoUnidad(true);
    } else {
      setFormUnidad((f) => ({ ...f, clues }));
      setAutocompletadoUnidad(false);
    }
  }

  async function onCrearUnidad(e, ruta) {
    e.preventDefault();
    setGuardandoUnidad(true);
    setErrorUnidad(null);
    const cuerpo = {
      ruta: ruta.id,
      unidad_medica: formUnidad.clues,
      fecha_distribucion_programada: formUnidad.fecha_distribucion_programada,
      claves_a_desplazar: Number(formUnidad.claves_a_desplazar) || 0,
      piezas_medicamento: Number(formUnidad.piezas_medicamento) || 0,
      piezas_material_curacion: Number(formUnidad.piezas_material_curacion) || 0,
      tipo_unidad_medica: formUnidad.tipo_unidad_medica,
      quien_recibe: formUnidad.quien_recibe,
      telefono: formUnidad.telefono,
      correo: formUnidad.correo,
    };
    try {
      await api.post('/api/programacion-visitas/', cuerpo);
      setRutaAgregandoUnidadId(null);
      setFormUnidad(CAMPOS_VACIOS_UNIDAD);
      setAutocompletadoUnidad(false);
      await cargarDetalle();
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        const mensaje = err.data.non_field_errors?.[0] || err.data.detail || JSON.stringify(err.data);
        setErrorUnidad(mensaje);
      } else {
        setErrorUnidad('No se pudo guardar la unidad.');
      }
    } finally {
      setGuardandoUnidad(false);
    }
  }

  async function onEliminarUnidad(visitaId) {
    if (!confirm('¿Eliminar esta unidad programada?')) return;
    await api.del(`/api/programacion-visitas/${visitaId}/`);
    await cargarDetalle();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">
            <Link to="/jornadas">Jornadas</Link>
          </p>
          <h2>{jornada?.nombre || 'Cargando…'}</h2>
          {jornada && (
            <p className="jornada-meta">
              {TIPO_LABEL[jornada.tipo] || jornada.tipo} ·{' '}
              <span className={`badge ${jornada.categoria === 'primer_nivel' ? 'verde' : 'dorado'}`}>
                {CATEGORIA_LABEL[jornada.categoria] || jornada.categoria}
              </span>{' '}
              · {jornada.fecha_inicio} al {jornada.fecha_fin}
            </p>
          )}
        </div>
        {puedeEscribir && jornada && !mostrarFormRuta && (
          <button className="btn-primary" onClick={onAbrirFormRuta} style={{ marginLeft: 'auto' }}>
            + Agregar ruta
          </button>
        )}
      </div>

      {mostrarFormRuta && (
        <form className="panel-form" onSubmit={onCrearRuta}>
          {usuario.rol === ROLES.SUPER_ADMIN && (
            <div className="field">
              <label htmlFor="formRutaEntidad">Entidad</label>
              <select
                id="formRutaEntidad"
                value={formRuta.entidad}
                onChange={(e) => setFormRuta({ ...formRuta, entidad: e.target.value })}
                required
              >
                <option value="">Selecciona…</option>
                {entidades.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="formRutaNumero">Número o nombre de ruta</label>
            <input
              id="formRutaNumero"
              value={formRuta.numero}
              onChange={(e) => setFormRuta({ ...formRuta, numero: e.target.value })}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={guardandoRuta}>
            {guardandoRuta ? 'Creando…' : 'Guardar ruta'}
          </button>
          <button className="btn-ghost" type="button" onClick={onCancelarFormRuta}>
            Cancelar
          </button>
        </form>
      )}
      {errorRuta && <p className="login-error" style={{ maxWidth: 400 }}>{errorRuta}</p>}

      {puedeFiltrarEntidad && grupos?.length > 0 && (
        <div className="panel-form">
          <div className="field">
            <label htmlFor="filtroEntidad">Entidad</label>
            <select id="filtroEntidad" value={filtroEntidad} onChange={(e) => setFiltroEntidad(e.target.value)}>
              <option value="">Todas ({grupos.length})</option>
              {grupos.map((g) => (
                <option key={g.entidad} value={g.entidad}>{g.entidad}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {error && <p className="login-error" style={{ maxWidth: 400 }}>{error}</p>}

      {grupos === null && !error && <p style={{ color: 'var(--gray-tx)', fontSize: 13.5 }}>Cargando…</p>}

      {grupos?.length === 0 && (
        <p style={{ color: 'var(--gray-tx)', fontSize: 13.5 }}>
          Todavía ninguna entidad ha capturado rutas para esta jornada.
        </p>
      )}

      {grupos
        ?.filter((g) => !filtroEntidad || g.entidad === filtroEntidad)
        .map((grupo) => (
        <div key={grupo.entidad} className="entidad-group">
          <div className="entidad-group__header">
            <h3>{grupo.entidad}</h3>
            <span className="entidad-group__meta">
              {grupo.rutas.length} {grupo.rutas.length === 1 ? 'ruta' : 'rutas'} · {grupo.totalUnidades}{' '}
              {grupo.totalUnidades === 1 ? 'unidad programada' : 'unidades programadas'}
            </span>
          </div>

          {grupo.rutas.map((ruta) => (
            <div key={ruta.id} className="ruta-block">
              <div className="ruta-block__header">
                <span className="nombre">Ruta {ruta.numero_o_nombre}</span>
                <span className="ruta-block__meta">
                  {ruta.visitas.length} {ruta.visitas.length === 1 ? 'unidad' : 'unidades'}
                </span>
                {puedeEscribir && (
                  <>
                    <button className="btn-ghost" onClick={() => onAbrirFormUnidad(ruta)}>
                      + Agregar unidad
                    </button>
                    <button className="btn-ghost" onClick={() => onEliminarRuta(ruta)}>
                      Eliminar ruta
                    </button>
                  </>
                )}
                <Link className="btn-ghost" to={`/rutas/${ruta.id}`}>
                  Editar →
                </Link>
              </div>

              {rutaAgregandoUnidadId === ruta.id && (
                <form
                  className="panel-form"
                  onSubmit={(e) => onCrearUnidad(e, ruta)}
                  style={{ flexWrap: 'wrap', marginLeft: 4 }}
                >
                  <div className="field" style={{ minWidth: 220 }}>
                    <label htmlFor={`clues-${ruta.id}`}>CLUES</label>
                    <input
                      id={`clues-${ruta.id}`}
                      list={`datalist-clues-${ruta.id}`}
                      placeholder="Busca por CLUES o nombre…"
                      value={autocompletadoUnidad ? `${formUnidad.clues} · ${formUnidad.unidad_medica_nombre}` : formUnidad.clues}
                      onChange={(e) => onCluesChangeUnidad(ruta, e.target.value)}
                      required
                    />
                    <datalist id={`datalist-clues-${ruta.id}`}>
                      {(catalogoUnidadesPorEntidad[ruta.entidad] || []).map((u) => (
                        <option key={u.clues} value={`${u.clues} · ${u.nombre}`} />
                      ))}
                    </datalist>
                  </div>
                  <div className="field">
                    <label htmlFor={`fecha-${ruta.id}`}>Fecha programada</label>
                    <input
                      id={`fecha-${ruta.id}`}
                      type="date"
                      value={formUnidad.fecha_distribucion_programada}
                      onChange={(e) => setFormUnidad({ ...formUnidad, fecha_distribucion_programada: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 130 }}>
                    <label htmlFor={`claves-${ruta.id}`}>Claves a desplazar</label>
                    <input
                      id={`claves-${ruta.id}`}
                      type="number"
                      min="0"
                      value={formUnidad.claves_a_desplazar}
                      onChange={(e) => setFormUnidad({ ...formUnidad, claves_a_desplazar: e.target.value })}
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 150 }}>
                    <label htmlFor={`med-${ruta.id}`}>Piezas medicamento</label>
                    <input
                      id={`med-${ruta.id}`}
                      type="number"
                      min="0"
                      value={formUnidad.piezas_medicamento}
                      onChange={(e) => setFormUnidad({ ...formUnidad, piezas_medicamento: e.target.value })}
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 150 }}>
                    <label htmlFor={`mat-${ruta.id}`}>Piezas material curación</label>
                    <input
                      id={`mat-${ruta.id}`}
                      type="number"
                      min="0"
                      value={formUnidad.piezas_material_curacion}
                      onChange={(e) => setFormUnidad({ ...formUnidad, piezas_material_curacion: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`recibe-${ruta.id}`}>¿Quién recibe?</label>
                    <input
                      id={`recibe-${ruta.id}`}
                      value={formUnidad.quien_recibe}
                      onChange={(e) => setFormUnidad({ ...formUnidad, quien_recibe: e.target.value })}
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 140 }}>
                    <label htmlFor={`tel-${ruta.id}`}>Teléfono</label>
                    <input
                      id={`tel-${ruta.id}`}
                      value={formUnidad.telefono}
                      onChange={(e) => setFormUnidad({ ...formUnidad, telefono: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`correo-${ruta.id}`}>Correo</label>
                    <input
                      id={`correo-${ruta.id}`}
                      type="email"
                      value={formUnidad.correo}
                      onChange={(e) => setFormUnidad({ ...formUnidad, correo: e.target.value })}
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={guardandoUnidad}>
                    {guardandoUnidad ? 'Guardando…' : '+ Agregar'}
                  </button>
                  <button className="btn-ghost" type="button" onClick={onCancelarFormUnidad}>
                    Cancelar
                  </button>
                </form>
              )}
              {errorUnidad && rutaAgregandoUnidadId === ruta.id && (
                <p className="login-error" style={{ maxWidth: 500, marginLeft: 4 }}>{errorUnidad}</p>
              )}

              {ruta.visitas.length === 0 ? (
                <p className="ruta-block__vacio">Sin unidades programadas todavía.</p>
              ) : (
                <div className="tablewrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha de distribución programada</th>
                        <th>Rutas</th>
                        <th>CLUES</th>
                        <th>Nombre de la unidad</th>
                        <th>Claves a desplazar</th>
                        <th>Piezas de medicamento</th>
                        <th>Piezas de material de curación</th>
                        <th>Tipo de unidad médica</th>
                        <th>¿Quién recibe en unidad?</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ruta.visitas.map((v) => (
                        <tr key={v.id}>
                          <td>{v.fecha_distribucion_programada}</td>
                          <td>{v.ruta_numero}</td>
                          <td>{v.unidad_medica}</td>
                          <td className="nombre">{v.unidad_medica_nombre}</td>
                          <td>{v.claves_a_desplazar}</td>
                          <td>{v.piezas_medicamento}</td>
                          <td>{v.piezas_material_curacion}</td>
                          <td>{v.tipo_unidad_medica}</td>
                          <td>{v.quien_recibe}</td>
                          <td>{v.telefono}</td>
                          <td>{v.correo}</td>
                          <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {puedeEscribir && (
                              <button className="btn-ghost" onClick={() => onEliminarUnidad(v.id)}>
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
