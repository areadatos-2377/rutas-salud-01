from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from usuarios.views import cerrar_sesion, iniciar_sesion, yo

router = DefaultRouter()
# Los viewsets de catalogos y programacion se registran aqui conforme se construyen.

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", iniciar_sesion),
    path("api/auth/logout/", cerrar_sesion),
    path("api/auth/me/", yo),
    path("api/", include(router.urls)),
    # Login/logout navegables del browsable API de DRF, util en desarrollo.
    path("api-auth/", include("rest_framework.urls")),
]
