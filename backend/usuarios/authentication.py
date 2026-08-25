from rest_framework.authentication import SessionAuthentication


class SessionAuthenticationCon401(SessionAuthentication):
    """SessionAuthentication de DRF no manda WWW-Authenticate, asi que por
    default una peticion sin sesion (o con sesion expirada) responde 403 en
    vez de 401 -- son casos distintos: 401 es "no estas autenticado", 403 es
    "estas autenticado pero no tienes permiso". El frontend necesita
    distinguirlos para saber cuando mandar a la persona de vuelta al login
    (401) y cuando no (403, un usuario_entidad viendo algo de otro rol).
    """

    def authenticate_header(self, request):
        return "Session"
