import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Shell from './components/Shell';
import LoginPage from './pages/LoginPage';
import JornadasPage from './pages/JornadasPage';
import RutasPage from './pages/RutasPage';
import ProgramacionVisitaPage from './pages/ProgramacionVisitaPage';
import Proximamente from './pages/Proximamente';

function RequireAuth({ children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return null;
  if (!usuario) return <Navigate to="/login" state={{ from: location }} replace />;
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
          <Route path="catalogos/entidades" element={<Proximamente titulo="Entidades" />} />
          <Route path="catalogos/unidades" element={<Proximamente titulo="Unidades médicas" />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
