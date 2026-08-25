import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth, ROLES } from './auth/AuthContext';
import Shell from './components/Shell';
import LoginPage from './pages/LoginPage';
import JornadasPage from './pages/JornadasPage';
import RutasPage from './pages/RutasPage';
import ProgramacionVisitaPage from './pages/ProgramacionVisitaPage';
import EntidadesPage from './pages/EntidadesPage';
import UnidadesMedicasPage from './pages/UnidadesMedicasPage';

function RequireAuth({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// Ocultar el link del nav no basta -- sin esto, alguien que llegue por URL
// directa (o por el redirect "volver a donde estabas" tras un logout/login)
// podia VER paginas de otro rol, aunque el backend ya bloqueara escribir.
function RequireRole({ roles, children }) {
  const { usuario } = useAuth();
  if (!roles.includes(usuario?.rol)) return <Navigate to="/jornadas" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/jornadas" replace />} />
          <Route path="jornadas" element={<JornadasPage />} />
          <Route path="rutas" element={<RutasPage />} />
          <Route path="rutas/:id" element={<ProgramacionVisitaPage />} />
          <Route
            path="catalogos/entidades"
            element={
              <RequireRole roles={[ROLES.SUPER_ADMIN]}>
                <EntidadesPage />
              </RequireRole>
            }
          />
          <Route
            path="catalogos/unidades"
            element={
              <RequireRole roles={[ROLES.SUPER_ADMIN]}>
                <UnidadesMedicasPage />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
