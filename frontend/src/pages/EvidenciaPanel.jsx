import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '../api/client';
import './EvidenciaPanel.css';

const TIPO_ICONO = { foto: '🖼️', video: '🎞️', pdf: '📄', documento: '📎' };

export default function EvidenciaPanel({ visita, onCerrar }) {
  const [entrega, setEntrega] = useState(null);
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardandoEntregado, setGuardandoEntregado] = useState(false);
  const inputArchivoRef = useRef(null);

  useEffect(() => {
    // Perezoso: se crea (o se reusa si ya existia) justo al abrir el panel,
    // no al precargar la unidad -- una jornada trae miles de unidades que
    // nunca reciben entrega de verdad.
    api.post('/api/entregas/', { programacion_visita: visita.id })
      .then(setEntrega)
      .catch(() => setError('No se pudo abrir la entrega de esta unidad.'));
  }, [visita.id]);

  async function onCambiarEntregado(e) {
    const entregado = e.target.checked;
    setGuardandoEntregado(true);
    setError(null);
    try {
      const actualizada = await api.patch(`/api/entregas/${entrega.id}/`, {
        entregado,
        fecha_entrega: entregado ? (entrega.fecha_entrega || new Date().toISOString().slice(0, 10)) : null,
      });
      setEntrega(actualizada);
    } catch {
      setError('No se pudo actualizar el estatus de entrega.');
    } finally {
      setGuardandoEntregado(false);
    }
  }

  async function onSubirArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', archivo);
      const evidencia = await api.post(`/api/entregas/${entrega.id}/evidencias/`, formData);
      setEntrega((actual) => ({ ...actual, evidencias: [evidencia, ...actual.evidencias] }));
    } catch (err) {
      const detalle = err instanceof ApiError && err.data ? err.data.detail : null;
      setError(detalle || 'No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
      if (inputArchivoRef.current) inputArchivoRef.current.value = '';
    }
  }

  async function onEliminarEvidencia(evidenciaId) {
    if (!confirm('¿Eliminar esta evidencia? No se puede deshacer.')) return;
    setError(null);
    try {
      await api.del(`/api/evidencias/${evidenciaId}/`);
      setEntrega((actual) => ({
        ...actual,
        evidencias: actual.evidencias.filter((ev) => ev.id !== evidenciaId),
      }));
    } catch {
      setError('No se pudo eliminar la evidencia.');
    }
  }

  return (
    <div className="evidencia-overlay" onClick={onCerrar}>
      <div className="evidencia-panel" onClick={(e) => e.stopPropagation()}>
        <div className="evidencia-panel__header">
          <div>
            <p className="crumb">{visita.unidad_medica}</p>
            <h3>{visita.unidad_medica_nombre}</h3>
          </div>
          <button className="btn-ghost" onClick={onCerrar}>Cerrar</button>
        </div>

        {error && <p className="login-error">{error}</p>}

        {!entrega && !error && <p className="tabla-cargando">Cargando…</p>}

        {entrega && (
          <>
            <label className="evidencia-panel__entregado">
              <input
                type="checkbox"
                checked={entrega.entregado}
                disabled={guardandoEntregado}
                onChange={onCambiarEntregado}
              />
              Entregado{entrega.fecha_entrega ? ` — ${entrega.fecha_entrega}` : ''}
            </label>

            <div className="evidencia-panel__lista">
              {entrega.evidencias.length === 0 && (
                <p className="evidencia-panel__vacio">Todavía no hay evidencia subida.</p>
              )}
              {entrega.evidencias.map((ev) => (
                <div key={ev.id} className="evidencia-item">
                  <span className="evidencia-item__icono">{TIPO_ICONO[ev.tipo] || '📎'}</span>
                  <div className="evidencia-item__info">
                    <a href={ev.url_descarga} target="_blank" rel="noreferrer">{ev.nombre_original}</a>
                    <span>{new Date(ev.creado_en).toLocaleString('es-MX')}</span>
                  </div>
                  <button className="btn-ghost" onClick={() => onEliminarEvidencia(ev.id)}>Eliminar</button>
                </div>
              ))}
            </div>

            <div className="evidencia-panel__subir">
              <input
                ref={inputArchivoRef}
                type="file"
                accept=".jpg,.jpeg,.png,.heic,.heif,.webp,.mp4,.mov,.pdf,.doc,.docx"
                disabled={subiendo}
                onChange={onSubirArchivo}
              />
              {subiendo && <span className="evidencia-panel__subiendo">Subiendo…</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
