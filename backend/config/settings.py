"""
Django settings for config project (Rutas_01).

Ver blueprint/blueprint-v01.md y blueprint/diagrama-er-v01.md para el
modelo de datos y las reglas de negocio detrás de estos apps.
"""

import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "django-insecure-dev-only-change-in-prod")

DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if h.strip()
]
# Railway inyecta el dominio publico del servicio en esta variable.
_railway_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN")
if _railway_domain:
    ALLOWED_HOSTS.append(_railway_domain)

# Railway termina HTTPS en su proxy y le manda HTTP liso al contenedor -- sin
# esto, Django cree que toda peticion es HTTP, y arma los links "next" de
# paginacion (request.build_absolute_uri) como http://, que el navegador
# bloquea como "Mixed Content" al pedirlos desde una pagina https:// (asi
# se manifesto: api.getAll() fallaba en cuanto una lista pasaba de 50 filas
# y habia que pedir la pagina 2). No afecta desarrollo local: el dev server
# de Django nunca manda este header a si mismo.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "catalogos",
    "usuarios",
    "programacion",
    "entregas",
    "historico",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Base de datos: usa DATABASE_URL si existe (Railway/Postgres en produccion),
# si no cae a SQLite local para no depender de Postgres en desarrollo.
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
    )
}

AUTH_USER_MODEL = "usuarios.Usuario"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-mx"
TIME_ZONE = "America/Mexico_City"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# whitenoise: sirve el admin de Django (y cualquier estatico) directo desde
# el proceso de gunicorn en Railway, sin necesitar nginx/CDN aparte.
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "usuarios.authentication.SessionAuthenticationCon401",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
}

# Para armar el enlace completo de activacion de cuenta que ve el
# super_admin (el backend no sabe en que dominio vive el frontend).
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5183")

# Cloudflare R2 (compatible S3) para evidencia de entregas -- ver
# entregas/storage.py y blueprint/setup-cloudflare-r2.md. Sin default de
# credenciales (no hay uno seguro); si faltan, solo los endpoints de
# evidencia fallan, el resto de la app sigue funcionando normal.
STORAGE_ENDPOINT_URL = os.environ.get("STORAGE_ENDPOINT_URL")
STORAGE_ACCESS_KEY_ID = os.environ.get("STORAGE_ACCESS_KEY_ID")
STORAGE_SECRET_ACCESS_KEY = os.environ.get("STORAGE_SECRET_ACCESS_KEY")
STORAGE_BUCKET_NAME = os.environ.get("STORAGE_BUCKET_NAME", "rutas-evidencias")

CORS_ALLOWED_ORIGINS = [
    o.strip()
    # 5173 es el default de Vite, pero en esta maquina ya lo ocupa otro
    # proyecto -- el frontend de Rutas_01 corre en 5183 (ver vite.config.js).
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5183").split(",")
    if o.strip()
]
# El frontend usa cookies de sesion (SessionAuthentication) desde otro puerto/origen
# en desarrollo (5183 -> 8010), asi que el navegador necesita permiso explicito para
# mandar/recibir esa cookie cross-origin, y Django necesita confiar en ese origen
# para aceptar el POST protegido por CSRF.
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# En Railway, frontend y backend viven en subdominios *.up.railway.app
# distintos -- cada uno es un "sitio" distinto para el navegador (no solo un
# origen distinto, como localhost:5183 -> localhost:8010 en desarrollo). Con
# SameSite=Lax (default de Django) el navegador manda la cookie de sesion en
# el login pero la bloquea en los fetch() cross-site siguientes, y la app
# parece desloguearse sola segundos despues de entrar. SameSite=None arregla
# eso, pero exige Secure=True (que en desarrollo, sobre http://localhost,
# haria que el navegador nunca mandara la cookie) -- por eso solo aplica
# cuando DEBUG=False.
if not DEBUG:
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SECURE = True
