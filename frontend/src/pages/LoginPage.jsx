import { useState } from 'react';
import { LockKeyhole, Mail } from 'lucide-react';
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
      <form className="login-card login-card--signin" onSubmit={onSubmit}>
        <header className="login-heading">
          <div className="login-logo" aria-label="IMSS Bienestar, Servicios Públicos de Salud">
            <img src="/logos/logo_rutas.png" alt="" />
          </div>
          <h1>Rutas de la salud</h1>
          <p className="login-sub">Acceso con usuario autorizado</p>
        </header>

        {sesionExpirada && (
          <p className="login-error">Tu sesión expiró. Vuelve a iniciar sesión para continuar.</p>
        )}

        <div className="field login-field">
          <label htmlFor="username">Correo electrónico o usuario</label>
          <div className="login-input">
            <Mail aria-hidden="true" size={18} strokeWidth={1.7} />
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="correo@imssbienestar.gob.mx o usuario"
              required
            />
          </div>
        </div>
        <div className="field login-field">
          <label htmlFor="password">Contraseña</label>
          <div className="login-input">
            <LockKeyhole aria-hidden="true" size={18} strokeWidth={1.7} />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="btn-primary login-submit" type="submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Iniciar sesión'}
        </button>

        <footer className="login-footer">
          <span>IMSS Bienestar</span>
          <span aria-hidden="true">·</span>
          <span>Servicios Públicos de Salud</span>
        </footer>
      </form>
    </div>
  );
}
