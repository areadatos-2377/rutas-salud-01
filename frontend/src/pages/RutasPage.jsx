import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth, ROLES } from '../auth/AuthContext';
import '../styles/table.css';

function extraerLista(data) {
  return Array.isArray(data) ? data : data.results;
}

export default function RutasPage() {
  const { usuario } = useAuth();
  const puedeEscribir = usuario?.rol === ROLES.USUARIO_ENTIDAD || usuario?.rol === ROLES.SUPER_ADMIN;

  const [jornadas, setJornadas] = useState([]);
  const [jornadaId, setJornadaId] = useState('');
  const [entidades, setEntidades] = useState([]);
  const [rutas, setRutas] = useState(null);
  const [numero, setNumero] = useState('');
  const [entidadId, setEntidadId] = useState('');
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    api.get('/api/jornadas/').then((data) => {
      const lista = extraerLista(data);
      setJornadas(lista);
      if (lista.length) setJornadaId(String(lista[0].id));
    });
    if (usuario?.rol === ROLES.SUPER_ADMIN) {
      api.get('/api/entidades/').then((data) => setEntidades(extraerLista(data)));
    }
  }, [usuario]);

  useEffect(() => {
    if (!jornadaId) return;
    setRutas(null);
    api
      .get(`/api/rutas/?jornada=${jornadaId}`)
      .then((data) => setRutas(extraerLista(data)))
      .catch(() => setError('No se pudieron cargar las rutas.'));
  }, [jornadaId]);

  async function onCrear(e) {
    e.preventDefault();
    setCreando(true);
    setError(null);
    try {
      const body = { jornada: Number(jornadaId), numero_o_nombre: numero };
      if (usuario.rol === ROLES.SUPER_ADMIN) body.entidad = Number(entidadId);
      await api.post('/api/rutas/', body);
      setNumero('');
      const data = await api.get(`/api/rutas/?jornada=${jornadaId}`);
      setRutas(extraerLista(data));
    } catch {
      setError('No se pudo crear la ruta.');
    } finally {
      setCreando(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">Programación</p>
          <h2>Rutas</h2>
        </div>
      </div>

      <div className="panel-form">
        <div className="field">
          <label htmlFor="jornada">Jornada</label>
          <select id="jornada" value={jornadaId} onChange={(e) => setJornadaId(e.target.value)}>
            {jornadas.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {puedeEscribir && jornadaId && (
        <form className="panel-form" onSubmit={onCrear}>
          {usuario.rol === ROLES.SUPER_ADMIN && (
            <div className="field">
              <label htmlFor="entidad">Entidad</label>
              <select
                id="entidad"
                value={entidadId}
                onChange={(e) => setEntidadId(e.target.value)}
                required
              >
                <option value="">Selecciona…</option>
                {entidades.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field">
            <label htmlFor="numero">Número o nombre de ruta</label>
            <input id="numero" value={numero} onChange={(e) => setNumero(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" disabled={creando}>
            {creando ? 'Creando…' : '+ Nueva ruta'}
          </button>
        </form>
      )}

      {error && <p className="login-error" style={{ maxWidth: 400 }}>{error}</p>}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Entidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rutas === null && (
              <tr><td colSpan={3} className="tabla-vacia">Cargando…</td></tr>
            )}
            {rutas?.length === 0 && (
              <tr><td colSpan={3} className="tabla-vacia">Todavía no hay rutas para esta jornada.</td></tr>
            )}
            {rutas?.map((r) => (
              <tr key={r.id}>
                <td className="nombre">Ruta {r.numero_o_nombre}</td>
                <td>{r.entidad_nombre}</td>
                <td style={{ textAlign: 'right' }}>
                  <Link className="btn-ghost" to={`/rutas/${r.id}`}>
                    Ver programación
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
