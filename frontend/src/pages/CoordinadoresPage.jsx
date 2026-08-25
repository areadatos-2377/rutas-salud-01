import { useEffect, useState } from 'react';
import { api } from '../api/client';
import '../styles/table.css';

function extraerLista(data) {
  return Array.isArray(data) ? data : data.results;
}

export default function CoordinadoresPage() {
  const [entidades, setEntidades] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function cargar() {
    const data = await api.get('/api/entidades/');
    setEntidades(extraerLista(data));
  }

  useEffect(() => {
    cargar();
  }, []);

  function onEditar(ent) {
    setEditandoId(ent.id);
    setValor(ent.coordinador || '');
    setError(null);
  }

  async function onGuardar(id) {
    setGuardando(true);
    setError(null);
    try {
      await api.patch(`/api/entidades/${id}/coordinador/`, { coordinador: valor });
      setEditandoId(null);
      await cargar();
    } catch {
      setError('No se pudo actualizar el coordinador.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">Administración</p>
          <h2>Coordinadores estatales</h2>
        </div>
      </div>
      <p style={{ color: 'var(--gray-tx)', fontSize: 13, marginTop: -12, marginBottom: 18 }}>
        Los coordinadores cambian cada cierto tiempo — actualízalos aquí sin tocar el resto del catálogo de entidades.
      </p>

      {error && <p className="login-error" style={{ maxWidth: 400 }}>{error}</p>}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Coordinador</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {entidades === null && (
              <tr><td colSpan={3} className="tabla-vacia">Cargando…</td></tr>
            )}
            {entidades?.map((ent) => (
              <tr key={ent.id}>
                <td className="nombre">{ent.nombre}</td>
                <td>
                  {editandoId === ent.id ? (
                    <input value={valor} onChange={(e) => setValor(e.target.value)} autoFocus />
                  ) : (
                    ent.coordinador || <span style={{ color: 'var(--gray-tx)' }}>Sin asignar</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {editandoId === ent.id ? (
                    <>
                      <button className="btn-primary" onClick={() => onGuardar(ent.id)} disabled={guardando} style={{ marginRight: 6 }}>
                        {guardando ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button className="btn-ghost" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button className="btn-ghost" onClick={() => onEditar(ent)}>
                      Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
