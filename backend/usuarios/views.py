from django.contrib.auth import authenticate, login, logout
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
    """GET -> no hace nada mas que asegurar que el navegador tenga la cookie
    csrftoken. El frontend la llama una vez al arrancar, antes de cualquier
    POST (incluido login), porque Django no manda esa cookie por si solo en
    un backend sin templates."""
    return Response({"detail": "ok"})


@api_view(["POST"])
@permission_classes([AllowAny])
def iniciar_sesion(request):
    """POST {username, password} -> inicia sesión (cookie) y devuelve el usuario."""
    usuario = authenticate(
        request, username=request.data.get("username"), password=request.data.get("password")
    )
    if usuario is None:
        return Response({"detail": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
    login(request, usuario)
    return Response(UsuarioMeSerializer(usuario).data)


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
