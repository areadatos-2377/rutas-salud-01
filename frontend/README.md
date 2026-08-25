# Frontend — Rutas_01

React 18 + Vite. Consume la API en `backend/` (ver `backend/README.md`). Estética tomada de `legacy/propuesta-01-modulo-ce.html` (paleta guinda/verde/dorado, Fraunces + Manrope + JetBrains Mono) — ver `src/styles/tokens.css`.

## Arrancar en local

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Arranca en **http://localhost:5183** (no 5173, el default de Vite — fijado en `vite.config.js` con `strictPort` porque en esta máquina el 5173 ya lo ocupa otro proyecto; si te choca en la tuya, cambia el puerto ahí y también `CORS_ALLOWED_ORIGINS` en `backend/.env`).

Necesita el backend corriendo en paralelo (`cd backend && python manage.py runserver 8010`) — sin eso, login falla porque no hay a quién llamar.

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

- Cambiar la propia contraseña desde el frontend (hoy solo vía el admin de Django en `/admin/`).
- Vistas de evidencia (bloqueado por pendientes de negocio, ver `blueprint/blueprint-v01.md` sección 9).
