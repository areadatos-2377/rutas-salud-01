from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from catalogos.views import EntidadViewSet, UnidadMedicaViewSet
from programacion.views import JornadaViewSet, ProgramacionVisitaViewSet, RutaViewSet
from usuarios.views import cerrar_sesion, iniciar_sesion, yo

router = DefaultRouter()
router.register("entidades", EntidadViewSet)
router.register("unidades-medicas", UnidadMedicaViewSet)
router.register("jornadas", JornadaViewSet)
router.register("rutas", RutaViewSet)
router.register("programacion-visitas", ProgramacionVisitaViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", iniciar_sesion),
    path("api/auth/logout/", cerrar_sesion),
    path("api/auth/me/", yo),
    path("api/", include(router.urls)),
    # Login/logout navegables del browsable API de DRF, util en desarrollo.
    path("api-auth/", include("rest_framework.urls")),
]
