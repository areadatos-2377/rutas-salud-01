from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Usuario


class EsSuperAdmin(BasePermission):
    """Solo super_admin. Para funciones exclusivas (blueprint-v01.md sección 3)."""

    def has_permission(self, request, view):
        usuario = request.user
        return bool(usuario and usuario.is_authenticated and usuario.rol == Usuario.ROL_SUPER_ADMIN)


class SoloLecturaOSuperAdmin(BasePermission):
    """Catálogos: cualquier autenticado lee, solo super_admin escribe (blueprint-v01.md sección 4)."""

    def has_permission(self, request, view):
        usuario = request.user
        if not (usuario and usuario.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return usuario.rol == Usuario.ROL_SUPER_ADMIN


class PuedeGestionarJornadas(BasePermission):
    """Todos leen; solo admin_nacional/super_admin abren/editan jornadas (blueprint-v01.md sección 2.1)."""

    def has_permission(self, request, view):
        usuario = request.user
        if not (usuario and usuario.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return usuario.rol in (Usuario.ROL_ADMIN_NACIONAL, Usuario.ROL_SUPER_ADMIN)


class PuedeGestionarProgramacion(BasePermission):
    """usuario_entidad y super_admin leen/escriben; admin_nacional solo lee
    (blueprint-v01.md secciones 2.5 y 3: "el administrador nacional solo puede
    ver las programaciones que hacen los usuarios")."""

    def has_permission(self, request, view):
        usuario = request.user
        if not (usuario and usuario.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return usuario.rol in (Usuario.ROL_USUARIO_ENTIDAD, Usuario.ROL_SUPER_ADMIN)
