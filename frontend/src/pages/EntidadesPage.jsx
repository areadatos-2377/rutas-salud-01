import { useEffect, useState } from 'react';
import { api } from '../api/client';
import '../styles/table.css';

export default function EntidadesPage() {
  const [entidades, setEntidades] = useState(null);
  const [nombre, setNombre] = useState('');
  const [coordinador, setCoordinador] = useState('');
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setEntidades(await api.getAll('/api/entidades/'));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onCrear(e) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.post('/api/entidades/', { nombre, coordinador });
      setNombre('');
      setCoordinador('');
      await cargar();
    } catch {
      setError('No se pudo crear la entidad. ¿Ya existe una con ese nombre?');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">Administración</p>
          <h2>Entidades</h2>
        </div>
      </div>

      <form className="panel-form" onSubmit={onCrear}>
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="coordinador">Coordinador</label>
          <input id="coordinador" value={coordinador} onChange={(e) => setCoordinador(e.target.value)} />
        </div>
        <button className="btn-primary" type="submit" disabled={guardando}>
          {guardando ? 'Creando…' : '+ Nueva entidad'}
        </button>
      </form>

      {error && <p className="login-error" style={{ maxWidth: 400 }}>{error}</p>}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Coordinador</th>
            </tr>
          </thead>
          <tbody>
            {entidades === null && (
              <tr><td colSpan={2} className="tabla-vacia">Cargando…</td></tr>
            )}
            {entidades?.length === 0 && (
              <tr><td colSpan={2} className="tabla-vacia">Todavía no hay entidades.</td></tr>
            )}
            {entidades?.map((e) => (
              <tr key={e.id}>
                <td className="nombre">{e.nombre}</td>
                <td>{e.coordinador}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
