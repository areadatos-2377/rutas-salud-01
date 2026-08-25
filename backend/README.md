# Backend — Rutas_01

Django 5 + Django REST Framework. Ver `blueprint/blueprint-v01.md` y `blueprint/diagrama-er-v01.md` para las reglas de negocio y el modelo de datos detrás de estos apps.

## Apps

| App | Contiene |
|---|---|
| `usuarios` | `Usuario` (custom, `AUTH_USER_MODEL`) — roles `super_admin` / `admin_nacional` / `usuario_entidad`. |
| `catalogos` | `Entidad`, `UnidadMedica` (CLUES como PK, admite altas manuales). |
| `programacion` | `Jornada`, `Ruta`, `ProgramacionVisita`. |
| `entregas` | `Entrega` (1 a 1 con `ProgramacionVisita`), `EvidenciaArchivo`. |
| `historico` | `HistoricoMovimientos` — bitácora genérica vía `ContentType`/`GenericForeignKey`. |

## Arrancar en local

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Sin `DATABASE_URL` en `.env`, cae automáticamente a SQLite local — no hace falta Postgres corriendo para desarrollar. En producción (Railway), `DATABASE_URL` la provee el addon de Postgres.

## Pendientes conocidos (no bloquean lo ya construido)

- Serializers/viewsets de DRF — modelos y admin ya están, falta la API expuesta.
- Autenticación de la API (por ahora `SessionAuthentication` vía DRF; falta decidir si se agrega JWT para el frontend React).
- Granularidad del bloqueo de `ProgramacionVisita.bloqueada` a nivel Jornada completa (hoy es por fila) — ver nota en `programacion/models.py`.
- Backend de almacenamiento de `EvidenciaArchivo.archivo` (object storage vs filesystem) — ver nota en `entregas/models.py` y `blueprint/blueprint-v01.md` sección 9.
- Ciclo de vida completo de `Jornada.estatus` — los 4 valores actuales son un punto de partida, no una decisión cerrada con el área.
