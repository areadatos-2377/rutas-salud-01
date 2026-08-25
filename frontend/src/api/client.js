// Cliente HTTP minimo hacia el backend Django/DRF.
// SessionAuthentication vive en una cookie httpOnly=false + CSRF token en
// otra cookie legible por JS -- por eso credentials:'include' en todo, y el
// header X-CSRFToken en cualquier metodo que no sea GET/HEAD/OPTIONS.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function leerCookie(nombre) {
  const match = document.cookie.match(new RegExp('(^| )' + nombre + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

export class ApiError extends Error {
  constructor(status, data) {
    super(typeof data === 'string' ? data : JSON.stringify(data));
    this.status = status;
    this.data = data;
  }
}

async function peticion(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!METODOS_SEGUROS.has(method)) {
    const csrftoken = leerCookie('csrftoken');
    if (csrftoken) headers['X-CSRFToken'] = csrftoken;
  }

  const resp = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (resp.status === 204) return null;

  const contentType = resp.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text();

  if (!resp.ok) throw new ApiError(resp.status, data);
  return data;
}

export const api = {
  primarCsrf: () => peticion('/api/auth/csrf/'),
  login: (username, password) => peticion('/api/auth/login/', { method: 'POST', body: { username, password } }),
  logout: () => peticion('/api/auth/logout/', { method: 'POST' }),
  yo: () => peticion('/api/auth/me/'),

  get: (path) => peticion(path),
  post: (path, body) => peticion(path, { method: 'POST', body }),
  patch: (path, body) => peticion(path, { method: 'PATCH', body }),
  del: (path) => peticion(path, { method: 'DELETE' }),
};
