import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth, ROLES } from '../auth/AuthContext';
import { NIVELES_POR_CATEGORIA, CATEGORIA_LABEL } from '../utils/categoriaNiveles';
import '../styles/table.css';

const CAMPOS_VACIOS = {
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

export default function ProgramacionVisitaPage() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const puedeEscribir = usuario?.rol === ROLES.USUARIO_ENTIDAD || usuario?.rol === ROLES.SUPER_ADMIN;

  const [ruta, setRuta] = useState(null);
  const [unidades, setUnidades] = useState([]);
  const [visitas, setVisitas] = useState(null);
  const [form, setForm] = useState(CAMPOS_VACIOS);
  const [autocompletado, setAutocompletado] = useState(false);
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  async function cargarVisitas() {
    // getAll, no get: una ruta con mas de 50 visitas no deberia perder
    // silenciosamente las que no caben en la primera pagina.
    setVisitas(await api.getAll(`/api/programacion-visitas/?ruta=${id}`));
  }

  useEffect(() => {
    api.get(`/api/rutas/${id}/`).then((r) => {
      setRuta(r);
      // getAll: entidades grandes tienen cientos/miles de unidades medicas --
      // con paginacion normal, el autocompletado solo hubiera mostrado las
      // primeras 50 y el resto habria sido invisible para quien captura.
      // nivel_atencion: el catalogo administrativo incluye los 3 niveles, pero
      // cada jornada es de UNA sola categoria (primer nivel, o segundo y
      // tercer nivel combinados) -- el autocompletado solo debe ofrecer
      // unidades que la API vaya a aceptar para esta jornada especifica.
      const nivelesPermitidos = NIVELES_POR_CATEGORIA[r.jornada_categoria] || 'PRIMER NIVEL';
      const params = new URLSearchParams({ entidad: r.entidad, nivel_atencion: nivelesPermitidos });
      api.getAll(`/api/unidades-medicas/?${params}`).then(setUnidades);
    });
    cargarVisitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function onCluesChange(valorInput) {
    const clues = valorInput.includes(' · ') ? valorInput.split(' · ')[0].trim() : valorInput.trim();
    const unidad = unidades.find((u) => u.clues === clues);
    if (unidad) {
      setForm((f) => ({
        ...f,
        clues,
        unidad_medica_nombre: unidad.nombre,
        tipo_unidad_medica: unidad.tipo_unidad_medica || '',
      }));
      setAutocompletado(true);
    } else {
      setForm((f) => ({ ...f, clues }));
      setAutocompletado(false);
    }
  }

  function onEditar(v) {
    setEditandoId(v.id);
    setAutocompletado(true);
    setForm({
      clues: v.unidad_medica,
      unidad_medica_nombre: v.unidad_medica_nombre,
      tipo_unidad_medica: v.tipo_unidad_medica || '',
      fecha_distribucion_programada: v.fecha_distribucion_programada,
      claves_a_desplazar: v.claves_a_desplazar,
      piezas_medicamento: v.piezas_medicamento,
      piezas_material_curacion: v.piezas_material_curacion,
      quien_recibe: v.quien_recibe || '',
      telefono: v.telefono || '',
      correo: v.correo || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onCancelarEdicion() {
    setEditandoId(null);
    setForm(CAMPOS_VACIOS);
    setAutocompletado(false);
    setError(null);
  }

  async function onGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    const cuerpo = {
      ruta: Number(id),
      unidad_medica: form.clues,
      fecha_distribucion_programada: form.fecha_distribucion_programada,
      claves_a_desplazar: Number(form.claves_a_desplazar) || 0,
      piezas_medicamento: Number(form.piezas_medicamento) || 0,
      piezas_material_curacion: Number(form.piezas_material_curacion) || 0,
      tipo_unidad_medica: form.tipo_unidad_medica,
      quien_recibe: form.quien_recibe,
      telefono: form.telefono,
      correo: form.correo,
    };
    try {
      if (editandoId) {
        await api.patch(`/api/programacion-visitas/${editandoId}/`, cuerpo);
      } else {
        await api.post('/api/programacion-visitas/', cuerpo);
      }
      setForm(CAMPOS_VACIOS);
      setAutocompletado(false);
      setEditandoId(null);
      await cargarVisitas();
    } catch (err) {
      if (err instanceof ApiError && err.data) {
        const mensaje = err.data.non_field_errors?.[0] || err.data.detail || JSON.stringify(err.data);
        setError(mensaje);
      } else {
        setError('No se pudo guardar la visita.');
      }
    } finally {
      setGuardando(false);
    }
  }

  async function onBorrar(visitaId) {
    if (!confirm('¿Eliminar esta visita programada?')) return;
    await api.del(`/api/programacion-visitas/${visitaId}/`);
    if (editandoId === visitaId) onCancelarEdicion();
    await cargarVisitas();
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <p className="crumb">
            <Link to="/rutas">Rutas</Link> · {ruta?.jornada_nombre}
            {ruta && (
              <span className={`badge ${ruta.jornada_categoria === 'primer_nivel' ? 'verde' : 'dorado'}`} style={{ marginLeft: 8 }}>
                {CATEGORIA_LABEL[ruta.jornada_categoria] || ruta.jornada_categoria}
              </span>
            )}
          </p>
          <h2>{ruta ? `${ruta.entidad_nombre} — Ruta ${ruta.numero_o_nombre}` : 'Cargando…'}</h2>
        </div>
      </div>

      {puedeEscribir && ruta && (
        <form className="panel-form" onSubmit={onGuardar} style={{ flexWrap: 'wrap' }}>
          <div className="field" style={{ minWidth: 220 }}>
            <label htmlFor="clues">CLUES</label>
            <input
              id="clues"
              list="datalist-clues"
              placeholder="Busca por CLUES o nombre…"
              value={autocompletado ? `${form.clues} · ${form.unidad_medica_nombre}` : form.clues}
              onChange={(e) => onCluesChange(e.target.value)}
              disabled={Boolean(editandoId)}
              required
            />
            <datalist id="datalist-clues">
              {unidades.map((u) => (
                <option key={u.clues} value={`${u.clues} · ${u.nombre}`} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="fecha">Fecha programada</label>
            <input
              id="fecha"
              type="date"
              value={form.fecha_distribucion_programada}
              onChange={(e) => setForm({ ...form, fecha_distribucion_programada: e.target.value })}
              required
            />
          </div>
          <div className="field" style={{ maxWidth: 130 }}>
            <label htmlFor="claves">Claves a desplazar</label>
            <input
              id="claves"
              type="number"
              min="0"
              value={form.claves_a_desplazar}
              onChange={(e) => setForm({ ...form, claves_a_desplazar: e.target.value })}
            />
          </div>
          <div className="field" style={{ maxWidth: 150 }}>
            <label htmlFor="med">Piezas medicamento</label>
            <input
              id="med"
              type="number"
              min="0"
              value={form.piezas_medicamento}
              onChange={(e) => setForm({ ...form, piezas_medicamento: e.target.value })}
            />
          </div>
          <div className="field" style={{ maxWidth: 150 }}>
            <label htmlFor="mat">Piezas material curación</label>
            <input
              id="mat"
              type="number"
              min="0"
              value={form.piezas_material_curacion}
              onChange={(e) => setForm({ ...form, piezas_material_curacion: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="recibe">¿Quién recibe?</label>
            <input
              id="recibe"
              value={form.quien_recibe}
              onChange={(e) => setForm({ ...form, quien_recibe: e.target.value })}
            />
          </div>
          <div className="field" style={{ maxWidth: 140 }}>
            <label htmlFor="tel">Teléfono</label>
            <input id="tel" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
            />
          </div>
          <button className="btn-primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : editandoId ? 'Guardar cambios' : '+ Agregar'}
          </button>
          {editandoId && (
            <button className="btn-ghost" type="button" onClick={onCancelarEdicion}>
              Cancelar
            </button>
          )}
        </form>
      )}

      {error && <p className="login-error" style={{ maxWidth: 500 }}>{error}</p>}

      <div className="tablewrap">
        <table>
          <thead>
            <tr>
              <th>CLUES</th>
              <th>Unidad</th>
              <th>Fecha</th>
              <th>Claves</th>
              <th>Medicamento</th>
              <th>Mat. curación</th>
              <th>Tipo unidad</th>
              <th>Quién recibe</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visitas === null && (
              <tr><td colSpan={9} className="tabla-vacia">Cargando…</td></tr>
            )}
            {visitas?.length === 0 && (
              <tr><td colSpan={9} className="tabla-vacia">Todavía no hay visitas programadas en esta ruta.</td></tr>
            )}
            {visitas?.map((v) => (
              <tr key={v.id}>
                <td>{v.unidad_medica}</td>
                <td className="nombre">{v.unidad_medica_nombre}</td>
                <td>{v.fecha_distribucion_programada}</td>
                <td>{v.claves_a_desplazar}</td>
                <td>{v.piezas_medicamento}</td>
                <td>{v.piezas_material_curacion}</td>
                <td>{v.tipo_unidad_medica}</td>
                <td>{v.quien_recibe}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {puedeEscribir && (
                    <>
                      <button className="btn-ghost" onClick={() => onEditar(v)} style={{ marginRight: 6 }}>
                        Editar
                      </button>
                      <button className="btn-ghost" onClick={() => onBorrar(v.id)}>
                        Eliminar
                      </button>
                    </>
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
