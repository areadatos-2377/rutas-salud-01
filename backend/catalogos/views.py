from rest_framework import permissions, viewsets

from usuarios.permissions import SoloLecturaOSuperAdmin

from .models import Entidad, UnidadMedica
from .serializers import EntidadSerializer, UnidadMedicaSerializer


class EntidadViewSet(viewsets.ModelViewSet):
    queryset = Entidad.objects.all()
    serializer_class = EntidadSerializer
    permission_classes = [permissions.IsAuthenticated, SoloLecturaOSuperAdmin]


class UnidadMedicaViewSet(viewsets.ModelViewSet):
    queryset = UnidadMedica.objects.select_related("entidad").all()
    serializer_class = UnidadMedicaSerializer
    permission_classes = [permissions.IsAuthenticated, SoloLecturaOSuperAdmin]

    def get_queryset(self):
        qs = super().get_queryset()
        # ?entidad=<id> -- el frontend lo usa para poblar el selector de CLUES
        # filtrado por entidad, igual que hace tools/captura-programacion/.
        entidad_id = self.request.query_params.get("entidad")
        if entidad_id:
            qs = qs.filter(entidad_id=entidad_id)
        return qs
