import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';

const AuthContext = createContext(null);

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_NACIONAL: 'admin_nacional',
  USUARIO_ENTIDAD: 'usuario_entidad',
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        await api.primarCsrf();
        const datos = await api.yo();
        setUsuario(datos);
      } catch {
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const iniciarSesion = useCallback(async (username, password) => {
    const datos = await api.login(username, password);
    setUsuario(datos);
    return datos;
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await api.logout();
    } catch (err) {
      // si la sesion ya habia expirado del lado del servidor, no es un error real
      if (!(err instanceof ApiError) || err.status !== 401) throw err;
    }
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
