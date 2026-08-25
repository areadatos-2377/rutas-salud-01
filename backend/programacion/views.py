from rest_framework import permissions, serializers, viewsets

from usuarios.models import Usuario
from usuarios.permissions import PuedeGestionarJornadas, PuedeGestionarProgramacion

from .models import Jornada, ProgramacionVisita, Ruta
from .serializers import JornadaSerializer, ProgramacionVisitaSerializer, RutaSerializer


class JornadaViewSet(viewsets.ModelViewSet):
    # Nacional: cualquier autenticado ve todas las jornadas, no se filtra por entidad.
    queryset = Jornada.objects.all()
    serializer_class = JornadaSerializer
    permission_classes = [permissions.IsAuthenticated, PuedeGestionarJornadas]


class RutaViewSet(viewsets.ModelViewSet):
    queryset = Ruta.objects.select_related("jornada", "entidad").all()
    serializer_class = RutaSerializer
    permission_classes = [permissions.IsAuthenticated, PuedeGestionarProgramacion]

    def get_queryset(self):
        qs = super().get_queryset()
        usuario = self.request.user
        if usuario.rol == Usuario.ROL_USUARIO_ENTIDAD:
            qs = qs.filter(entidad=usuario.entidad)
        jornada_id = self.request.query_params.get("jornada")
        if jornada_id:
            qs = qs.filter(jornada_id=jornada_id)
        return qs

    def perform_create(self, serializer):
        usuario = self.request.user
        if usuario.rol == Usuario.ROL_USUARIO_ENTIDAD:
            # Nunca confiar en el entidad que mande el cliente: se fuerza la propia.
            serializer.save(entidad=usuario.entidad)
        else:
            if "entidad" not in serializer.validated_data:
                raise serializers.ValidationError({"entidad": "Este campo es requerido."})
            serializer.save()


class ProgramacionVisitaViewSet(viewsets.ModelViewSet):
    queryset = ProgramacionVisita.objects.select_related(
        "ruta__jornada", "ruta__entidad", "unidad_medica"
    ).all()
    serializer_class = ProgramacionVisitaSerializer
    permission_classes = [permissions.IsAuthenticated, PuedeGestionarProgramacion]

    def get_queryset(self):
        qs = super().get_queryset()
        usuario = self.request.user
        if usuario.rol == Usuario.ROL_USUARIO_ENTIDAD:
            qs = qs.filter(ruta__entidad=usuario.entidad)
        ruta_id = self.request.query_params.get("ruta")
        if ruta_id:
            qs = qs.filter(ruta_id=ruta_id)
        return qs
