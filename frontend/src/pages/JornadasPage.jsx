import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth, ROLES } from '../auth/AuthContext';
import '../styles/table.css';

const TIPO_LABEL = { ordinaria: 'Ordinaria', extraordinaria: 'Extraordinaria', emergencia: 'Emergencia' };
const CATEGORIA_LABEL = { primer_nivel: 'Primer nivel', segundo_tercer_nivel: 'Segundo y tercer nivel' };
const ESTATUS_BADGE = {
  planeada: 'gris',
  en_curso: 'verde',
  cerrada: 'dorado',
  cancelada: 'guinda',
};

export default function JornadasPage() {
  const { usuario } = useAuth();
  const puedeCrear = usuario?.rol === ROLES.ADMIN_NACIONAL || usuario?.rol === ROLES.SUPER_ADMIN;

  const [jornadas, setJornadas] = useState(null);
  const [error, setError] = useState(null);
  const [formulario, setFormulario] = useState({
    nombre: '', tipo: 'ordinaria', categoria: 'primer_nivel', fecha_inicio: '', fecha_fin: '',
  });
  const [creando, setCreando] = useState(false);

  async function cargar() {
    try {
      setJornadas(await api.getAll('/api/jornadas/'));
    } catch {
      setError('No se pudieron cargar las jornadas.');
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onCrear(e) {
    e.preventDefault();
    setCreando(true);
    setError(null);
    try {
      await api.post('/api/jornadas/', formulario);
      setFormulario({ nombre: '', tipo: 'ordinaria', categoria: 'primer_nivel', fecha_inicio: '', fecha_fin: '' });
      await cargar();
    } catch {
      setError('No se pudo crear la jornada. Revisa los datos.');
    } finally {
      setCreando(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">Programación</p>
          <h2>Jornadas</h2>
        </div>
      </div>

      {puedeCrear && (
        <form className="panel-form" onSubmit={onCrear}>
          <div className="field">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              placeholder="p. ej. sexta distribución"
              value={formulario.nombre}
              onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              value={formulario.tipo}
              onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
            >
              <option value="ordinaria">Ordinaria</option>
              <option value="extraordinaria">Extraordinaria</option>
              <option value="emergencia">Emergencia</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="categoria">Categoría</label>
            <select
              id="categoria"
              value={formulario.categoria}
              onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
            >
              <option value="primer_nivel">Primer nivel</option>
              <option value="segundo_tercer_nivel">Segundo y tercer nivel</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="fecha_inicio">Fecha inicio</label>
            <input
              id="fecha_inicio"
              type="date"
              value={formulario.fecha_inicio}
              onChange={(e) => setFormulario({ ...formulario, fecha_inicio: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="fecha_fin">Fecha fin</label>
            <input
              id="fecha_fin"
              type="date"
              value={formulario.fecha_fin}
              onChange={(e) => setFormulario({ ...formulario, fecha_fin: e.target.value })}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={creando}>
            {creando ? 'Creando…' : '+ Nueva jornada'}
          </button>
        </form>
      )}

      {error && <p className="login-error" style={{ maxWidth: 400 }}>{error}</p>}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Fecha inicio</th>
              <th>Fecha fin</th>
              <th>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {jornadas === null && (
              <tr><td colSpan={6} className="tabla-vacia">Cargando…</td></tr>
            )}
            {jornadas?.length === 0 && (
              <tr><td colSpan={6} className="tabla-vacia">Todavía no hay jornadas.</td></tr>
            )}
            {jornadas?.map((j) => (
              <tr key={j.id}>
                <td className="nombre">{j.nombre}</td>
                <td>{TIPO_LABEL[j.tipo] || j.tipo}</td>
                <td>{CATEGORIA_LABEL[j.categoria] || j.categoria}</td>
                <td>{j.fecha_inicio}</td>
                <td>{j.fecha_fin}</td>
                <td>
                  <span className={`badge ${ESTATUS_BADGE[j.estatus] || 'gris'}`}>{j.estatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
