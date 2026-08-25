from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from usuarios.permissions import PuedeEditarCoordinador, SoloLecturaOSuperAdmin

from .models import Entidad, UnidadMedica
from .serializers import EntidadSerializer, UnidadMedicaSerializer


class EntidadViewSet(viewsets.ModelViewSet):
    queryset = Entidad.objects.all()
    serializer_class = EntidadSerializer
    permission_classes = [permissions.IsAuthenticated, SoloLecturaOSuperAdmin]

    @action(
        detail=True,
        methods=["patch"],
        url_path="coordinador",
        permission_classes=[permissions.IsAuthenticated, PuedeEditarCoordinador],
    )
    def actualizar_coordinador(self, request, pk=None):
        """Catálogo de coordinadores estatales: cambian cada cierto tiempo, y a
        diferencia del resto del catálogo de entidades (exclusivo de
        super_admin), admin_nacional también puede actualizar este campo."""
        entidad = self.get_object()
        entidad.coordinador = request.data.get("coordinador", "").strip()
        entidad.save(update_fields=["coordinador"])
        return Response(EntidadSerializer(entidad).data)


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
