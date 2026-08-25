import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth, ROLES } from '../auth/AuthContext';
import '../styles/table.css';
import './JornadaDetallePage.css';

const TIPO_LABEL = { ordinaria: 'Ordinaria', extraordinaria: 'Extraordinaria', emergencia: 'Emergencia' };
const CATEGORIA_LABEL = { primer_nivel: 'Primer nivel', segundo_tercer_nivel: 'Segundo y tercer nivel' };

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

  const [jornada, setJornada] = useState(null);
  const [grupos, setGrupos] = useState(null);
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/api/jornadas/${id}/`),
      api.getAll(`/api/rutas/?jornada=${id}`),
      api.getAll(`/api/programacion-visitas/?jornada=${id}`),
    ])
      .then(([j, rutas, visitas]) => {
        setJornada(j);
        setGrupos(agruparPorEntidad(rutas, visitas));
      })
      .catch(() => setError('No se pudo cargar el detalle de la jornada.'));
  }, [id]);

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
      </div>

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
                <Link className="btn-ghost" to={`/rutas/${ruta.id}`}>
                  Editar →
                </Link>
              </div>

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
