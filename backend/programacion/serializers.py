from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from catalogos.models import Entidad
from usuarios.models import Usuario

from .models import Jornada, ProgramacionVisita, Ruta


class JornadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Jornada
        fields = ["id", "nombre", "tipo", "categoria", "fecha_inicio", "fecha_fin", "estatus"]


class RutaSerializer(serializers.ModelSerializer):
    jornada_nombre = serializers.CharField(source="jornada.nombre", read_only=True)
    jornada_categoria = serializers.CharField(source="jornada.categoria", read_only=True)
    entidad_nombre = serializers.CharField(source="entidad.nombre", read_only=True)
    # No requerido aqui: para usuario_entidad el viewset lo fuerza server-side en
    # perform_create y el frontend ni lo manda. Solo super_admin debe mandarlo
    # explicitamente (el viewset valida eso).
    entidad = serializers.PrimaryKeyRelatedField(queryset=Entidad.objects.all(), required=False)

    class Meta:
        model = Ruta
        fields = [
            "id",
            "jornada",
            "jornada_nombre",
            "jornada_categoria",
            "entidad",
            "entidad_nombre",
            "numero_o_nombre",
        ]


class ProgramacionVisitaSerializer(serializers.ModelSerializer):
    unidad_medica_nombre = serializers.CharField(source="unidad_medica.nombre", read_only=True)
    ruta_numero = serializers.CharField(source="ruta.numero_o_nombre", read_only=True)

    class Meta:
        model = ProgramacionVisita
        fields = [
            "id",
            "ruta",
            "ruta_numero",
            "unidad_medica",
            "unidad_medica_nombre",
            "fecha_distribucion_programada",
            "claves_a_desplazar",
            "piezas_medicamento",
            "piezas_material_curacion",
            "tipo_unidad_medica",
            "quien_recibe",
            "telefono",
            "correo",
            "bloqueada",
        ]

    def validate(self, attrs):
        request = self.context["request"]
        ruta = attrs.get("ruta", self.instance.ruta if self.instance else None)
        unidad_medica = attrs.get(
            "unidad_medica", self.instance.unidad_medica if self.instance else None
        )

        # Un usuario_entidad no puede programar sobre la ruta de otra entidad
        # (defensa en profundidad: get_queryset del viewset ya lo evita en
        # list/retrieve, esto cubre el create/update donde el cliente elige la ruta).
        if request.user.rol == Usuario.ROL_USUARIO_ENTIDAD and ruta.entidad_id != request.user.entidad_id:
            raise serializers.ValidationError("No puedes programar sobre una ruta de otra entidad.")

        # Reusa la regla de negocio del modelo (blueprint-v01.md seccion 2.2):
        # una unidad medica no puede estar en mas de una ruta de la misma jornada.
        # ModelSerializer no llama full_clean()/clean() del modelo automaticamente,
        # asi que se invoca aqui a mano.
        instancia = ProgramacionVisita(
            pk=self.instance.pk if self.instance else None,
            ruta=ruta,
            unidad_medica=unidad_medica,
        )
        try:
            instancia.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(getattr(exc, "message_dict", exc.messages))

        return attrs
