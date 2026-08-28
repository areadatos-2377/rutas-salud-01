from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.middleware.csrf import get_token
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Usuario
from .permissions import EsSuperAdmin
from .serializers import UsuarioMeSerializer, UsuarioSerializer


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    """GET -> ademas de asegurar la cookie csrftoken, devuelve el valor en el
    body: en produccion frontend y backend viven en dominios *.up.railway.app
    distintos, y document.cookie en el frontend nunca puede leer una cookie
    que puso un dominio distinto (a diferencia de localhost:5183 -> :8010 en
    desarrollo, mismo hostname). El body si es legible cross-origin porque
    CORS ya lo permite explicitamente."""
    return Response({"detail": "ok", "csrftoken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
def iniciar_sesion(request):
    """POST {username, password} -> inicia sesión (cookie) y devuelve el usuario.
    Django rota el token CSRF al hacer login() (rotate_token, previene
    fijacion de sesion) -- el valor que el frontend haya guardado de /csrf/
    antes de este POST queda obsoleto, por eso se devuelve el nuevo aqui
    tambien en vez de obligar a otra ronda a /csrf/."""
    usuario = authenticate(
        request, username=request.data.get("username"), password=request.data.get("password")
    )
    if usuario is None:
        return Response({"detail": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
    login(request, usuario)
    datos = UsuarioMeSerializer(usuario).data
    datos["csrftoken"] = get_token(request)
    return Response(datos)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cerrar_sesion(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def yo(request):
    """GET -> datos del usuario en sesión (rol, entidad) para que el frontend
    sepa qué mostrar/permitir sin duplicar la lógica de permisos."""
    return Response(UsuarioMeSerializer(request.user).data)


def _enlace_activacion(usuario):
    uidb64 = urlsafe_base64_encode(force_bytes(usuario.pk))
    token = default_token_generator.make_token(usuario)
    return f"{settings.FRONTEND_URL}/activar-cuenta/{uidb64}/{token}"


class UsuarioViewSet(viewsets.ModelViewSet):
    """Crear y administrar cuentas -- exclusivo de super_admin. Las cuentas se
    crean sin contraseña utilizable; la persona la define ella misma con el
    enlace de activación (mismo mecanismo de token que "olvidé mi
    contraseña" de Django: un hash que incorpora el password actual, así que
    se invalida solo en cuanto se usa, y expira solo a los pocos días)."""

    queryset = Usuario.objects.select_related("entidad").all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, EsSuperAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        usuario.set_unusable_password()
        usuario.save(update_fields=["password"])
        datos = serializer.data
        datos["enlace_activacion"] = _enlace_activacion(usuario)
        return Response(datos, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        # Evita que un super_admin se desactive a si mismo por accidente y
        # se quede sin poder volver a entrar a esta misma pantalla.
        usuario = self.get_object()
        if usuario.id == request.user.id and request.data.get("is_active") is False:
            return Response(
                {"detail": "No puedes desactivar tu propia cuenta."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="generar-token")
    def generar_token(self, request, pk=None):
        """Genera (o regenera) el enlace de activación -- para el alta
        inicial si se perdió el enlace, o para forzar el cambio de
        contraseña de alguien que la olvidó. Nota: esto invalida la
        contraseña ACTUAL de esa cuenta hasta que use el enlace nuevo."""
        usuario = self.get_object()
        usuario.set_unusable_password()
        usuario.save(update_fields=["password"])
        return Response({"enlace_activacion": _enlace_activacion(usuario)})


@api_view(["GET", "POST"])
@permission_classes([AllowAny])
def activar_cuenta(request, uidb64, token):
    """GET -> valida el enlace y saluda por nombre antes de mostrar el
    formulario. POST {password} -> define la contraseña si el enlace sigue
    siendo válido. Pública (AllowAny): quien entra nunca inició sesión."""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        usuario = Usuario.objects.get(pk=uid)
    except (Usuario.DoesNotExist, ValueError, TypeError, OverflowError):
        usuario = None

    valido = bool(usuario) and default_token_generator.check_token(usuario, token)

    if request.method == "GET":
        return Response({"valido": valido, "username": usuario.username if valido else None})

    if not valido:
        return Response({"detail": "Enlace inválido o expirado."}, status=status.HTTP_400_BAD_REQUEST)

    password = request.data.get("password", "")
    try:
        validate_password(password, user=usuario)
    except DjangoValidationError as exc:
        return Response({"password": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

    usuario.set_password(password)
    usuario.save(update_fields=["password"])
    return Response({"detail": "ok"})
