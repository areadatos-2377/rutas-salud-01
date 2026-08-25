import { useEffect, useState } from 'react';
import { api } from '../api/client';
import '../styles/table.css';

function extraerLista(data) {
  return Array.isArray(data) ? data : data.results;
}

const FORM_VACIO = { clues: '', nombre: '', entidad: '', tipo_unidad_medica: '', municipio: '' };

export default function UnidadesMedicasPage() {
  const [entidades, setEntidades] = useState([]);
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [unidades, setUnidades] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/api/entidades/').then((data) => setEntidades(extraerLista(data)));
  }, []);

  async function cargar() {
    const path = filtroEntidad ? `/api/unidades-medicas/?entidad=${filtroEntidad}` : '/api/unidades-medicas/';
    const data = await api.get(path);
    setUnidades(extraerLista(data));
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEntidad]);

  async function onCrear(e) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api.post('/api/unidades-medicas/', { ...form, entidad: Number(form.entidad), origen: 'manual' });
      setForm(FORM_VACIO);
      await cargar();
    } catch (err) {
      setError(err?.data?.clues?.[0] || 'No se pudo crear la unidad médica.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">Administración</p>
          <h2>Unidades médicas</h2>
        </div>
      </div>

      <div className="panel-form">
        <div className="field">
          <label htmlFor="filtro">Filtrar por entidad</label>
          <select id="filtro" value={filtroEntidad} onChange={(e) => setFiltroEntidad(e.target.value)}>
            <option value="">Todas</option>
            {entidades.map((ent) => (
              <option key={ent.id} value={ent.id}>{ent.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <form className="panel-form" onSubmit={onCrear} style={{ flexWrap: 'wrap' }}>
        <div className="field">
          <label htmlFor="clues">CLUES</label>
          <input
            id="clues"
            value={form.clues}
            onChange={(e) => setForm({ ...form, clues: e.target.value.toUpperCase() })}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="nombreUnidad">Nombre</label>
          <input id="nombreUnidad" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </div>
        <div className="field">
          <label htmlFor="entidadUnidad">Entidad</label>
          <select
            id="entidadUnidad"
            value={form.entidad}
            onChange={(e) => setForm({ ...form, entidad: e.target.value })}
            required
          >
            <option value="">Selecciona…</option>
            {entidades.map((ent) => (
              <option key={ent.id} value={ent.id}>{ent.nombre}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tipo">Tipo de unidad médica</label>
          <input id="tipo" value={form.tipo_unidad_medica} onChange={(e) => setForm({ ...form, tipo_unidad_medica: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="municipio">Municipio</label>
          <input id="municipio" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
        </div>
        <button className="btn-primary" type="submit" disabled={guardando}>
          {guardando ? 'Creando…' : '+ Nueva unidad'}
        </button>
      </form>

      {error && <p className="login-error" style={{ maxWidth: 400 }}>{error}</p>}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>CLUES</th>
              <th>Nombre</th>
              <th>Entidad</th>
              <th>Tipo</th>
              <th>Origen</th>
            </tr>
          </thead>
          <tbody>
            {unidades === null && (
              <tr><td colSpan={5} className="tabla-vacia">Cargando…</td></tr>
            )}
            {unidades?.length === 0 && (
              <tr><td colSpan={5} className="tabla-vacia">No hay unidades médicas.</td></tr>
            )}
            {unidades?.map((u) => (
              <tr key={u.clues}>
                <td>{u.clues}</td>
                <td className="nombre">{u.nombre}</td>
                <td>{entidades.find((e) => e.id === u.entidad)?.nombre || u.entidad}</td>
                <td>{u.tipo_unidad_medica}</td>
                <td>
                  <span className={`badge ${u.origen === 'manual' ? 'dorado' : 'verde'}`}>
                    {u.origen === 'manual' ? 'Manual' : 'Catálogo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
