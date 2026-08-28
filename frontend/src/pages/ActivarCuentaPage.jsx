import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import './LoginPage.css';

export default function ActivarCuentaPage() {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  const [estado, setEstado] = useState('validando'); // validando | valido | invalido
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Quien llega aqui nunca inicio sesion -- sin esto no hay token CSRF
    // guardado en memoria para el POST de mas abajo.
    api.primarCsrf().then(() => {
      api
        .get(`/api/auth/activar/${uidb64}/${token}/`)
        .then((datos) => {
          if (datos.valido) {
            setUsername(datos.username);
            setEstado('valido');
          } else {
            setEstado('invalido');
          }
        })
        .catch(() => setEstado('invalido'));
    });
  }, [uidb64, token]);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      await api.post(`/api/auth/activar/${uidb64}/${token}/`, { password });
      setListo(true);
    } catch (err) {
      if (err instanceof ApiError && err.data?.password) {
        setError(err.data.password.join(' '));
      } else {
        setError('No se pudo definir la contraseña. Intenta de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark">R</div>
        <h1>Rutas de la salud</h1>

        {estado === 'validando' && <p className="login-sub">Verificando enlace…</p>}

        {estado === 'invalido' && (
          <p className="login-error">
            Este enlace ya no es válido o expiró. Pide a tu administrador que te genere uno nuevo.
          </p>
        )}

        {estado === 'valido' && !listo && (
          <>
            <p className="login-sub">Hola, {username}. Crea tu contraseña para activar tu cuenta.</p>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="confirmar">Confirmar contraseña</label>
                <input
                  id="confirmar"
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              {error && <p className="login-error">{error}</p>}
              <button className="btn-primary login-submit" type="submit" disabled={enviando}>
                {enviando ? 'Guardando…' : 'Activar cuenta'}
              </button>
            </form>
          </>
        )}

        {listo && (
          <>
            <p className="login-success">Listo, tu cuenta quedó activada. Ya puedes iniciar sesión.</p>
            <button className="btn-primary login-submit" onClick={() => navigate('/login')}>
              Ir a iniciar sesión
            </button>
          </>
        )}

        {estado === 'invalido' && (
          <Link to="/login" style={{ fontSize: 12.5, textAlign: 'center' }}>
            Volver a iniciar sesión
          </Link>
        )}
      </div>
    </div>
  );
}
