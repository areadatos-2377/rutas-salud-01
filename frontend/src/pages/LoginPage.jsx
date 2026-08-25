import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import './LoginPage.css';

export default function LoginPage() {
  const { iniciarSesion, sesionExpirada } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(username, password);
      const destino = location.state?.from?.pathname || '/jornadas';
      navigate(destino, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Usuario o contraseña incorrectos.');
      } else {
        setError('No se pudo conectar con el servidor.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <div className="login-mark">R</div>
        <h1>Rutas de la salud</h1>
        <p className="login-sub">Programación y seguimiento de distribución · IMSS-Bienestar</p>

        {sesionExpirada && (
          <p className="login-error">Tu sesión expiró. Vuelve a iniciar sesión para continuar.</p>
        )}

        <div className="field">
          <label htmlFor="username">Usuario</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="btn-primary login-submit" type="submit" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
