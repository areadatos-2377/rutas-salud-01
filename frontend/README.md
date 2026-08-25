# Frontend — Rutas_01

React 18 + Vite. Consume la API en `backend/` (ver `backend/README.md`). Estética tomada de `legacy/propuesta-01-modulo-ce.html` (paleta guinda/verde/dorado, Fraunces + Manrope + JetBrains Mono) — ver `src/styles/tokens.css`.

## Arrancar en local

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Necesita el backend corriendo en paralelo (`cd backend && python manage.py runserver`) — sin eso, login falla porque no hay a quién llamar.

## Autenticación

`SessionAuthentication` de DRF: cookies, no tokens. El flujo es:

1. Al montar la app, `AuthProvider` llama `GET /api/auth/csrf/` (asegura la cookie `csrftoken`) y luego `GET /api/auth/me/` (si hay sesión activa, la retoma).
2. `POST /api/auth/login/` inicia sesión; el navegador guarda la cookie de sesión.
3. Cualquier POST/PATCH/DELETE posterior manda el header `X-CSRFToken` leído de la cookie (ver `src/api/client.js`).

## Estructura

| Carpeta | Contiene |
|---|---|
| `src/api/` | Cliente HTTP hacia el backend. |
| `src/auth/` | `AuthContext` — sesión, rol y entidad del usuario en memoria. |
| `src/components/` | `Shell` — layout de sidebar + contenido, con nav condicionado por rol. |
| `src/pages/` | Una página por vista/ruta. |
| `src/styles/` | Tokens de diseño + estilos compartidos (tabla, formularios). |

## Pendiente (no bloquea lo ya construido)

- Vistas de Rutas y ProgramacionVisita (la captura real) — por ahora son placeholders.
- Vistas de catálogos (Entidades, Unidades médicas) para `super_admin` — placeholders.
- Manejo de expiración de sesión más allá de un `catch` genérico.
