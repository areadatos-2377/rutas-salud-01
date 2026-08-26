from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import UsuarioMeSerializer


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
